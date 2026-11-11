import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Search, 
  ShoppingBag, 
  Headphones, 
  Building2, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Printer, 
  Download, 
  Award, 
  Sparkles, 
  Filter, 
  UserCheck, 
  FileText,
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { Employee, TrainingChapter } from '../types/hr';
import { 
  TRAINING_TRACKS, 
  INITIAL_TRAINING_MODULES, 
  INITIAL_ONBOARDING_TASKS,
  TrainingTrack 
} from '../data/mockTrainingData';

interface TrainingMateriModuleProps {
  activeUser: Employee;
  employees: Employee[];
}

export const TrainingMateriModule: React.FC<TrainingMateriModuleProps> = ({
  activeUser,
  employees
}) => {
  const isManagerOrHR = activeUser.role === 'HRD' || activeUser.role === 'Director';

  // State
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<TrainingChapter | null>(null);
  
  // Completed modules set per user (stored in state, defaults to some completed for realism)
  const [completedModuleIds, setCompletedModuleIds] = useState<Record<string, boolean>>(() => {
    return {
      'mod-corp-01': true,
      'mod-corp-02': true
    };
  });

  // Onboarding tasks checked state
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({
    'task-01': true,
    'task-02': true
  });

  // Quiz state for selected module: { [questionId]: selectedOptionIndex }
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<Record<string, boolean>>({});

  // Print / SOP Guide Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter modules
  const filteredModules = useMemo(() => {
    return INITIAL_TRAINING_MODULES.filter(mod => {
      const matchTrack = selectedTrackId === 'all' || mod.track === selectedTrackId;
      const matchSearch = searchQuery.trim() === '' || 
        mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTrack && matchSearch;
    });
  }, [selectedTrackId, searchQuery]);

  // Overall progress percentage
  const totalModulesCount = INITIAL_TRAINING_MODULES.length;
  const completedCount = Object.values(completedModuleIds).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalModulesCount) * 100);

  const toggleModuleCompletion = (moduleId: string) => {
    setCompletedModuleIds(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleCheckQuiz = (moduleId: string) => {
    setShowQuizResults(prev => ({
      ...prev,
      [moduleId]: true
    }));
  };

  const getTrackIcon = (trackId?: string) => {
    switch (trackId) {
      case 'retail':
        return <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'cs':
        return <Headphones className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'admin':
        return <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'corporate':
      default:
        return <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & INTRODUCTORY BANNER                                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Modul Pembelajaran Calon &amp; Karyawan Baru</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Pusat Latihan &amp; SOP Pembelajaran
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Panduan standard operasi kerja bersepadu untuk <strong>Retail &amp; Kasir Kedai Buku</strong>, <strong>Customer Service (CS)</strong>, <strong>Pentadbiran Pejabat (Admin)</strong>, serta <strong>Akta Kerja 1955</strong> bagi Pustaka Union &amp; Solusi Serumpun Senusantara SDN. BHD.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Ringkasan SOP</span>
            </button>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-right">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kemajuan Anda
                </p>
                <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {completedCount}/{totalModulesCount} Selesai ({progressPercent}%)
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                {progressPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
            <span>Kemajuan Keseluruhan Latihan Calon</span>
            <span>{progressPercent === 100 ? '🎉 Latihan Lengkap 100%' : `${totalModulesCount - completedCount} modul lagi`}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TRACK SELECTOR CARDS (RETAIL, CS, ADMIN, AKTA KERJA)                  */}
      {/* ========================================================================= */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>Pilih Bidang Latihan (Track):</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRAINING_TRACKS.map(track => {
            const isSelected = selectedTrackId === track.id;
            const countInTrack = INITIAL_TRAINING_MODULES.filter(m => m.track === track.id).length;
            const completedInTrack = INITIAL_TRAINING_MODULES.filter(m => m.track === track.id && completedModuleIds[m.id]).length;

            return (
              <button
                key={track.id}
                onClick={() => {
                  setSelectedTrackId(isSelected ? 'all' : track.id);
                  setSelectedModule(null);
                }}
                className={`p-4 rounded-2xl text-left border-2 transition-all relative group flex flex-col justify-between ${
                  isSelected
                    ? `${track.accentBg} ring-2 ring-indigo-500/40 shadow-sm`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700">
                      {getTrackIcon(track.id)}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      {completedInTrack}/{countInTrack} Modul
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {track.shortDesc}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Sasaran: {track.targetRole}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-indigo-600' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN SPLIT: LIST OF MODULES / ACTIVE MODULE READER                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols or full): Module List */}
        <div className={`space-y-4 ${selectedModule ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tajuk modul, SOP, POS, aduan..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="text-slate-500">Memaparkan:</span>
              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {filteredModules.length} Modul
              </span>
              {selectedTrackId !== 'all' && (
                <button
                  onClick={() => setSelectedTrackId('all')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1"
                >
                  (Tunjuk Semua)
                </button>
              )}
            </div>
          </div>

          {/* Module Cards Grid/List */}
          <div className={`grid gap-4 ${selectedModule ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {filteredModules.map((module) => {
              const isSelected = selectedModule?.id === module.id;
              const isCompleted = !!completedModuleIds[module.id];

              return (
                <div
                  key={module.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all p-5 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                  onClick={() => setSelectedModule(module)}
                >
                  <div>
                    {/* Top Tag & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                          {getTrackIcon(module.track)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Bab {module.chapterNumber} · {module.category}
                        </span>
                      </div>

                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-3 h-3" /> Selesai
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Belum Selesai
                        </span>
                      )}
                    </div>

                    {/* Title & Summary */}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 line-clamp-2">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {module.summary}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      {module.estimatedMinutes} minit bacaan
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModule(module);
                      }}
                      className="font-bold text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <span>Buka Modul</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Onboarding Tasks Card (Checklist Calon Baru) */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Senarai Semak Orientasi Calon (Onboarding Tasks)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
                Fasa Hari 1 - Bulan 1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tandakan tugasan amali berikut bersama penyelia / HR semasa minggu pertama bertugas:
            </p>

            <div className="space-y-2 pt-1">
              {INITIAL_ONBOARDING_TASKS.map(task => {
                const isChecked = !!completedTaskIds[task.id];
                return (
                  <label
                    key={task.id}
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-slate-800/80 border-emerald-500/50 text-slate-300'
                        : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0 focus:ring-offset-0 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-400 font-mono">
                          {task.dayPhase}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          · {task.requiredFor}
                        </span>
                      </div>
                      <p className={`font-semibold mt-0.5 ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Full Reader View when a module is selected */}
        {selectedModule && (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Top Reader Navigation Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedModule(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Senarai Modul</span>
              </button>

              <button
                type="button"
                onClick={() => toggleModuleCompletion(selectedModule.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  completedModuleIds[selectedModule.id]
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {completedModuleIds[selectedModule.id] ? '✓ Selesai Dibaca' : 'Tandakan Selesai'}
                </span>
              </button>
            </div>

            {/* Chapter Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                  {getTrackIcon(selectedModule.track)}
                </span>
                <span>Bab {selectedModule.chapterNumber} · {selectedModule.category}</span>
                <span className="text-slate-400">· {selectedModule.estimatedMinutes} minit</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {selectedModule.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {selectedModule.summary}
              </p>
            </div>

            {/* Chapter Sections Body */}
            <div className="space-y-6 pt-2">
              {selectedModule.sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    {sec.heading}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sec.content.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>

                  {/* Key Takeaways Callout */}
                  {sec.keyPoints && sec.keyPoints.length > 0 && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Poin Penting (Key Takeaway):</span>
                      </p>
                      <ul className="list-disc list-inside text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        {sec.keyPoints.map((pt, ptIdx) => (
                          <li key={ptIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* SOP Points Callout */}
                  {sec.sopPoints && sec.sopPoints.length > 0 && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1.5">
                      <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Standard Operasi Tindakan (SOP Langkah Kerja):</span>
                      </p>
                      <ul className="list-decimal list-inside text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                        {sec.sopPoints.map((sp, spIdx) => (
                          <li key={spIdx}>{sp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ========================================================================= */}
            {/* MINI QUIZ / PEMERIKSAAN KEFAHAMAN                                        */}
            {/* ========================================================================= */}
            {selectedModule.quizQuestions && selectedModule.quizQuestions.length > 0 && (
              <div className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Ujian Kefahaman Pantas (Quiz)
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Uji kefahaman anda terhadap modul ini sebelum meneruskan ke topik seterusnya:
                </p>

                <div className="space-y-4">
                  {selectedModule.quizQuestions.map((q, qIndex) => {
                    const selectedOpt = quizAnswers[q.id];
                    const hasAnswered = selectedOpt !== undefined;
                    const isChecked = !!showQuizResults[selectedModule.id];
                    const isCorrect = selectedOpt === q.correctIndex;

                    return (
                      <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {qIndex + 1}. {q.question}
                        </p>

                        <div className="space-y-1.5">
                          {q.options.map((opt, optIndex) => {
                            const isChosen = selectedOpt === optIndex;
                            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300';
                            
                            if (isChecked) {
                              if (optIndex === q.correctIndex) {
                                btnStyle = 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                              } else if (isChosen && !isCorrect) {
                                btnStyle = 'bg-rose-50 dark:bg-rose-950 border-rose-400 text-rose-800 dark:text-rose-300 line-through';
                              }
                            } else if (isChosen) {
                              btnStyle = 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold';
                            }

                            return (
                              <button
                                key={optIndex}
                                type="button"
                                onClick={() => handleSelectQuizOption(q.id, optIndex)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isChecked && optIndex === q.correctIndex && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {isChecked && (
                          <div className={`p-2.5 rounded-lg text-[11px] ${isCorrect ? 'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200' : 'bg-rose-100/70 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200'}`}>
                            <strong>{isCorrect ? 'Tahniah! Jawapan tepat.' : 'Jawapan kurang tepat.'}</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Check Answers Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleCheckQuiz(selectedModule.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Semak Jawapan Kuiz
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleModuleCompletion(selectedModule.id);
                      setSelectedModule(null);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Selesai &amp; Kembali
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. HR SUPERVISOR VIEW: EMPLOYEE ONBOARDING PROGRESS TRACKER              */}
      {/* ========================================================================= */}
      {isManagerOrHR && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pemantauan Latihan &amp; Orientasi Pekerja (HR View)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau tahap penyelesaian modul latihan calon dan staf baru bagi kedua-dua syarikat.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
              {employees.length} Orang Karyawan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Nama Karyawan</th>
                  <th className="py-2.5 px-3">Syarikat / Jabatan</th>
                  <th className="py-2.5 px-3">Peranan</th>
                  <th className="py-2.5 px-3">Modul Selesai</th>
                  <th className="py-2.5 px-3">Status Latihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp, index) => {
                  // Simulate progress based on employee seniority
                  const isSenior = emp.role === 'HRD' || emp.role === 'Director' || index < 4;
                  const empCompleted = isSenior ? totalModulesCount : Math.min(totalModulesCount, (index % 4) + 2);
                  const empPercent = Math.round((empCompleted / totalModulesCount) * 100);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {emp.namaLengkap.slice(0, 2)}
                          </div>
                        )}
                        <span>{emp.namaLengkap}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        <div>{emp.company}</div>
                        <div className="text-[10px] text-slate-400">{emp.departemen}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {emp.jabatan}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{empCompleted}/{totalModulesCount}</span>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${empPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {empPercent === 100 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                            Lengkap 100%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium text-[10px]">
                            Dalam Proses ({empPercent}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRINT / RINGKASAN SOP MODAL                                           */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Panduan Ringkas SOP Calon &amp; Karyawan Baru
                </h3>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-900">
                <p className="font-bold text-indigo-900 dark:text-indigo-200">
                  Pustaka Union &amp; Solusi Serumpun Senusantara SDN. BHD.
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Ringkasan Rasmi Orientasi Pekerja Baru (Versi Kemas Kini November 2026)
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  1. RETAIL &amp; KASIR (Operasi Kedai Buku)
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Susun buku mengikut abjad tajuk/pengarang dan pastikan buku Best Seller diletakkan pada paras mata (120–160 cm).</li>
                  <li>Sambut pelanggan di kaunter dengan senyuman dan tanyakan Kad Ahli Rakan Union (10% diskaun).</li>
                  <li>Sebutkan nilai wang tunai yang diterima dan kira baki di hadapan pelanggan.</li>
                  <li>Penutupan harian: Cetak Z-Report, asingkan floating cash RM 300, dan simpan lebihan tunai dalam peti besi.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  2. CUSTOMER SERVICE (CS)
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Standard SLA WhatsApp: Jawab pertanyaan pelanggan dalam tempoh masa maksimum 5 minit.</li>
                  <li>Gunakan salam pembuka rasmi syarikat dan elakkan bahasa slanga atau singkatan perkataan.</li>
                  <li>Prinsip HEAT: Dengar aduan (Hear), Fahami masalah (Empathize), Mohon maaf &amp; bertindak (Apologize &amp; Act), serta Berterima kasih (Thank).</li>
                  <li>Buku koyak/salah cetak kilang layak diganti 1-ke-1 dalam 14 hari dengan bukti resit.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  3. PENTADBIRAN &amp; ADMIN PEJABAT
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Format nombor surat keluar: [KOD]/[JABATAN]/[BULAN-TAHUN]/[SIRI] (Cth: PU/HR/05-25/088).</li>
                  <li>Semua bungkusan kurier (PosLaju, J&amp;T) wajib direkodkan dalam Buku Log Kurier dan ditandatangani penerima.</li>
                  <li>Tuntutan petty cash memerlukan Tax Invoice asal; tiada resit bermakna tiada bayaran balik.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  4. POLISI AKTA KERJA 1955 &amp; JAM KERJA
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Waktu bekerja dihadkan kepada maksimum 45 jam seminggu.</li>
                  <li>Karyawan wajib mengklik "Check In" dan "Check Out" secara sedar di Dashboard pada setiap hari bekerja.</li>
                  <li>Had toleransi shift adalah 10–15 minit; lewat dari had dicatat sebagai late_minutes.</li>
                  <li>Caruman berkanun wajib: KWSP Pekerja 11%, Majikan 12%/13%, SOCSO dan EIS bagi setiap staf yang layak.</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Peringatan: Dokumen ini adalah hak cipta dalaman syarikat.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
