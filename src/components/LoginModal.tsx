import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Globe2,
  Users
} from 'lucide-react';
import { Employee, UserRole } from '../types/hr';

interface LoginModalProps {
  employees: Employee[];
  onLoginSuccess: (user: Employee) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ employees, onLoginSuccess }) => {
  const [email, setEmail] = useState('siti.fatimah@pustakaunion.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const foundUser = employees.find(
      emp => emp.email.toLowerCase() === trimmedEmail
    );

    if (!foundUser) {
      setErrorMessage('Emel tidak dijumpai dalam pengkalan data biodata pekerja syarikat.');
      return;
    }

    // Verify password (default 'password123' if not set)
    const validPassword = foundUser.password || 'password123';
    if (password !== validPassword) {
      setErrorMessage('Kata laluan tidak sah. Sila cuba lagi atau hubungi pentadbir HR.');
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleQuickSelect = (emp: Employee) => {
    setEmail(emp.email);
    setPassword(emp.password || 'password123');
    setErrorMessage('');
    onLoginSuccess(emp);
  };

  // Find sample test users
  const hrdUser = employees.find(e => e.role === 'HRD') || employees[1];
  const directorUser = employees.find(e => e.role === 'Director') || employees[0];
  const remoteUser = employees.find(e => e.isRemoteOutsideMalaysia) || employees[17];
  const staffPuUser = employees.find(e => e.company === 'Pustaka Union' && e.role === 'Employee') || employees[2];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Card */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md mb-4">
            <Building2 className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Portal Log Masuk HRD & ESS
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sistem Bersepadu Pustaka Union & Solusi Serumpun Senusantara SDN. BHD
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-8 pt-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Alamat Emel Rasmi (Terdaftar dalam Biodata)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@pustakaunion.com atau nama@solusiserumpun.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kata Laluan Keselamatan
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <span>Log Masuk ke Sistem</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Role Access Information Note */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Kawalan Akses Peranan (RBAC):
            </p>
            <p>• <strong>HRD & Pengarah/Pengurus:</strong> Akses penuh semua modul syarikat.</p>
            <p>• <strong>Staf / Karyawan:</strong> Akses terhad hanya profil, absensi & cuti sendiri.</p>
          </div>

          {/* Quick 1-Click Role Switcher Demo */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
              Pilih Akses Demo Pantas (1-Klik):
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {hrdUser && (
                <button
                  type="button"
                  onClick={() => handleQuickSelect(hrdUser)}
                  className="p-2 text-left bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg hover:border-indigo-400 transition-colors"
                >
                  <p className="font-bold text-indigo-700 dark:text-indigo-300 truncate">Siti Fatimah (HRD)</p>
                  <p className="text-slate-500 truncate">Akses Penuh Semua Modul</p>
                </button>
              )}

              {directorUser && (
                <button
                  type="button"
                  onClick={() => handleQuickSelect(directorUser)}
                  className="p-2 text-left bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-400 transition-colors"
                >
                  <p className="font-bold text-slate-900 dark:text-white truncate">Cheah Leong Tim</p>
                  <p className="text-slate-500 truncate">Pengarah (Director)</p>
                </button>
              )}

              {remoteUser && (
                <button
                  type="button"
                  onClick={() => handleQuickSelect(remoteUser)}
                  className="p-2 text-left bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg hover:border-emerald-400 transition-colors"
                >
                  <p className="font-bold text-emerald-700 dark:text-emerald-300 truncate">Ananda Istiqomah (HR)</p>
                  <p className="text-slate-500 truncate">Akses HR Pentadbir Solusi</p>
                </button>
              )}

              {staffPuUser && (
                <button
                  type="button"
                  onClick={() => handleQuickSelect(staffPuUser)}
                  className="p-2 text-left bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-400 transition-colors"
                >
                  <p className="font-bold text-slate-900 dark:text-white truncate">Cheah Leong Keat</p>
                  <p className="text-slate-500 truncate">Staf Pemasaran PU</p>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
