import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  FileCheck, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Calendar, 
  ShieldCheck,
  FilePlus,
  Paperclip
} from 'lucide-react';
import { Employee, EmployeeDocument } from '../types/hr';

interface ContractDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmployeeId?: string;
  activeUser: Employee;
  onUpdateEmployee: (updated: Employee) => void;
}

export const ContractDocumentModal: React.FC<ContractDocumentModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialEmployeeId,
  activeUser,
  onUpdateEmployee,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'upload' | 'list'>('upload');

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployeeId || employees[0]?.id || ''
  );
  const [docType, setDocType] = useState<EmployeeDocument['type']>(
    'Surat Tawaran Kerja (Offering Letter)'
  );
  const [customTitle, setCustomTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Hidden File input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List filter state
  const [filterEmpId, setFilterEmpId] = useState<string>('all');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const targetEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: file.size,
      });
      if (!customTitle) {
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Submit Upload
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee) return;

    const fileName = selectedFile?.name || (customTitle ? `${customTitle}.pdf` : `Dokumen_${docType.split(' ')[0]}_${targetEmployee.nik}.pdf`);
    const fileSize = selectedFile?.size || 342000;

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      name: fileName,
      type: docType,
      fileSize,
      uploadedAt: dateFormatted,
      uploadedBy: activeUser.namaLengkap,
    };

    const currentDocs = targetEmployee.contractDocuments || [];
    const updatedEmployee: Employee = {
      ...targetEmployee,
      contractDocuments: [newDoc, ...currentDocs],
    };

    onUpdateEmployee(updatedEmployee);
    setUploadSuccessMsg(`Berjaya memuat naik "${fileName}" bagi ${targetEmployee.namaLengkap}!`);
    setSelectedFile(null);
    setCustomTitle('');

    setTimeout(() => {
      setUploadSuccessMsg(null);
    }, 4000);
  };

  // Delete Document
  const handleDeleteDocument = (empId: string, docId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    if (!confirm('Adakah anda pasti mahu memadamkan dokumen kontrak/tawaran ini?')) return;

    const updatedDocs = (emp.contractDocuments || []).filter(d => d.id !== docId);
    onUpdateEmployee({
      ...emp,
      contractDocuments: updatedDocs,
    });
  };

  // Download simulation
  const handleDownloadDoc = (docName: string) => {
    const dummyContent = `Pustaka Union & Solusi Serumpun Senusantara SDN. BHD\nDokumen Rasmi: ${docName}\nStatus: Sah & Ditandatangani\nTarikh Cetakan: ${new Date().toLocaleDateString('ms-MY')}`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // All documents across all employees
  const allDocumentsWithEmp = useMemo(() => {
    return employees.flatMap(emp => {
      const docs = emp.contractDocuments || [];
      return docs.map(d => ({
        ...d,
        empId: emp.id,
        empName: emp.namaLengkap,
        empNik: emp.nik,
        company: emp.company,
        jabatan: emp.jabatan,
      }));
    });
  }, [employees]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return allDocumentsWithEmp.filter(d => {
      const matchEmp = filterEmpId === 'all' || d.empId === filterEmpId;
      const matchType = filterDocType === 'all' || d.type === filterDocType;
      const matchSearch = d.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.empNik.toLowerCase().includes(searchTerm.toLowerCase());
      return matchEmp && matchType && matchSearch;
    });
  }, [allDocumentsWithEmp, filterEmpId, filterDocType, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pengurusan Surat Tawaran (Offering) &amp; Kontrak Pekerjaan</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {allDocumentsWithEmp.length} Dokumen Berdaftar
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Muat naik dan arkib fail Surat Tawaran Kerja (Offering Letter), Perjanjian Kontrak, dan dokumen lantikan kakitangan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>Muat Naik Dokumen Baharu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'list'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Senarai Arkib Dokumen ({allDocumentsWithEmp.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {uploadSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: UPLOAD FORM */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} className="space-y-5 text-xs max-w-2xl mx-auto">
              
              {/* Target Employee */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Pilih Pekerja Penerima:
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.namaLengkap} ({emp.nik}) — {emp.company.includes('Pustaka') ? 'Pustaka Union' : 'Solusi Serumpun'} · {emp.jabatan}
                    </option>
                  ))}
                </select>
                {targetEmployee && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {targetEmployee.departemen} · Jenis Kontrak: <strong>{targetEmployee.jenisKontrak}</strong> · Tarikh Mula: {targetEmployee.tanggalBergabung}
                  </p>
                )}
              </div>

              {/* Document Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                    Kategori Dokumen:
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="Surat Tawaran Kerja (Offering Letter)">Surat Tawaran Kerja (Offering Letter)</option>
                    <option value="Surat Kontrak (Contract Letter)">Surat Kontrak (Contract Letter)</option>
                    <option value="Perjanjian Kerahsiaan (NDA)">Perjanjian Kerahsiaan (NDA)</option>
                    <option value="Lain-lain">Lain-lain Dokumen Pelantikan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                    Tajuk / Nama Rujukan Dokumen:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Cth: Surat_Tawaran_PU_2025.pdf"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Pilih Fail Dokumen (PDF, Word DOCX, atau Imej Imbasan):
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <UploadCloud className="w-10 h-10 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Saiz: {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk tukar fail
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                        Klik untuk memilih fail Surat Tawaran / Kontrak
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Menyokong fail format PDF, Microsoft Word, JPG sehingga 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Muat Naik &amp; Simpan Dokumen</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: ARCHIVED DOCUMENTS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari fail atau nama staf..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filterEmpId}
                    onChange={(e) => setFilterEmpId(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="all">Semua Pekerja ({employees.length})</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.namaLengkap} ({e.nik})</option>
                    ))}
                  </select>

                  <select
                    value={filterDocType}
                    onChange={(e) => setFilterDocType(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="Surat Tawaran Kerja (Offering Letter)">Offering Letter</option>
                    <option value="Surat Kontrak (Contract Letter)">Contract Letter</option>
                    <option value="Perjanjian Kerahsiaan (NDA)">NDA</option>
                  </select>
                </div>
              </div>

              {/* Table of all documents */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-3.5">Pekerja &amp; Syarikat</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Nama Dokumen</th>
                      <th className="py-3 px-3">Tarikh Muat Naik</th>
                      <th className="py-3 px-3">Pegawai Pengesah</th>
                      <th className="py-3 px-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                          <p className="font-semibold">Tiada fail dokumen dijumpai</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Sila klik tab &quot;Muat Naik Dokumen Baharu&quot; untuk menambah Surat Tawaran atau Kontrak.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          
                          <td className="py-3 px-3.5">
                            <p className="font-bold text-slate-900 dark:text-white">{doc.empName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{doc.empNik} · {doc.company}</p>
                          </td>

                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
                              {doc.type}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]" title={doc.name}>
                                {doc.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono ml-5">
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </span>
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {doc.uploadedAt}
                          </td>

                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                            {doc.uploadedBy}
                          </td>

                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDownloadDoc(doc.name)}
                                className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950 rounded-lg transition-colors"
                                title="Muat Turun Dokumen"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.empId, doc.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                                title="Padam Dokumen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Sistem Pengurusan Dokumen Pekerja Korporat · Pustaka Union &amp; Solusi Serumpun Senusantara
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
