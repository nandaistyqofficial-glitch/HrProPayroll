import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Clock, 
  Sparkles, 
  Tag, 
  Search, 
  Filter, 
  Info,
  ChevronRight,
  Flame,
  Star,
  CalendarDays,
  CalendarRange,
  Download
} from 'lucide-react';
import { 
  MALAYSIAN_PUBLIC_HOLIDAYS_2025, 
  ALL_MALAYSIAN_PUBLIC_HOLIDAYS, 
  AVAILABLE_HOLIDAY_YEARS 
} from '../data/malaysianHolidaysData';
import { MalaysianStateHoliday, PublicHoliday } from '../types/hr';

interface MalaysianPublicHolidayCalendarProps {
  onSelectHoliday?: (holiday: PublicHoliday) => void;
}

export const MalaysianPublicHolidayCalendar: React.FC<MalaysianPublicHolidayCalendarProps> = ({
  onSelectHoliday
}) => {
  // Year Filter: 'all' or specific year number
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all holidays according to year selection
  const rawHolidays = useMemo(() => {
    if (selectedYear === 'all') {
      return Object.values(ALL_MALAYSIAN_PUBLIC_HOLIDAYS).flat();
    }
    const y = parseInt(selectedYear, 10);
    return ALL_MALAYSIAN_PUBLIC_HOLIDAYS[y] || MALAYSIAN_PUBLIC_HOLIDAYS_2025;
  }, [selectedYear]);

  // Filter holidays by state, category, search query
  const filteredHolidays = useMemo(() => {
    return rawHolidays.filter(h => {
      // State filter
      if (selectedState === 'Selangor' && h.state !== 'Selangor' && !h.isNational && h.state !== 'Kuala Lumpur') return false;
      if (selectedState === 'Kedah' && h.state !== 'Kedah' && !h.isNational) return false;
      if (selectedState === 'Kuala Lumpur' && h.state !== 'Kuala Lumpur' && !h.isNational) return false;
      if (selectedState === 'national_only' && !h.isNational) return false;

      // Category filter
      if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.date.includes(q) ||
          h.state.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [rawHolidays, selectedState, selectedCategory, searchQuery]);

  // System benchmark date (simulation date 12 Mei 2025)
  const systemDate = '2025-05-12';
  const upcomingHoliday = rawHolidays.find(h => h.date >= systemDate);

  // Statistics
  const totalHolidays = filteredHolidays.length;
  const nationalCount = filteredHolidays.filter(h => h.isNational).length;
  const selangorCount = filteredHolidays.filter(h => h.state === 'Selangor').length;
  const kedahCount = filteredHolidays.filter(h => h.state === 'Kedah').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-6 p-4 sm:p-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-400 text-white flex items-center justify-center shadow-md">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kalendar Cuti Umum Tempatan Malaysia
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Kedah &amp; Selangor
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {selectedYear === 'all' ? 'SEMUA TAHUN' : `Tahun ${selectedYear}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jadual Hari Kelepasan Am Berkanun mengikut Akta Hari Kelepasan 1951 &amp; Akta Kerja 1955 bagi Negeri Kedah, Selangor &amp; Kebangsaan.
            </p>
          </div>
        </div>

        {/* Year Selector Tabs (2024, 2025, 2026, 2027, SEMUA TAHUN) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedYear === 'all'
                ? 'bg-amber-500 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🌟 Semua Tahun (2024-2027)
          </button>
          {AVAILABLE_HOLIDAY_YEARS.map(yr => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr.toString())}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedYear === yr.toString()
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari cuti (cth: Thaipusam, Sultan Kedah, Raya, Nuzul)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* State Filter Buttons */}
        <div className="md:col-span-7 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
          <button
            type="button"
            onClick={() => setSelectedState('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedState === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua Kawasan ({totalHolidays})
          </button>
          <button
            type="button"
            onClick={() => setSelectedState('Kedah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedState === 'Kedah'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            Negeri Kedah (+Khas)
          </button>
          <button
            type="button"
            onClick={() => setSelectedState('Selangor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedState === 'Selangor'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            Negeri Selangor &amp; KL (+Khas)
          </button>
          <button
            type="button"
            onClick={() => setSelectedState('national_only')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedState === 'national_only'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
            }`}
          >
            Kebangsaan Sahaja
          </button>
        </div>
      </div>

      {/* State Special Notices & Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Kedah Policy Notice */}
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-bold">Ketetapan Cuti &amp; Operasi Negeri Kedah Darul Aman:</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-mono font-bold">
                Jumaat &amp; Sabtu Libur
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
              Negeri Kedah mengamalkan cuti hujung minggu rasmi pada hari <strong>Jumaat dan Sabtu</strong>. Hari bekerja rasmi bermula hari <strong>Ahad hingga Khamis</strong>. Cuti umum negeri khas di Kedah merangkumi <strong>Hari Keputeraan Sultan Kedah (Ahad minggu ke-3 Jun)</strong>, <strong>Israk &amp; Mikraj (27 Rejab)</strong>, dan <strong>Awal Ramadan (1 Ramadan)</strong>.
            </p>
          </div>
        </div>

        {/* Selangor Policy Notice */}
        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-bold">Ketetapan Cuti &amp; Operasi Negeri Selangor Darul Ehsan:</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-100 font-mono font-bold">
                Sabtu &amp; Ahad Libur
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              Negeri Selangor dan Wilayah Persekutuan Kuala Lumpur beroperasi pada hari <strong>Isnin hingga Jumaat</strong> (hujung minggu Sabtu dan Ahad). Cuti khas negeri merangkumi <strong>Hari Keputeraan Sultan Selangor (11 Disember)</strong>, <strong>Hari Nuzul Al-Quran (17 Ramadan)</strong>, dan <strong>Hari Thaipusam</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Holiday Highlight (when applicable) */}
      {upcomingHoliday && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Cuti Berkanun Terdekat (Upcoming Holiday)
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {upcomingHoliday.name} — <strong className="font-mono text-amber-700 dark:text-amber-400">{upcomingHoliday.date}</strong> ({upcomingHoliday.dayName})
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {upcomingHoliday.description}
              </p>
            </div>
          </div>

          <span className="self-end sm:self-center px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold font-mono text-[11px] shrink-0">
            {upcomingHoliday.state}
          </span>
        </div>
      )}

      {/* Holiday Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Tahun &amp; Tarikh</th>
              <th className="px-4 py-3">Hari</th>
              <th className="px-4 py-3">Nama Hari Kelepasan Am</th>
              <th className="px-4 py-3">Kawasan Terlibat</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Huraian Peristiwa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredHolidays.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                  Tiada cuti umum dijumpai bagi kriteria penapis yang dipilih.
                </td>
              </tr>
            ) : (
              filteredHolidays.map((h) => {
                const isPast = h.date < systemDate;
                const yearOfHoliday = h.date.split('-')[0];

                return (
                  <tr 
                    key={h.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isPast ? 'opacity-65' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {yearOfHoliday}
                        </span>
                        <span>{h.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {h.dayName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {h.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        h.state === 'Kebangsaan'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : h.state === 'Selangor'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : h.state === 'Kedah'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                      }`}>
                        {h.state === 'Kebangsaan' ? '🇲🇾 Seluruh Malaysia' : h.state === 'Kedah' ? 'Kedah Darul Aman' : h.state === 'Selangor' ? 'Selangor Darul Ehsan' : h.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                        {h.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-sm truncate" title={h.description}>
                      {h.description}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          Menampilkan <strong className="text-slate-900 dark:text-white font-mono">{filteredHolidays.length}</strong> hari kelepasan am 
          {selectedYear === 'all' ? ' untuk semua tahun (2024 - 2027)' : ` bagi tahun ${selectedYear}`}.
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Kebangsaan: {nationalCount}</span>
          <span>•</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">Kedah: {kedahCount}</span>
          <span>•</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">Selangor: {selangorCount}</span>
        </div>
      </div>

    </div>
  );
};
