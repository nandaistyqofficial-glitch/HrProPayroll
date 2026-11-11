import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { AppNotification } from '../types/hr';

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  // Show only latest 3 notifications as toasts
  const activeToasts = notifications.slice(0, 3);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {activeToasts.map((notif) => {
        const isSuccess = notif.type === 'success';
        const isError = notif.type === 'error';
        const isWarning = notif.type === 'warning';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all animate-in slide-in-from-top-2 duration-200 ${
              isSuccess
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 shadow-emerald-950/30'
                : isError
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-100 shadow-rose-950/30'
                : isWarning
                ? 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-950/30'
                : 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-black/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <XCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertCircle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-xs leading-tight tracking-tight text-white truncate">
                  {notif.title}
                </p>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {notif.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug line-clamp-3">
                {notif.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(notif.id)}
              className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Tutup Notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
