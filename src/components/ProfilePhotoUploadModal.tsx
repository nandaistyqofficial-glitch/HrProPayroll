import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Check, 
  User, 
  Image as ImageIcon,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { Employee } from '../types/hr';

interface ProfilePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: Employee;
  onPhotoUpdated: (newAvatarUrl: string) => void;
}

export const ProfilePhotoUploadModal: React.FC<ProfilePhotoUploadModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onPhotoUpdated,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(activeUser.avatarUrl || '');
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej (PNG, JPG, WEBP).');
      return;
    }

    setFileName(file.name);
    setFileSizeStr((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setPreviewUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (previewUrl) {
      onPhotoUpdated(previewUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Tukar Foto Profil
              </h3>
              <p className="text-xs text-slate-500">
                Pilih fail gambar dari peranti anda untuk avatar &amp; navbar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Avatar Preview Lockup */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500/30 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-4 border-slate-300 dark:border-slate-700 shadow-inner">
                  <User className="w-12 h-12" />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 cursor-pointer transition-transform active:scale-95"
                title="Pilih gambar baru"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {activeUser.namaLengkap}
              </p>
              <p className="text-xs text-slate-500">
                {activeUser.jabatan} · {activeUser.company}
              </p>
              {fileName && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                  ✓ {fileName} ({fileSizeStr})
                </p>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <Upload className="w-7 h-7 mx-auto text-indigo-500 mb-2" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Klik untuk pilih gambar atau seret fail ke sini
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Menyokong format JPG, PNG, WEBP atau GIF (Maks. 5MB)
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!previewUrl || previewUrl === activeUser.avatarUrl}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-800 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Foto Profil</span>
          </button>
        </div>

      </div>
    </div>
  );
};
