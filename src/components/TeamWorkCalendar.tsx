import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Plane, 
  Home, 
  Clock, 
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveRequest, CompanyName } from '../types/hr';
import { MONTH_NAMES_MS, DAY_NAMES_MS } from '../utils/statutoryCalculations';

interface TeamWorkCalendarProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  activeUser: Employee;
  selectedCompanyFilter?: string;
}

export const TeamWorkCalendar: React.FC<TeamWorkCalendarProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
  activeUser,
  selectedCompanyFilter = 'all'
}) => {
  // Calendar state: default to May 2025 (matching system cut-off and active records)
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>('2025-05-12');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewType, setViewType] = useState<'month' | 'day'>('month');

  // Filter employees according to company and department
  const filteredEmployees = employees.filter(emp => {
    if (selectedCompanyFilter !== 'all' && emp.company !== selectedCompanyFilter) return false;
    if (filterDepartment !== 'all' && emp.departemen !== filterDepartment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.namaLengkap.toLowerCase().includes(q);
      const matchNik = emp.nik.toLowerCase().includes(q);
      const matchDept = emp.departemen.toLowerCase().includes(q);
      return matchName || matchNik || matchDept;
    }
    return true;
  });

  // Calculate days in month and starting day offset
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Helper to get status for an employee on a given date (YYYY-MM-DD)
  const getEmployeeStatusOnDate = (empId: string, dateStr: string) => {
    // 1. Check leave requests
    const leave = leaveRequests.find(l => {
      if (l.employeeId !== empId || l.status !== 'Diluluskan') return false;
      return dateStr >= l.tanggalMulai && dateStr <= l.tanggalSelesai;
    });

    if (leave) {
      return {
        type: 'leave',
        label: leave.tipeCuti,
        reason: leave.alasan,
        isMc: leave.tipeCuti.includes('Sakit'),
        isAnnual: leave.tipeCuti.includes('Tahunan'),
      };
    }

    // 2. Check attendance records on this date
    const attendance = attendanceRecords.find(a => a.employeeId === empId && a.tanggal === dateStr);
    if (attendance) {
      const isRemoteOrOutstation = 
        attendance.lokasi.includes('Remote') || 
        attendance.lokasi.includes('WFH') || 
        attendance.lokasi.includes('Dinas Luar') || 
        attendance.lokasi.includes('Luar Negara');

      return {
        type: isRemoteOrOutstation ? 'outstation' : 'present',
        label: isRemoteOrOutstation ? 'Bertugas Luar Kota / WFH' : 'Hadir di Pejabat',
        location: attendance.lokasi,
        jamMasuk: attendance.jamMasuk,
        jamKeluar: attendance.jamKeluar,
        status: attendance.status,
      };
    }

    // 3. Fallback: check if employee is naturally remote foreign
    const emp = employees.find(e => e.id === empId);
    if (emp?.isRemoteOutsideMalaysia) {
      return {
        type: 'outstation',
        label: 'Bertugas Luar Negara (Remote Indonesia)',
        location: 'Remote International (Indonesia)',
      };
    }

    return {
      type: 'unknown',
      label: 'Jadual Biasa / Luar Jadual',
    };
  };

  // Roster summary for selected date
  const rosterOnSelectedDate = filteredEmployees.map(emp => {
    const status = getEmployeeStatusOnDate(emp.id, selectedDate);
    return {
      employee: emp,
      ...status
    };
  });

  const onLeaveList = rosterOnSelectedDate.filter(r => r.type === 'leave');
  const onOutstationList = rosterOnSelectedDate.filter(r => r.type === 'outstation');
  const inOfficeList = rosterOnSelectedDate.filter(r => r.type === 'present');

  // List of unique departments for filter
  const departments = Array.from(new Set(employees.map(e => e.departemen)));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6 p-4 sm:p-6">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kalender Kerja Tim (Team Work Calendar)
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Masa Nyata
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Semak siapa rakan sepasukan yang sedang cuti atau bertugas di luar kota pada hari tertentu.
            </p>
          </div>
        </div>

        {/* View Switcher & Month Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
              {MONTH_NAMES_MS[currentMonth - 1]} {currentYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewType('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewType === 'month' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kalendar Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewType('day')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewType === 'day' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Roster Harian ({selectedDate})
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
        
        {/* Department & Search Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rakan sepasukan..."
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
          >
            <option value="all">Semua Jabatan ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Color Legends */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">Cuti (Leave)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-600 dark:text-slate-300">Luar Kota / WFH</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Pejabat (Office)</span>
          </span>
        </div>
      </div>

      {/* Main View Area */}
      {viewType === 'month' ? (
        <div className="space-y-4">
          
          {/* Calendar Grid */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-800/80 text-center text-xs font-bold text-slate-600 dark:text-slate-300 py-2.5 border-b border-slate-200 dark:border-slate-700">
              {['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'].map((day, idx) => (
                <div key={day} className={idx === 0 || idx === 6 ? 'text-rose-500' : ''}>
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.substring(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[85px] sm:min-h-[105px] p-1.5 bg-slate-50/40 dark:bg-slate-950/30" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === '2025-05-12';

                // Count leaves, outstation, in-office on this date
                let leaveCount = 0;
                let outstationCount = 0;
                let inOfficeCount = 0;

                filteredEmployees.forEach(emp => {
                  const st = getEmployeeStatusOnDate(emp.id, dateStr);
                  if (st.type === 'leave') leaveCount++;
                  else if (st.type === 'outstation') outstationCount++;
                  else if (st.type === 'present') inOfficeCount++;
                });

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      // Switch to day view if mobile, otherwise keep highlighted
                    }}
                    className={`min-h-[85px] sm:min-h-[105px] p-2 text-left flex flex-col justify-between transition-all cursor-pointer group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 ${
                      isSelected 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500 z-10' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isSelected
                          ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600'
                      }`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                          Hari Ini
                        </span>
                      )}
                    </div>

                    {/* Indicators Strip */}
                    <div className="space-y-1 w-full mt-1.5">
                      {leaveCount > 0 && (
                        <div className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{leaveCount} Cuti</span>
                        </div>
                      )}

                      {outstationCount > 0 && (
                        <div className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-bold truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                          <span>{outstationCount} Luar Kota</span>
                        </div>
                      )}

                      {inOfficeCount > 0 && (
                        <div className="hidden sm:flex px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium truncate items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{inOfficeCount} Pejabat</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Roster Drawer for Selected Date */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Roster Pasukan Pada: {selectedDate}</span>
                  <span className="text-xs font-normal text-slate-500 font-mono">
                    (Total: {filteredEmployees.length} Kakitangan)
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ringkasan status kehadiran fizikal, cuti, dan luar kawasan untuk tarikh ini.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewType('day')}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              >
                Lihat Paparan Penuh Jadual
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Column 1: On Leave */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 pb-2 border-b border-amber-100 dark:border-amber-900/40">
                  <span>Sedang Bercuti ({onLeaveList.length})</span>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                {onLeaveList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-3 text-center">Tiada yang cuti pada tarikh ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {onLeaveList.map(item => (
                      <div key={item.employee.id} className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">{item.employee.namaLengkap}</p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{item.label}</p>
                        {item.reason && <p className="text-[10px] text-slate-400 italic">"{item.reason}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Outstation / WFH */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-800 dark:text-sky-300 pb-2 border-b border-sky-100 dark:border-sky-900/40">
                  <span>Luar Kota / WFH ({onOutstationList.length})</span>
                  <Plane className="w-4 h-4 text-sky-500" />
                </div>
                {onOutstationList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-3 text-center">Tiada staf luar kota pada tarikh ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {onOutstationList.map(item => (
                      <div key={item.employee.id} className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">{item.employee.namaLengkap}</p>
                        <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">{item.location}</p>
                        <span className="text-[10px] text-slate-400">{item.employee.departemen}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 3: In Office */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
                  <span>Hadir Pejabat ({inOfficeList.length})</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                {inOfficeList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-3 text-center">Belum ada rekod masuk pejabat hari ini.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inOfficeList.slice(0, 6).map(item => (
                      <div key={item.employee.id} className="text-xs flex items-center justify-between">
                        <span className="font-medium text-slate-900 dark:text-white truncate max-w-[130px]">
                          {item.employee.namaLengkap}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {item.jamMasuk}
                        </span>
                      </div>
                    ))}
                    {inOfficeList.length > 6 && (
                      <p className="text-[10px] text-slate-400 text-center pt-1">+ {inOfficeList.length - 6} lagi kakitangan</p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* DAILY DETAIL VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Roster Terperinci Seluruh Pasukan: {selectedDate}
              </h3>
              <p className="text-xs text-slate-500">
                Status tugasan dan lokasi setiap kakitangan bagi tarikh ini.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewType('month')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              ← Kembali ke Kalendar
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Kakitangan</th>
                  <th className="px-4 py-3">Syarikat &amp; Jabatan</th>
                  <th className="px-4 py-3">Status Hari Ini</th>
                  <th className="px-4 py-3">Lokasi / Keterangan</th>
                  <th className="px-4 py-3">Waktu Masuk &amp; Pulang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rosterOnSelectedDate.map(item => (
                  <tr key={item.employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {item.employee.avatarUrl ? (
                          <img
                            src={item.employee.avatarUrl}
                            alt={item.employee.namaLengkap}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {item.employee.namaLengkap.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.employee.namaLengkap}</p>
                          <span className="font-mono text-[10px] text-slate-400">{item.employee.nik}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-white font-medium">{item.employee.company}</p>
                      <span className="text-[11px] text-slate-400">{item.employee.departemen}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.type === 'leave'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : item.type === 'outstation'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : item.type === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.type === 'leave' && <AlertCircle className="w-3 h-3" />}
                        {item.type === 'outstation' && <Plane className="w-3 h-3" />}
                        {item.type === 'present' && <CheckCircle2 className="w-3 h-3" />}
                        <span>{item.label}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.location || item.reason || '-'}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      {item.jamMasuk ? `${item.jamMasuk} s/d ${item.jamKeluar || 'Aktif'}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
