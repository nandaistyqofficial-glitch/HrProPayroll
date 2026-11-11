import React, { useState } from 'react';
import { 
  Bell, 
  Cake, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Building2, 
  AlertCircle, 
  Heart, 
  PartyPopper,
  Check,
  X,
  FileText
} from 'lucide-react';
import { Employee, CompanyAnnouncement } from '../types/hr';
import { getEmployeesWithBirthdayThisMonth, MONTH_NAMES_MS } from '../utils/statutoryCalculations';

interface CompanyNoticeBoardProps {
  activeUser: Employee;
  employees: Employee[];
  announcements: CompanyAnnouncement[];
  onAddAnnouncement?: (newAnnouncement: CompanyAnnouncement) => void;
  currentMonth?: number;
}

export const CompanyNoticeBoard: React.FC<CompanyNoticeBoardProps> = ({
  activeUser,
  employees,
  announcements,
  onAddAnnouncement,
  currentMonth = 5, // Default Mei
}) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'birthdays' | 'policies'>('announcements');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [wishedEmployees, setWishedEmployees] = useState<string[]>([]);
  
  // New announcement form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<CompanyAnnouncement['kategori']>('Pekeliling HR');
  const [newPriority, setNewPriority] = useState<CompanyAnnouncement['prioritas']>('Tinggi (Must Read)');
  const [newTarget, setNewTarget] = useState<CompanyAnnouncement['sasaranSyarikat']>('Semua Syarikat');

  const isHRorManagement = activeUser.role === 'HRD' || activeUser.role === 'Director';
  const birthdayPeople = getEmployeesWithBirthdayThisMonth(employees, currentMonth);

  const handleSendWish = (empId: string) => {
    if (!wishedEmployees.includes(empId)) {
      setWishedEmployees(prev => [...prev, empId]);
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    if (onAddAnnouncement) {
      const announcement: CompanyAnnouncement = {
        id: `ann-${Date.now()}`,
        judul: newTitle.trim(),
        konten: newContent.trim(),
        kategori: newCategory,
        prioritas: newPriority,
        tanggal: '2025-05-12',
        pengarang: activeUser.namaLengkap,
        sasaranSyarikat: newTarget,
        dibacaOleh: [activeUser.id]
      };
      onAddAnnouncement(announcement);
    }

    setNewTitle('');
    setNewContent('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-100 dark:border-indigo-950/70 shadow-sm overflow-hidden mb-6 transition-all">
      {/* Top Banner Navigation */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-wide">
                Papan Kenyataan Syarikat (Company Notice Board)
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Pustaka Union &amp; Solusi Serumpun
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Warta pekeliling rasmi, sambutan hari lahir kakitangan, dan polisi berkanun terkini.
            </p>
          </div>
        </div>

        {/* Action button if HR */}
        {isHRorManagement && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Warta</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold px-4 pt-2 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'announcements'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Pengumuman Syarikat ({announcements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('birthdays')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'birthdays'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-rose-500" />
          <span>Hari Lahir Bulan Ini ({birthdayPeople.length})</span>
          {birthdayPeople.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'policies'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Polisi Berkanun (Akta 1955 &amp; Pinjaman)</span>
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5">
        
        {/* TAB 1: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      ann.prioritas.includes('Tinggi') 
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {ann.prioritas}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ann.tanggal}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                    {ann.judul}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {ann.konten}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[150px]">Oleh: <strong>{ann.pengarang}</strong></span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{ann.sasaranSyarikat}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: BIRTHDAYS */}
        {activeTab === 'birthdays' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pb-1">
              <span className="font-semibold flex items-center gap-1.5">
                <PartyPopper className="w-4 h-4 text-rose-500" />
                <span>Kakitangan Yang Menyambut Hari Lahir Pada Bulan {MONTH_NAMES_MS[currentMonth - 1]}:</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">Total: {birthdayPeople.length} Orang</span>
            </div>

            {birthdayPeople.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500">
                Tiada rekod sambutan hari lahir kakitangan pada bulan {MONTH_NAMES_MS[currentMonth - 1]}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {birthdayPeople.map((emp) => {
                  const hasWished = wishedEmployees.includes(emp.id);
                  // Extract day from IC or dob
                  let bDay = '15hb';
                  if (emp.dob) {
                    const p = emp.dob.split('-');
                    if (p.length === 3) bDay = `${Number(p[2])}hb`;
                  } else if (emp.icNumber) {
                    const cl = emp.icNumber.replace(/[^0-9]/g, '');
                    if (cl.length >= 6) bDay = `${Number(cl.substring(4, 6))}hb`;
                  }

                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 dark:from-rose-950/20 dark:via-slate-800 dark:to-slate-900 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.namaLengkap}
                            className="w-11 h-11 rounded-full object-cover border-2 border-rose-300 dark:border-rose-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center border-2 border-rose-300 dark:border-rose-700 shrink-0">
                            {emp.namaLengkap.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">
                            {emp.namaLengkap}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {emp.jabatan} · <strong className="text-rose-600 font-mono">{bDay} {MONTH_NAMES_MS[currentMonth - 1]}</strong>
                          </p>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {emp.company}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendWish(emp.id)}
                        disabled={hasWished}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                          hasWished
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs active:scale-95'
                        }`}
                      >
                        {hasWished ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Diucapkan!</span>
                          </>
                        ) : (
                          <>
                            <PartyPopper className="w-3.5 h-3.5" />
                            <span>Ucap Tahniah 🎉</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POLICIES */}
        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            
            {/* Policy 1: Akta Kerja 1955 Had 45 Jam */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>Akta Kerja 1955: Had 45 Jam &amp; Rehat</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Waktu bekerja mingguan dihadkan maksimum 45 jam. Setiap pekerja berhak mendapat rehat wajib sekurang-kurangnya 30–60 minit selepas 5 jam bertugas berterusan.
              </p>
              <span className="inline-block text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded font-bold">
                ✓ Pematuhan Penuh Sistem
              </span>
            </div>

            {/* Policy 2: Had Potongan Pinjaman 50% Akta Kerja 1955 */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Had Potongan Pinjaman Maksimum 50%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Seksyen 24 Akta Kerja 1955: Jumlah potongan keseluruhan (statutori + pendahuluan gaji / pinjaman) <strong>TIDAK BOLEH melebihi 50%</strong> daripada gaji pokok pekerja pada mana-mana bulan penggajian.
              </p>
              <span className="inline-block text-[10px] font-mono text-amber-700 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded font-bold">
                Seksyen 24 Enforced
              </span>
            </div>

            {/* Policy 3: Skim Lindung24 PERKESO */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Skim Lindung24 (24 Jam PERKESO)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Inisiatif perlindungan keselamatan sosial 24 jam untuk kakitangan daripada kemalangan di luar waktu bertugas (Non-Occupational Accident). Caruman nominal RM 5.00 pekerja dan RM 5.00 majikan sebulan.
              </p>
              <span className="inline-block text-[10px] font-mono text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold">
                Dilindungi 24/7
              </span>
            </div>

          </div>
        )}

      </div>

      {/* Add Announcement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Cipta Pengumuman / Pekeliling Baharu</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tajuk Pengumuman:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Warta Cuti Hari Wesak & Penyelarasan Gaji 25hb"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Pekeliling HR">Pekeliling HR</option>
                    <option value="Warta Cuti Syarikat">Warta Cuti Syarikat</option>
                    <option value="Akta Kerja 1955">Akta Kerja 1955</option>
                    <option value="Kebajikan Pekerja">Kebajikan Pekerja</option>
                    <option value="Operasi Syarikat">Operasi Syarikat</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahap Keutamaan:
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Tinggi (Must Read)">Tinggi (Must Read)</option>
                    <option value="Penting">Penting</option>
                    <option value="Biasa">Biasa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sasaran Syarikat:
                </label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Semua Syarikat">Semua Syarikat (Pustaka Union &amp; Solusi Serumpun)</option>
                  <option value="Pustaka Union">Pustaka Union Sahaja</option>
                  <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun Sahaja</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kandungan Warta / Pengumuman:
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Tuliskan makluman terperinci untuk seluruh kakitangan syarikat..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs cursor-pointer"
                >
                  Terbitkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
