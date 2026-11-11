import React, { useState, useMemo } from 'react';
import { 
  Award, 
  TrendingUp, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Printer, 
  Edit3, 
  ChevronRight, 
  X, 
  Save, 
  Sparkles, 
  Star,
  Building2,
  Calendar,
  Briefcase
} from 'lucide-react';
import { 
  Employee, 
  PerformanceReview, 
  ReviewPeriod, 
  ReviewStatus, 
  KPIIndicator,
  Department
} from '../types/hr';

interface KPIModuleProps {
  employees: Employee[];
  activeUser: Employee;
  reviews: PerformanceReview[];
  onAddReview: (review: PerformanceReview) => void;
  onUpdateReview: (review: PerformanceReview) => void;
}

export const KPIModule: React.FC<KPIModuleProps> = ({
  employees,
  activeUser,
  reviews,
  onAddReview,
  onUpdateReview,
}) => {
  const isManagerOrHR = activeUser.role === 'HRD' || activeUser.role === 'Director';

  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected review for full scorecard modal
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(null);

  // New / Edit Review Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Form State
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(employees[0]?.id || '');
  const [formPeriod, setFormPeriod] = useState<ReviewPeriod>('Q1 2025');
  const [formStatus, setFormStatus] = useState<ReviewStatus>('Selesai Direview');
  const [formManagerFeedback, setFormManagerFeedback] = useState('');
  const [formHRFeedback, setFormHRFeedback] = useState('');
  const [formRecommendation, setFormRecommendation] = useState<PerformanceReview['rekomendasi']>('Kenaikan Gaji Berkala');
  
  // Indicators for the form
  const [formIndicators, setFormIndicators] = useState<KPIIndicator[]>([
    { id: '1', namaIndikator: 'Pencapaian Sasaran Tugasan & Disiplin', targetKuantitatif: '100% Mengikut Jadual', bobotPersen: 30, realisasiKuantitatif: '95% Tercapai', skor: 95 },
    { id: '2', namaIndikator: 'Kualiti Hasil Kerja & Ketepatan SOP', targetKuantitatif: 'Kecacatan < 2%', bobotPersen: 30, realisasiKuantitatif: 'Kecacatan 1%', skor: 92 },
    { id: '3', namaIndikator: 'Komunikasi & Layanan Pelanggan / Rakan Kerja', targetKuantitatif: 'Skor CSAT > 90%', bobotPersen: 20, realisasiKuantitatif: 'Skor 94%', skor: 94 },
    { id: '4', namaIndikator: 'Kehadiran & Ketepatan Masa Bertugas', targetKuantitatif: 'Sifar Kelewatan (0 Minit)', bobotPersen: 20, realisasiKuantitatif: 'Tepat Waktu 98%', skor: 96 },
  ]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchPeriod = selectedPeriod === 'all' || rev.periode === selectedPeriod;
      const emp = employees.find(e => e.id === rev.employeeId);
      const matchCompany = selectedCompanyFilter === 'all' || (emp && emp.company === selectedCompanyFilter);
      const matchDept = selectedDeptFilter === 'all' || rev.departemen === selectedDeptFilter;
      const matchSearch = searchQuery.trim() === '' || 
        rev.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.jabatan.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPeriod && matchCompany && matchDept && matchSearch;
    });
  }, [reviews, selectedPeriod, selectedCompanyFilter, selectedDeptFilter, searchQuery, employees]);

  // Summary Metrics
  const avgScore = useMemo(() => {
    if (filteredReviews.length === 0) return 0;
    const sum = filteredReviews.reduce((acc, r) => acc + r.totalSkorTertimbang, 0);
    return Math.round((sum / filteredReviews.length) * 10) / 10;
  }, [filteredReviews]);

  const gradeCountA = filteredReviews.filter(r => r.grade.startsWith('A')).length;
  const gradeCountB = filteredReviews.filter(r => r.grade.startsWith('B')).length;

  const handleOpenCreate = () => {
    setEditingReviewId(null);
    setTargetEmployeeId(employees[0]?.id || '');
    setFormPeriod('Q1 2025');
    setFormStatus('Selesai Direview');
    setFormManagerFeedback('Karyawan menunjukkan komitmen tinggi dan pencapaian sasaran kerja yang konsisten sepanjang suku tahun.');
    setFormHRFeedback('Rekod kehadiran cemerlang, tiada isu disiplin berkanun, disyorkan pertimbangan kenaikan gaji berkala.');
    setFormRecommendation('Kenaikan Gaji Berkala');
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === targetEmployeeId);
    if (!emp) return;

    // Calculate total weighted score
    const totalWeighted = Math.round(
      formIndicators.reduce((sum, ind) => sum + (ind.skor * (ind.bobotPersen / 100)), 0)
    );

    // Compute grade
    let grade: PerformanceReview['grade'] = 'B (Sesuai Target)';
    if (totalWeighted >= 90) grade = 'A+ (Sangat Unggul)';
    else if (totalWeighted >= 80) grade = 'A (Melampaui Target)';
    else if (totalWeighted >= 70) grade = 'B (Sesuai Target)';
    else if (totalWeighted >= 60) grade = 'C (Perlu Perbaikan)';
    else grade = 'D (Kurang)';

    const newReview: PerformanceReview = {
      id: editingReviewId || `kpi-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.namaLengkap,
      jabatan: emp.jabatan,
      departemen: emp.departemen,
      avatarUrl: emp.avatarUrl,
      periode: formPeriod,
      status: formStatus,
      indikatorList: formIndicators,
      totalSkorTertimbang: totalWeighted,
      grade,
      umpanBalikManager: formManagerFeedback,
      umpanBalikHR: formHRFeedback,
      rekomendasi: formRecommendation,
      reviewerName: activeUser.namaLengkap,
      tanggalReview: '2025-05-12'
    };

    if (editingReviewId) {
      onUpdateReview(newReview);
    } else {
      onAddReview(newReview);
    }

    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Award className="w-3.5 h-3.5 text-indigo-500" />
              <span>Modul Pengurusan Prestasi &amp; KPI Korporat</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Penilaian Prestasi &amp; KPI Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Sistem penilaian indikator prestasi utama berasaskan bobot kuantitatif, gred penilaian (A+, A, B, C, D), serta cadangan kenaikan gaji dan kenaikan pangkat bagi Pustaka Union &amp; Solusi Serumpun.
            </p>
          </div>

          {isManagerOrHR && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Cipta Penilaian KPI Baru</span>
            </button>
          )}
        </div>

        {/* 4 KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium block">Purata Skor Keseluruhan:</span>
            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{avgScore} / 100</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium block">Gred Cemerlang (A+ &amp; A):</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{gradeCountA} orang</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium block">Gred Sesuai Sasaran (B):</span>
            <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">{gradeCountB} orang</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-[11px] text-slate-400 font-medium block">Jumlah Penilaian Rekod:</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{filteredReviews.length} rekod</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau jawatan..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto text-xs">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 dark:text-white"
          >
            <option value="all">Semua Tempoh</option>
            <option value="Q1 2025">Q1 2025</option>
            <option value="Q2 2025">Q2 2025</option>
            <option value="Tahunan 2024">Tahunan 2024</option>
          </select>

          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 dark:text-white"
          >
            <option value="all">Semua Syarikat</option>
            <option value="Pustaka Union">Pustaka Union</option>
            <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun</option>
          </select>
        </div>
      </div>

      {/* KPI Review Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReviews.map((rev) => {
          const isA = rev.grade.startsWith('A');
          return (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {rev.avatarUrl ? (
                      <img src={rev.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {rev.employeeName.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {rev.employeeName}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {rev.jabatan}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    isA 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                  }`}>
                    {rev.grade}
                  </span>
                </div>

                {/* Score & Period */}
                <div className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Skor Tertimbang:</span>
                    <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {rev.totalSkorTertimbang} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Tempoh Penilaian:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {rev.periode}
                    </span>
                  </div>
                </div>

                {/* Recommendation Pill */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Cadangan Pihak Pengurusan:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span>{rev.rekomendasi}</span>
                  </span>
                </div>
              </div>

              {/* Footer View Scorecard */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  Dinilai oleh: {rev.reviewerName}
                </span>

                <button
                  type="button"
                  onClick={() => setViewingReview(rev)}
                  className="font-bold text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Kad Skor</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW FULL KPI SCORECARD                                         */}
      {/* ========================================================================= */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Kad Skor KPI Rasmi Karyawan
                  </h3>
                  <p className="text-xs text-slate-500">
                    {viewingReview.employeeName} ({viewingReview.jabatan}) · {viewingReview.periode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingReview(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Grade Highlight Box */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                  Skor Keseluruhan:
                </span>
                <span className="text-3xl font-extrabold font-mono text-indigo-950 dark:text-indigo-100">
                  {viewingReview.totalSkorTertimbang} / 100
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Keputusan Gred:
                </span>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono bg-indigo-600 text-white shadow-xs">
                  {viewingReview.grade}
                </span>
              </div>
            </div>

            {/* Indicators Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Perincian Indikator Kuantitatif:
              </h4>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Indikator</th>
                      <th className="py-2.5 px-3">Sasaran Target</th>
                      <th className="py-2.5 px-3">Realisasi</th>
                      <th className="py-2.5 px-3 text-right">Bobot</th>
                      <th className="py-2.5 px-3 text-right">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {viewingReview.indikatorList.map((ind, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {ind.namaIndikator}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {ind.targetKuantitatif}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                          {ind.realisasiKuantitatif}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {ind.bobotPersen}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {ind.skor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feedback & Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Umpan Balik Pengurus (Manager Feedback):
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {viewingReview.umpanBalikManager}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Umpan Balik HR &amp; Pematuhan:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {viewingReview.umpanBalikHR}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Tarikh Semakan: {viewingReview.tanggalReview}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Kad Skor</span>
                </button>
                <button
                  onClick={() => setViewingReview(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT KPI FORM                                          */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Borang Penilaian Prestasi &amp; KPI Karyawan
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Karyawan:
                  </label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.namaLengkap} - {emp.jabatan} ({emp.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tempoh Penilaian:
                  </label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as ReviewPeriod)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Q1 2025">Q1 2025</option>
                    <option value="Q2 2025">Q2 2025</option>
                    <option value="Q3 2025">Q3 2025</option>
                    <option value="Q4 2025">Q4 2025</option>
                    <option value="Tahunan 2024">Tahunan 2024</option>
                  </select>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cadangan Pihak Pengurusan:
                </label>
                <select
                  value={formRecommendation}
                  onChange={(e) => setFormRecommendation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Kenaikan Gaji Berkala">Kenaikan Gaji Berkala</option>
                  <option value="Promosi Jabatan">Promosi Jabatan (Kenaikan Pangkat)</option>
                  <option value="Pertahankan Kinerja">Pertahankan Kinerja Semasa</option>
                  <option value="Pelatihan Khusus">Pelatihan Khusus &amp; Pembangunan Diri</option>
                  <option value="Performance Improvement Plan (PIP)">Performance Improvement Plan (PIP)</option>
                </select>
              </div>

              {/* Feedbacks */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ulasan Manager:
                </label>
                <textarea
                  rows={2}
                  value={formManagerFeedback}
                  onChange={(e) => setFormManagerFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ulasan HR:
                </label>
                <textarea
                  rows={2}
                  value={formHRFeedback}
                  onChange={(e) => setFormHRFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Penilaian KPI
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
