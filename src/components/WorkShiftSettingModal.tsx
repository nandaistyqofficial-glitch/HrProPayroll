import React, { useState, useMemo } from 'react';
import { 
  X, 
  Clock, 
  Settings, 
  Users, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Check, 
  Save, 
  Trash2, 
  Edit3, 
  Building2, 
  Layers, 
  Calendar,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { Employee, CompanyName, Department } from '../types/hr';
import { ShiftDefinition, INITIAL_SHIFTS } from '../types/databaseSchema';

interface WorkShiftSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  activeUser: Employee;
  shifts: ShiftDefinition[];
  onUpdateShifts: (shifts: ShiftDefinition[]) => void;
  onUpdateEmployee: (updated: Employee) => void;
  onBulkAssignShift: (employeeIds: string[], shift: ShiftDefinition) => void;
}

export const WorkShiftSettingModal: React.FC<WorkShiftSettingModalProps> = ({
  isOpen,
  onClose,
  employees,
  activeUser,
  shifts,
  onUpdateShifts,
  onUpdateEmployee,
  onBulkAssignShift,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'assign' | 'manageShifts' | 'simulate'>('assign');

  // Search & Filter for Employee Assignment
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [bulkShiftTargetId, setBulkShiftTargetId] = useState<string>(shifts[0]?.id || 'shift-9-6');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // New Shift Form State
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftCode, setNewShiftCode] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('18:00');
  const [newGraceMinutes, setNewGraceMinutes] = useState(15);
  const [newStandardHours, setNewStandardHours] = useState(8.0);
  const [newBreakMinutes, setNewBreakMinutes] = useState(60);
  const [newDescription, setNewDescription] = useState('');

  // Simulator State
  const [simShiftId, setSimShiftId] = useState<string>(shifts[0]?.id || 'shift-9-6');
  const [simCheckIn, setSimCheckIn] = useState<string>('09:20');
  const [simCheckOut, setSimCheckOut] = useState<string>('18:30');

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch =
        emp.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCompany = selectedCompanyFilter === 'all' || emp.company === selectedCompanyFilter;
      const matchDept = selectedDeptFilter === 'all' || emp.departemen === selectedDeptFilter;
      return matchSearch && matchCompany && matchDept;
    });
  }, [employees, searchTerm, selectedCompanyFilter, selectedDeptFilter]);

  // Handle single employee shift change
  const handleAssignSingleShift = (emp: Employee, shiftId: string) => {
    const targetShift = shifts.find(s => s.id === shiftId);
    if (!targetShift) return;

    const [startH, startM] = targetShift.startTime.split(':');
    const [endH, endM] = targetShift.endTime.split(':');

    const updated: Employee = {
      ...emp,
      shiftId: targetShift.id,
      shiftName: targetShift.shiftName,
      shiftStartTime: `${startH}:${startM}`,
      shiftEndTime: `${endH}:${endM}`,
      shiftGraceMinutes: targetShift.gracePeriodMinutes,
      shiftWorkHoursQuota: targetShift.standardWorkHours,
      shiftBreakMinutes: targetShift.breakDurationMinutes,
    };

    onUpdateEmployee(updated);
    showNotification(`Jam kerja bagi ${emp.namaLengkap} berjaya ditukar ke ${targetShift.shiftName}.`);
  };

  // Handle Bulk Assign
  const handleExecuteBulkAssign = () => {
    if (selectedEmployeeIds.length === 0) {
      alert('Sila tandakan sekurang-kurangnya seorang pekerja.');
      return;
    }
    const targetShift = shifts.find(s => s.id === bulkShiftTargetId);
    if (!targetShift) return;

    onBulkAssignShift(selectedEmployeeIds, targetShift);
    showNotification(`Berjaya menetapkan ${targetShift.shiftName} kepada ${selectedEmployeeIds.length} orang pekerja terpilih.`);
    setSelectedEmployeeIds([]);
  };

  // Handle Create New Custom Shift
  const handleSaveNewShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftName || !newStartTime || !newEndTime) {
      alert('Sila lengkapkan nama shift, waktu mula, dan waktu tamat.');
      return;
    }

    const created: ShiftDefinition = {
      id: `shift-custom-${Date.now()}`,
      shiftCode: newShiftCode || `SHIFT-${newStartTime.replace(':', '')}`,
      shiftName: newShiftName,
      startTime: `${newStartTime}:00`,
      endTime: `${newEndTime}:00`,
      gracePeriodMinutes: Number(newGraceMinutes) || 0,
      standardWorkHours: Number(newStandardHours) || 8.0,
      breakDurationMinutes: Number(newBreakMinutes) || 0,
      description: newDescription || `Jadual bertugas ${newStartTime} hingga ${newEndTime}`,
      isCustom: true,
    };

    onUpdateShifts([...shifts, created]);
    setIsCreatingShift(false);
    showNotification(`Shift baru "${created.shiftName}" berjaya didaftarkan.`);
    resetNewShiftForm();
  };

  const resetNewShiftForm = () => {
    setNewShiftName('');
    setNewShiftCode('');
    setNewStartTime('09:00');
    setNewEndTime('18:00');
    setNewGraceMinutes(15);
    setNewStandardHours(8.0);
    setNewBreakMinutes(60);
    setNewDescription('');
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const toggleSelectAll = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Simulation calculation
  const simShift = shifts.find(s => s.id === simShiftId) || shifts[0];
  const simLateCalculation = useMemo(() => {
    if (!simShift || !simCheckIn) return { lateMinutes: 0, isLate: false };
    const [startH, startM] = simShift.startTime.split(':').map(Number);
    const [inH, inM] = simCheckIn.split(':').map(Number);
    const shiftStartMinutes = startH * 60 + startM;
    const checkInMinutes = inH * 60 + inM;
    const graceMinutes = simShift.gracePeriodMinutes;

    if (checkInMinutes > shiftStartMinutes + graceMinutes) {
      return {
        lateMinutes: checkInMinutes - shiftStartMinutes,
        isLate: true,
      };
    }
    return { lateMinutes: 0, isLate: false };
  }, [simShift, simCheckIn]);

  const simWorkCalculation = useMemo(() => {
    if (!simShift || !simCheckIn || !simCheckOut) return { workHours: 0, otMinutes: 0 };
    const [inH, inM] = simCheckIn.split(':').map(Number);
    const [outH, outM] = simCheckOut.split(':').map(Number);
    let duration = (outH * 60 + outM) - (inH * 60 + inM);
    if (duration < 0) duration += 24 * 60; // overnight fallback

    const breakMins = duration >= 240 ? simShift.breakDurationMinutes : 0;
    const netMins = Math.max(0, duration - breakMins);
    const netHours = parseFloat((netMins / 60).toFixed(2));
    const targetMins = simShift.standardWorkHours * 60;
    const otMinutes = Math.max(0, netMins - targetMins);

    return {
      netMinutes: netMins,
      netHours,
      otMinutes,
      otHours: parseFloat((otMinutes / 60).toFixed(2)),
    };
  }, [simShift, simCheckIn, simCheckOut]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Tetapan Jam Kerja &amp; Jadual Shift Pekerja
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Akses HRD / Pengurus
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Urus waktu kerja berbeza bagi setiap pekerja: Shift Penuh (09:00 - 18:00), Pagi (09:00 - 12:00), Siang (12:00 - 16:00), dan lain-lain.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          {[
            { id: 'assign', label: '1. Tetapkan Shift Karyawan', icon: Users, count: employees.length },
            { id: 'manageShifts', label: '2. Master Jadual & Cipta Shift', icon: Settings, count: shifts.length },
            { id: 'simulate', label: '3. Kalkulator & Ujian Toleransi', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification Toast */}
        {notificationMsg && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          
          {/* TAB 1: Assign Shift Per Employee */}
          {activeTab === 'assign' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama pekerja atau NIK..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium"
                  >
                    <option value="all">Semua Syarikat</option>
                    <option value="Pustaka Union">Pustaka Union</option>
                    <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Bar */}
              {selectedEmployeeIds.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>{selectedEmployeeIds.length} orang pekerja ditandakan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Tukar ke Shift:</span>
                    <select
                      value={bulkShiftTargetId}
                      onChange={(e) => setBulkShiftTargetId(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg px-2.5 py-1 text-xs font-bold"
                    >
                      {shifts.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.shiftName} ({s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleExecuteBulkAssign}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
                    >
                      Terapkan Pukal
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Employees */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.length > 0 && selectedEmployeeIds.length === filteredEmployees.length}
                          onChange={toggleSelectAll}
                          className="rounded text-amber-600"
                        />
                      </th>
                      <th className="py-2.5 px-3">Pekerja &amp; Syarikat</th>
                      <th className="py-2.5 px-3">Jadual Shift Semasa</th>
                      <th className="py-2.5 px-3">Waktu Masuk &amp; Pulang</th>
                      <th className="py-2.5 px-3 text-right">Tukar Shift Langsung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEmployees.map((emp) => {
                      const empShiftId = emp.shiftId || 'shift-9-6';
                      const assignedShift = shifts.find(s => s.id === empShiftId) || shifts[0];
                      const isSelected = selectedEmployeeIds.includes(emp.id);

                      return (
                        <tr 
                          key={emp.id}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(emp.id)}
                              className="rounded text-amber-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {emp.namaLengkap}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {emp.nik} · {emp.departemen} · {emp.company.includes('Solusi') ? 'SSS' : 'PU'}
                            </p>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {assignedShift.shiftName}
                              </span>
                              {assignedShift.standardWorkHours < 8 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {assignedShift.standardWorkHours} Jam
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Toleransi lewat: {assignedShift.gracePeriodMinutes} minit
                            </p>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {assignedShift.startTime.slice(0, 5)}
                            </span>
                            <span className="text-slate-400 mx-1">-</span>
                            <span className="text-rose-600 dark:text-rose-400">
                              {assignedShift.endTime.slice(0, 5)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <select
                              value={empShiftId}
                              onChange={(e) => handleAssignSingleShift(emp, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              {shifts.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.shiftName} ({s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)})
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Manage Master Shifts & Create New Shifts */}
          {activeTab === 'manageShifts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Senarai Master Jadual Shift
                  </h3>
                  <p className="text-xs text-slate-500">
                    Definisikan jadual jam kerja standard, separuh hari (part-time), shift siang, atau shift khusus.
                  </p>
                </div>
                {!isCreatingShift && (
                  <button
                    onClick={() => setIsCreatingShift(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Cipta Shift Baru</span>
                  </button>
                )}
              </div>

              {/* Form to Create Shift */}
              {isCreatingShift && (
                <form 
                  onSubmit={handleSaveNewShift}
                  className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800 rounded-2xl space-y-4 text-xs animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                      Daftar Waktu Kerja Shift Baru
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingShift(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1">Nama Shift:</label>
                      <input
                        type="text"
                        required
                        placeholder="Cth: Shift Petang Kasir (14:00 - 22:00)"
                        value={newShiftName}
                        onChange={(e) => setNewShiftName(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Kod Shift:</label>
                      <input
                        type="text"
                        placeholder="Cth: EVE-1422"
                        value={newShiftCode}
                        onChange={(e) => setNewShiftCode(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Waktu Mula (Masuk):</label>
                      <input
                        type="time"
                        required
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Waktu Tamat (Pulang):</label>
                      <input
                        type="time"
                        required
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Toleransi Lewat (Minit):</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={newGraceMinutes}
                        onChange={(e) => setNewGraceMinutes(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Kuota Jam Kerja:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="12"
                        value={newStandardHours}
                        onChange={(e) => setNewStandardHours(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Rehat (Minit):</label>
                      <input
                        type="number"
                        step="15"
                        min="0"
                        max="120"
                        value={newBreakMinutes}
                        onChange={(e) => setNewBreakMinutes(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Keterangan / Polisi Shift:</label>
                    <input
                      type="text"
                      placeholder="Catatan mengenai staf atau bahagian yang layak menggunakan shift ini"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingShift(false)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                    >
                      Simpan Shift Baru
                    </button>
                  </div>
                </form>
              )}

              {/* Master Shifts Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shifts.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {s.shiftName}
                          </h4>
                          {s.isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Kustom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Kod: {s.shiftCode}
                        </p>
                      </div>

                      <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {s.description || 'Tiada keterangan tambahan.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Toleransi:</span>
                        <strong>{s.gracePeriodMinutes} Minit</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kuota Kerja:</span>
                        <strong>{s.standardWorkHours} Jam</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waktu Rehat:</span>
                        <strong>{s.breakDurationMinutes} Minit</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Simulation Matrix */}
          {activeTab === 'simulate' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-900 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>Kalkulator Kesan Shift Terhadap Potongan Lewat &amp; Upah Lembur</span>
                </div>
                <p>
                  Uji bagaimana waktu masuk dan pulang dikira secara automatik mengikut toleransi dan kuota setiap shift yang dipilih.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Simulation Inputs */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Parameter Ujian
                  </h4>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Pilih Shift yang Diuji:
                    </label>
                    <select
                      value={simShiftId}
                      onChange={(e) => setSimShiftId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      {shifts.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.shiftName} ({s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}) · Kuota {s.standardWorkHours}j
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Waktu Check In:
                      </label>
                      <input
                        type="time"
                        value={simCheckIn}
                        onChange={(e) => setSimCheckIn(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Waktu Check Out:
                      </label>
                      <input
                        type="time"
                        value={simCheckOut}
                        onChange={(e) => setSimCheckOut(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Simulation Results Output */}
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4 text-xs font-mono">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-sans">
                    Hasil Pengiraan Automatik
                  </h4>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-sans">Status Masuk Bertugas:</span>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${simLateCalculation.isLate ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {simLateCalculation.isLate ? `LEWAT (${simLateCalculation.lateMinutes} minit)` : 'TEPAT WAKTU (Tiada penalti)'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Toleransi: {simShift.gracePeriodMinutes}m
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-sans">Jam Bekerja Bersih:</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {simWorkCalculation.netHours} Jam
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        (Kuota shift: {simShift.standardWorkHours}j)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 block font-sans">Jam Lembur (OT):</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {(simWorkCalculation.otHours || 0) > 0 ? `+${simWorkCalculation.otHours} Jam OT` : '0 Jam OT'}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-sans">
                        Kadar 1.5x Akta Kerja
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Perubahan shift dikemaskini serta-merta kepada log presensi &amp; payroll.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
