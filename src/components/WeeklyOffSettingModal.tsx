import React, { useState } from 'react';
import { 
  Calendar, 
  Check, 
  X, 
  Users, 
  Filter, 
  Search, 
  Save, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { Employee } from '../types/hr';

type DayOfWeek = 'Ahad' | 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu';

const ALL_DAYS: DayOfWeek[] = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];

interface WeeklyOffSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  activeUser: Employee;
  onUpdateEmployee: (updated: Employee) => void;
  onBulkUpdateWeeklyOff: (employeeIds: string[], offDays: DayOfWeek[], notes?: string) => void;
}

export const WeeklyOffSettingModal: React.FC<WeeklyOffSettingModalProps> = ({
  isOpen,
  onClose,
  employees,
  activeUser,
  onUpdateEmployee,
  onBulkUpdateWeeklyOff,
}) => {
  if (!isOpen) return null;

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  
  // Weekly Off Form State
  const [chosenOffDays, setChosenOffDays] = useState<DayOfWeek[]>(['Sabtu', 'Ahad']);
  const [notes, setNotes] = useState('Standard Hari Rehat Pejabat (5 Hari Bekerja)');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCompany = selectedCompanyFilter === 'all' || emp.company === selectedCompanyFilter;
    const matchDept = selectedDeptFilter === 'all' || emp.departemen === selectedDeptFilter;
    return matchSearch && matchCompany && matchDept;
  });

  const allFilteredSelected = filteredEmployees.length > 0 && 
    filteredEmployees.every(e => selectedEmployeeIds.includes(e.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelectEmployee = (id: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: DayOfWeek) => {
    setChosenOffDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // Quick Presets
  const applyPreset = (presetDays: DayOfWeek[], presetNotes: string) => {
    setChosenOffDays(presetDays);
    setNotes(presetNotes);
  };

  const handleSaveBulk = () => {
    if (selectedEmployeeIds.length === 0) {
      setNotificationMsg('Sila pilih sekurang-kurangnya seorang pekerja untuk menetapkan cuti mingguan.');
      setTimeout(() => setNotificationMsg(null), 3000);
      return;
    }

    if (chosenOffDays.length === 0) {
      setNotificationMsg('Sila pilih sekurang-kurangnya 1 hari rehat mingguan mengikut Akta Kerja 1955.');
      setTimeout(() => setNotificationMsg(null), 3000);
      return;
    }

    onBulkUpdateWeeklyOff(selectedEmployeeIds, chosenOffDays, notes);
    setNotificationMsg(`Berjaya menetapkan cuti mingguan (${chosenOffDays.join(', ')}) untuk ${selectedEmployeeIds.length} orang pekerja!`);
    setSelectedEmployeeIds([]);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Tetapan Cuti Mingguan / Hari Rehat Pekerja (Weekly Off)
              </h2>
              <p className="text-xs text-slate-500">
                Tetapkan jadual hari rehat mingguan bagi setiap pekerja atau jabatan (Akta Kerja 1955 Seksyen 59).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notificationMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notificationMsg}</span>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="text-emerald-500 font-bold">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SETTING BUILDER BOX                                                       */}
        {/* ========================================================================= */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>1. Pilih Hari Rehat Mingguan &amp; Pola Jadual:</span>
            </span>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Pilihan Pantas:</span>
              <button
                type="button"
                onClick={() => applyPreset(['Sabtu', 'Ahad'], 'Standard Pejabat (5 Hari Bekerja)')}
                className="px-2 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-indigo-500"
              >
                Sabtu &amp; Ahad (5 Hari)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['Jumaat', 'Sabtu'], 'Jadual Roster Jumaat-Sabtu')}
                className="px-2 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-indigo-500"
              >
                Jumaat &amp; Sabtu
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['Ahad'], 'Operasi 6 Hari Bekerja (Rehat Ahad Sahaja)')}
                className="px-2 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-indigo-500"
              >
                Ahad Sahaja (6 Hari)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['Isnin', 'Selasa'], 'Roster Retail Kedai Buku (Isnin & Selasa Off)')}
                className="px-2 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:border-indigo-500"
              >
                Isnin &amp; Selasa (Retail)
              </button>
            </div>
          </div>

          {/* 7 Days Toggle Buttons */}
          <div className="grid grid-cols-7 gap-2 pt-1">
            {ALL_DAYS.map(day => {
              const isOff = chosenOffDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all text-center border ${
                    isOff
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase font-semibold opacity-80">{day.slice(0, 3)}</div>
                  <div className="text-xs font-bold mt-0.5">{day}</div>
                  <div className="text-[9px] mt-1 font-mono">
                    {isOff ? '🏖️ Cuti' : '💼 Kerja'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Notes input & Execute button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tetapan (cth: Roster Pembantu Jualan / 5 Hari Bekerja)"
              className="w-full sm:flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            <button
              type="button"
              onClick={handleSaveBulk}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan ke {selectedEmployeeIds.length} Pekerja Dipilih</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EMPLOYEE ASSIGNMENT LIST                                                  */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Pilih Karyawan Yang Terlibat:
            </span>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari staf..."
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-40"
              />

              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="all">Semua Syarikat</option>
                <option value="Pustaka Union">Pustaka Union</option>
                <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="rounded text-indigo-600"
                    />
                  </th>
                  <th className="py-2 px-3">Nama Karyawan</th>
                  <th className="py-2 px-3">Syarikat &amp; Jabatan</th>
                  <th className="py-2 px-3">Cuti Mingguan Semasa</th>
                  <th className="py-2 px-3 text-right">Tindakan Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map(emp => {
                  const isChecked = selectedEmployeeIds.includes(emp.id);
                  const currentOff = emp.weeklyOffDays || ['Sabtu', 'Ahad'];

                  return (
                    <tr 
                      key={emp.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectEmployee(emp.id)}
                          className="rounded text-indigo-600"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        <div>{emp.namaLengkap}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.nik} · {emp.jabatan}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                        <div>{emp.company}</div>
                        <div className="text-[10px] text-slate-400">{emp.departemen}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {currentOff.map(d => (
                            <span key={d} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateEmployee({
                              ...emp,
                              weeklyOffDays: chosenOffDays,
                              weeklyRestDayNotes: notes
                            });
                            setNotificationMsg(`Cuti mingguan ${emp.namaLengkap} dikemaskini kepada: ${chosenOffDays.join(', ')}`);
                            setTimeout(() => setNotificationMsg(null), 3000);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 font-semibold text-[10px]"
                        >
                          Guna Tetapan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedEmployeeIds.length} pekerja dipilih daripada {filteredEmployees.length} senarai.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
