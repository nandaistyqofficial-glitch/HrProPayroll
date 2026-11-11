import React, { useState } from 'react';
import { 
  Clock, 
  X, 
  Check, 
  Save, 
  DollarSign, 
  AlertCircle, 
  Calendar, 
  User, 
  Building2,
  Sparkles
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../types/hr';
import { formatMYR } from '../utils/statutoryCalculations';

interface EditOvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  employee?: Employee;
  onSaveOvertime: (recordId: string, otHours: number, notes?: string, customRate?: number) => void;
}

export const EditOvertimeModal: React.FC<EditOvertimeModalProps> = ({
  isOpen,
  onClose,
  record,
  employee,
  onSaveOvertime,
}) => {
  if (!isOpen || !record) return null;

  const [otHours, setOtHours] = useState<number>(record.otHours || 0);
  const [multiplier, setMultiplier] = useState<number>(1.5); // 1.5x standard
  const [notes, setNotes] = useState<string>(record.catatan || 'Kerja lebih masa diluluskan oleh HR');

  // Hourly rate calculation
  const baseSalary = employee?.baseSalary || 3000;
  const hourlyRate = (baseSalary / 26 / 8);
  const estimatedOtPay = otHours * multiplier * hourlyRate;
  const totalWorkHours = (record.workHours || 8.0) - (record.otHours || 0) + otHours;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOvertime(record.id, otHours, notes, multiplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kemaskini Jam Lembur (Edit Overtime)
              </h3>
              <p className="text-xs text-slate-500">
                Penyelarasan jam OT rasmi &amp; elaun penggajian pekerja.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Attendance Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
            <span>{record.employeeName}</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{record.nik}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Tarikh: {record.tanggal}</span>
            <span>Masuk: {record.jamMasuk} · Pulang: {record.jamKeluar || 'Belum'}</span>
          </div>
        </div>

        {/* Overtime Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* OT Hours Input */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Jumlah Jam Lembur (OT Hours):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0"
                max="12"
                value={otHours}
                onChange={(e) => setOtHours(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 font-mono font-bold text-base px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="font-bold text-slate-500">Jam</span>
            </div>
            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">Pantas:</span>
              {[0, 1, 1.5, 2, 2.5, 3, 4].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setOtHours(val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                    otHours === val
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {val}j
                </button>
              ))}
            </div>
          </div>

          {/* Rate Multiplier */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kadar Gandaan OT (Kadar Akta Kerja 1955):
            </label>
            <select
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              <option value="1.5">1.5x - Hari Bekerja Biasa (Normal Working Day)</option>
              <option value="2.0">2.0x - Hari Rehat Mingguan (Rest Day / Cuti Mingguan)</option>
              <option value="3.0">3.0x - Hari Cuti Am Rasmi (Public Holiday)</option>
            </select>
          </div>

          {/* Live Pay Estimation */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Anggaran Bayaran OT:
              </p>
              <p className="text-base font-extrabold font-mono text-indigo-900 dark:text-indigo-100">
                {formatMYR(estimatedOtPay)}
              </p>
            </div>
            <div className="text-right text-[11px] text-indigo-700 dark:text-indigo-300 font-mono">
              <div>Kadar Sejam: {formatMYR(hourlyRate)}/j</div>
              <div>Jumlah Kerja: {totalWorkHours} Jam</div>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alasan / Catatan Kelulusan Lembur:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kerja lebih masa operasi kaunter kedai buku / closing jualan bulanan"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveOvertime(record.id, 0, 'Dibatalkan / Dihapuskan oleh HR/HRD', multiplier);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Batalkan dan hapus jam lembur rekod ini"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus OT (0 Jam)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Luluskan / Simpan OT</span>
              </button>
            </div>
          </div>


        </form>

      </div>
    </div>
  );
};
