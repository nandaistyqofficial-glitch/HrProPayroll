import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  DEFAULT_OFFICE_SHIFT, 
  INITIAL_SHIFTS, 
  ShiftDefinition, 
  AttendanceDatabaseRecord, 
  POSTGRESQL_DDL_SCHEMA 
} from './src/types/databaseSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Database store for live sessions (persisted per server lifecycle)
// Key: `${employeeId}_${date}` -> AttendanceDatabaseRecord
const attendanceDatabase = new Map<string, AttendanceDatabaseRecord>();

// In-Memory Master Shifts List
let masterShifts: ShiftDefinition[] = [...INITIAL_SHIFTS];

// Helper to format Date to YYYY-MM-DD
function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse "HH:mm:ss" or ISO string to minutes from midnight
function getMinutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --------------------------------------------------------------------------
  // API ENDPOINT: GET & POST /api/shifts (PENGURUSAN JAM KERJA HRD)
  // --------------------------------------------------------------------------
  app.get('/api/shifts', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: masterShifts,
    });
  });

  app.post('/api/shifts', (req: Request, res: Response) => {
    const { shiftName, shiftCode, startTime, endTime, gracePeriodMinutes, standardWorkHours, breakDurationMinutes, description } = req.body;
    if (!shiftName || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Parameter shiftName, startTime, dan endTime diperlukan.',
      });
    }

    const newShift: ShiftDefinition = {
      id: `shift-custom-${Date.now()}`,
      shiftCode: shiftCode || `SHIFT-${startTime.replace(':', '')}`,
      shiftName,
      startTime: startTime.includes(':') && startTime.split(':').length === 2 ? `${startTime}:00` : startTime,
      endTime: endTime.includes(':') && endTime.split(':').length === 2 ? `${endTime}:00` : endTime,
      gracePeriodMinutes: Number(gracePeriodMinutes) || 0,
      standardWorkHours: Number(standardWorkHours) || 8.0,
      breakDurationMinutes: Number(breakDurationMinutes) || 0,
      description: description || `Jadual bertugas ${startTime} hingga ${endTime}`,
      isCustom: true,
    };

    masterShifts.push(newShift);
    res.status(201).json({
      success: true,
      message: `Shift "${newShift.shiftName}" berjaya didaftarkan.`,
      data: newShift,
    });
  });

  // --------------------------------------------------------------------------
  // API ENDPOINT 1: POST /api/attendance/check-in
  // Dinamik mengikut shift khusus setiap pekerja (09:00-18:00, 09:00-12:00, 12:00-16:00, dsb)
  // --------------------------------------------------------------------------
  app.post('/api/attendance/check-in', (req: Request, res: Response) => {
    const { 
      employeeId, 
      employeeNik, 
      employeeName, 
      company, 
      department, 
      location, 
      timestamp,
      shiftId,
      shiftStartTime,
      shiftGraceMinutes 
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Parameter employeeId diperlukan untuk mencatat check-in.',
      });
    }

    const checkInDate = timestamp ? new Date(timestamp) : new Date();
    const todayStr = getTodayDateString(checkInDate);
    const dbKey = `${employeeId}_${todayStr}`;

    // VALIDASI 1: Cek apakah sudah check-in di hari yang sama
    const existingRecord = attendanceDatabase.get(dbKey);
    if (existingRecord && existingRecord.checkInTime) {
      const timeFormatted = new Date(existingRecord.checkInTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return res.status(400).json({
        success: false,
        error: 'ALREADY_CHECKED_IN',
        message: `Karyawan sudah check-in hari ini pada pukul ${timeFormatted}. Percobaan check-in ganda ditolak.`,
        data: existingRecord,
      });
    }

    // CARI JADUAL SHIFT KHUSUS PEKERJA
    let targetShift = masterShifts.find(s => s.id === shiftId);
    if (!targetShift && shiftStartTime) {
      targetShift = {
        id: shiftId || 'shift-assigned',
        shiftCode: 'CUSTOM',
        shiftName: `Shift Khusus (${shiftStartTime})`,
        startTime: shiftStartTime.includes(':') && shiftStartTime.split(':').length === 2 ? `${shiftStartTime}:00` : shiftStartTime,
        endTime: '18:00:00',
        gracePeriodMinutes: Number(shiftGraceMinutes) ?? 15,
        standardWorkHours: 8.0,
        breakDurationMinutes: 60,
      };
    }
    if (!targetShift) {
      targetShift = DEFAULT_OFFICE_SHIFT;
    }

    // HITUNG KETERLAMBATAN (Late Minutes) BERDASARKAN SHIFT KARYAWAN
    const [startH, startM] = targetShift.startTime.split(':').map(Number);
    const shiftStartMinutes = startH * 60 + startM;
    const graceLimitMinutes = shiftStartMinutes + targetShift.gracePeriodMinutes;
    const actualMinutes = getMinutesFromMidnight(checkInDate);

    let lateMinutes = 0;
    let status: AttendanceDatabaseRecord['status'] = 'present';

    if (actualMinutes > graceLimitMinutes) {
      lateMinutes = Math.round(actualMinutes - shiftStartMinutes);
      status = 'late';
    }

    const newRecord: AttendanceDatabaseRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      employeeId,
      employeeNik: employeeNik || employeeId,
      employeeName: employeeName || 'Karyawan',
      company: company || 'Pustaka Union',
      department: department || 'Operasi & Penerbitan',
      date: todayStr,
      shiftId: targetShift.id,
      checkInTime: checkInDate.toISOString(),
      checkOutTime: null,
      status,
      lateMinutes,
      overtimeMinutes: 0,
      totalWorkMinutes: 0,
      netWorkHours: 0,
      breakDurationMinutes: targetShift.breakDurationMinutes,
      location: location || 'Pejabat Rasmi (Pustaka Union KL)',
      ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
      isManualEdit: false,
      isLockedForPayroll: false,
      notes: lateMinutes > 0 
        ? `Lewat ${lateMinutes} minit (Jadual Shift: ${targetShift.shiftName}, masuk melepasi had ${targetShift.startTime.slice(0, 5)} + ${targetShift.gracePeriodMinutes}m).` 
        : `Masuk kerja tepat waktu mengikut ${targetShift.shiftName}.`,
    };

    attendanceDatabase.set(dbKey, newRecord);

    return res.status(200).json({
      success: true,
      message: lateMinutes > 0 
        ? `Check-In Berjaya! Status: LEWAT (${lateMinutes} minit melebihi jadual shift ${targetShift.startTime.slice(0, 5)}).`
        : `Check-In Berjaya! Tepat waktu mengikut jadual ${targetShift.shiftName}. Selamat bertugas.`,
      data: newRecord,
      shift: targetShift,
      alignment: {
        lateMinutes,
        lateDeductionEstimate: (lateMinutes / 60) * (3500 / 26 / 8),
      }
    });
  });

  // --------------------------------------------------------------------------
  // API ENDPOINT 2: POST /api/attendance/check-out
  // --------------------------------------------------------------------------
  app.post('/api/attendance/check-out', (req: Request, res: Response) => {
    const { employeeId, timestamp, manualOtHours, shiftWorkHoursQuota, shiftBreakMinutes } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Parameter employeeId diperlukan untuk mencatat check-out.',
      });
    }

    const checkOutDate = timestamp ? new Date(timestamp) : new Date();
    const todayStr = getTodayDateString(checkOutDate);
    const dbKey = `${employeeId}_${todayStr}`;

    const existingRecord = attendanceDatabase.get(dbKey);

    // VALIDASI 1: Belum pernah check-in hari ini
    if (!existingRecord || !existingRecord.checkInTime) {
      return res.status(400).json({
        success: false,
        error: 'NOT_CHECKED_IN',
        message: 'Gagal Check-Out: Anda belum melakukan Check-In untuk hari ini. Sila klik butang Check-In terlebih dahulu.',
      });
    }

    // VALIDASI 2: Sudah pernah check-out hari ini
    if (existingRecord.checkOutTime) {
      const timeFormatted = new Date(existingRecord.checkOutTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return res.status(400).json({
        success: false,
        error: 'ALREADY_CHECKED_OUT',
        message: `Anda sudah melakukan check-out hari ini pada pukul ${timeFormatted}. Rekod harian telah ditutup.`,
        data: existingRecord,
      });
    }

    // HITUNG TOTAL DURASI KERJA & LEMBUR (Overtime) SESUAI KUOTA SHIFT
    const checkInDate = new Date(existingRecord.checkInTime);
    const totalElapsedMs = checkOutDate.getTime() - checkInDate.getTime();
    const totalElapsedMinutes = Math.max(0, Math.floor(totalElapsedMs / (1000 * 60)));

    // Tolak rehat sekiranya jadual shift memperuntukkan rehat & durasi mencukupi
    const shiftBreakMins = shiftBreakMinutes !== undefined 
      ? Number(shiftBreakMinutes) 
      : existingRecord.breakDurationMinutes;
    const breakMinutesDeducted = (totalElapsedMinutes >= 240 && shiftBreakMins > 0) ? shiftBreakMins : 0;
    
    const workMinutesNet = Math.max(0, totalElapsedMinutes - breakMinutesDeducted);
    const netWorkHours = parseFloat((workMinutesNet / 60).toFixed(2));

    // Kuota jam kerja shift (contoh: 8.0 jam, 3.0 jam, 4.0 jam)
    const targetQuotaHours = shiftWorkHoursQuota !== undefined 
      ? Number(shiftWorkHoursQuota) 
      : 8.0;
    const targetQuotaMinutes = targetQuotaHours * 60;

    let overtimeMinutes = 0;
    if (manualOtHours && manualOtHours > 0) {
      overtimeMinutes = Math.round(manualOtHours * 60);
    } else if (workMinutesNet > targetQuotaMinutes) {
      overtimeMinutes = Math.round(workMinutesNet - targetQuotaMinutes);
    }

    const updatedRecord: AttendanceDatabaseRecord = {
      ...existingRecord,
      checkOutTime: checkOutDate.toISOString(),
      totalWorkMinutes: workMinutesNet,
      netWorkHours,
      overtimeMinutes,
      status: existingRecord.status === 'late' ? 'late' : 'present',
      notes: `${existingRecord.notes || ''} Pulang pada ${checkOutDate.toLocaleTimeString('en-GB')}. Jam kerja bersih: ${netWorkHours} jam (Kuota shift: ${targetQuotaHours}j, Lembur: ${Math.round(overtimeMinutes / 60 * 10) / 10} jam).`,
    };

    attendanceDatabase.set(dbKey, updatedRecord);

    return res.status(200).json({
      success: true,
      message: 'Check-Out Berjaya! Rekod bertugas hari ini telah ditutup & diselaraskan ke modul penggajian.',
      data: updatedRecord,
      alignment: {
        netWorkHours,
        targetQuotaHours,
        overtimeMinutes,
        overtimeHours: parseFloat((overtimeMinutes / 60).toFixed(2)),
        overtimePayEstimate: (overtimeMinutes / 60) * 1.5 * (3500 / 26 / 8),
      }
    });
  });

  // --------------------------------------------------------------------------
  // API ENDPOINT 3: GET /api/attendance/today/:employeeId
  // --------------------------------------------------------------------------
  app.get('/api/attendance/today/:employeeId', (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const todayStr = getTodayDateString();
    const dbKey = `${employeeId}_${todayStr}`;
    const record = attendanceDatabase.get(dbKey) || null;

    res.json({
      success: true,
      date: todayStr,
      employeeId,
      hasClockedIn: !!(record && record.checkInTime),
      hasClockedOut: !!(record && record.checkOutTime),
      record,
      shifts: masterShifts,
    });
  });

  // --------------------------------------------------------------------------
  // API ENDPOINT 4: GET /api/schema/ddl
  // --------------------------------------------------------------------------
  app.get('/api/schema/ddl', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(POSTGRESQL_DDL_SCHEMA);
  });

  // --------------------------------------------------------------------------
  // VITE DEV SERVER / STATIC ASSETS MOUNT
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HRPro Full-Stack Engine] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
