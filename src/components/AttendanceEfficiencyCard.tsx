import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Filter, 
  Sparkles, 
  Users, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../types/hr';

interface AttendanceEfficiencyCardProps {
  attendanceRecords: AttendanceRecord[];
  employees: Employee[];
  activeUser: Employee;
  onNavigateToAttendance?: () => void;
}

export const AttendanceEfficiencyCard: React.FC<AttendanceEfficiencyCardProps> = ({
  attendanceRecords,
  employees,
  activeUser,
  onNavigateToAttendance,
}) => {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Pustaka Union' | 'Solusi Serumpun Senusantara SDN. BHD'>('all');
  const [hoveredSlice, setHoveredSlice] = useState<{ label: string; count: number; percent: number; color: string } | null>(null);

  // Compute attendance metrics for the current cycle / records
  const metrics = useMemo(() => {
    // Filter records by company if selected
    const filtered = selectedFilter === 'all'
      ? attendanceRecords
      : attendanceRecords.filter(r => r.company === selectedFilter);

    // Only count records that have check-in (attended or late)
    const validRecords = filtered.filter(r => r.jamMasuk && r.jamMasuk !== '-' && r.status !== 'Bercuti' && r.status !== 'Sakit (MC)' && r.status !== 'Hari Rehat (Off)');
    
    const onTimeRecords = validRecords.filter(r => r.status === 'Hadir' || (r.lateMinutes === 0 && r.status !== 'Lewat'));
    const lateRecords = validRecords.filter(r => r.status === 'Lewat' || (r.lateMinutes && r.lateMinutes > 0));

    const totalCheckIns = validRecords.length || 1; // avoid divide by zero
    const onTimeCount = onTimeRecords.length;
    const lateCount = lateRecords.length;

    const onTimeRatio = Math.round((onTimeCount / totalCheckIns) * 100);
    const lateRatio = 100 - onTimeRatio;

    const totalLateMinutes = lateRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const avgLateMinutes = lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0;

    // Efficiency grade
    let gradeLabel = 'Cemerlang';
    let gradeColor = 'text-emerald-600 dark:text-emerald-400';
    let gradeBg = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';

    if (onTimeRatio >= 90) {
      gradeLabel = 'Cemerlang (90%+)';
      gradeColor = 'text-emerald-600 dark:text-emerald-400';
      gradeBg = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
    } else if (onTimeRatio >= 75) {
      gradeLabel = 'Baik (75% - 89%)';
      gradeColor = 'text-sky-600 dark:text-sky-400';
      gradeBg = 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800';
    } else {
      gradeLabel = 'Perlu Perhatian (<75%)';
      gradeColor = 'text-amber-600 dark:text-amber-400';
      gradeBg = 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
    }

    return {
      totalCheckIns: validRecords.length,
      onTimeCount,
      lateCount,
      onTimeRatio,
      lateRatio,
      totalLateMinutes,
      avgLateMinutes,
      gradeLabel,
      gradeColor,
      gradeBg,
      chartData: [
        { label: 'Tepat Waktu (On-Time)', count: onTimeCount, percent: onTimeRatio, color: '#10b981' }, // emerald-500
        { label: 'Lewat (Late)', count: lateCount, percent: lateRatio, color: '#f59e0b' } // amber-500
      ]
    };
  }, [attendanceRecords, selectedFilter]);

  // Render D3 Donut Chart
  useEffect(() => {
    if (!d3Container.current) return;

    const svg = d3.select(d3Container.current);
    svg.selectAll('*').remove(); // clear previous render

    const width = 180;
    const height = 180;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.65; // Donut hole

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Prepare pie layout
    const pie = d3.pie<any>()
      .value(d => Math.max(d.count, 0.0001))
      .sort(null);

    // Arc generator
    const arc = d3.arc<any>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6)
      .padAngle(0.04);

    const arcHover = d3.arc<any>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 4)
      .cornerRadius(6)
      .padAngle(0.04);

    const pieData = pie(metrics.chartData);

    // Slices group
    const slices = g.selectAll('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#0f172a') // dark outline or bg match
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease');

    // Interactivity
    slices
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arcHover as any)
          .attr('opacity', 0.9);

        setHoveredSlice(d.data);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc as any)
          .attr('opacity', 1);

        setHoveredSlice(null);
      });

    // Center text (Efficiency %)
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('class', 'font-extrabold font-mono text-slate-900 dark:text-white')
      .style('font-size', '24px')
      .style('fill', 'currentColor')
      .text(`${metrics.onTimeRatio}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('class', 'text-slate-500 font-semibold uppercase')
      .style('font-size', '9px')
      .style('letter-spacing', '0.06em')
      .style('fill', '#94a3b8')
      .text('Tepat Waktu');

  }, [metrics]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
      
      {/* Header & Company Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Kecekapan Kehadiran Bulanan (Attendance Efficiency)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nisbah kehadiran tepat waktu (On-Time) berbanding lewat (Late) kitaran semasa diselaraskan D3.js.
          </p>
        </div>

        {/* Company Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('Pustaka Union')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedFilter === 'Pustaka Union'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            PU
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('Solusi Serumpun Senusantara SDN. BHD')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedFilter === 'Solusi Serumpun Senusantara SDN. BHD'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            SSS
          </button>
        </div>
      </div>

      {/* Main Visual Content: D3 Chart + Breakdown Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* D3 Donut Visualizer (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
          <div className="relative w-[180px] h-[180px]">
            <svg ref={d3Container} className="w-full h-full drop-shadow-xs" />
          </div>

          {/* Hover Status Callout */}
          <div className="h-6 mt-2 text-center text-xs">
            {hoveredSlice ? (
              <span className="font-bold" style={{ color: hoveredSlice.color }}>
                {hoveredSlice.label}: {hoveredSlice.count} rekod ({hoveredSlice.percent}%)
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Sentuh segmen carta untuk melihat perincian
              </span>
            )}
          </div>
        </div>

        {/* Detailed Breakdown KPIs (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          
          {/* Status Badge Strip */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${metrics.gradeBg}`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Tahap Disiplin Waktu Kerja:
              </span>
            </div>
            <span className={`font-bold font-mono ${metrics.gradeColor}`}>
              {metrics.gradeLabel}
            </span>
          </div>

          {/* 2-Column Metric Tiles */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* On-Time Tile */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tepat Waktu</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {metrics.onTimeRatio}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-emerald-950 dark:text-emerald-100">
                  {metrics.onTimeCount}
                </span>
                <span className="text-[10px] text-slate-500">hari bertugas</span>
              </div>
              <div className="w-full bg-emerald-200/50 dark:bg-emerald-900/50 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.onTimeRatio}%` }}
                />
              </div>
            </div>

            {/* Late Tile */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Keterlambatan</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                  {metrics.lateRatio}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-amber-950 dark:text-amber-100">
                  {metrics.lateCount}
                </span>
                <span className="text-[10px] text-slate-500">kes lewat</span>
              </div>
              <div className="w-full bg-amber-200/50 dark:bg-amber-900/50 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.lateRatio}%` }}
                />
              </div>
            </div>

          </div>

          {/* Average Late & Total Check-ins Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                Purata Lewat: <strong className="text-slate-800 dark:text-slate-200 font-mono">{metrics.avgLateMinutes} minit</strong> per kes
              </span>
            </div>
            
            {onNavigateToAttendance && (
              <button
                type="button"
                onClick={onNavigateToAttendance}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Semak Log Penuh</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
