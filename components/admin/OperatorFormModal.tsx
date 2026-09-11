'use client';

import { useState, useEffect } from 'react';
import { Division, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import { Loader2, KeyRound, UserPlus, Pencil, X } from 'lucide-react';

interface OperatorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: User | null;
}

export default function OperatorFormModal({ isOpen, onClose, mode, initialData }: OperatorFormModalProps) {
  const [username, setUsername] = useState('');
  const [division, setDivision] = useState<Division>(Division.ROV);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const router = useRouter();

  // Populate form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setUsername(initialData.username);
        setDivision(initialData.division || Division.ROV);
        setPassword('');
      } else {
        setUsername('');
        setDivision(Division.ROV);
        setPassword('');
      }
    }
  }, [isOpen, mode, initialData]);

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
    // If it was a success alert, close modal too
    if (alertState.type === 'success') {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = '/api/admin/operators';
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const payload: any = { username, division };
      if (password) {
        payload.password = password;
      }
      
      if (mode === 'edit' && initialData) {
        payload.id = initialData.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Gagal ${mode === 'create' ? 'mendaftarkan' : 'menyimpan'} operator`);
      }

      setAlertState({ 
        isOpen: true, 
        title: 'Berhasil', 
        message: `Akun ${username} berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}!`, 
        type: 'success' 
      });
      router.refresh();
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Menyimpan', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                {mode === 'create' ? <UserPlus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight">
                  {mode === 'create' ? 'Daftarkan Operator' : 'Edit Operator'}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {mode === 'create' ? 'Buat akun operator baru' : 'Ubah data akun operator'}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body / Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-[14px] text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder="Masukkan username unik"
              />
            </div>

            <div>
              <label htmlFor="op_division" className="block text-sm font-medium text-zinc-700 mb-1">Divisi Kontes</label>
              <select
                id="op_division"
                required
                value={division}
                onChange={(e) => setDivision(e.target.value as Division)}
                className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-[14px] text-[13px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
              >
                {Object.values(Division).map((div) => (
                  <option key={div} value={div}>Operator {div}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="op_password" className="block text-sm font-medium text-zinc-700 mb-1">
                {mode === 'create' ? 'Password' : 'Password Baru (Opsional)'}
              </label>
              <input
                id="op_password"
                type="password"
                required={mode === 'create'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-[14px] text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder={mode === 'create' ? 'Masukkan password' : 'Kosongkan jika tidak ingin diubah'}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center bg-slate-900 text-white text-[14px] font-bold py-3.5 px-4 rounded-[14px] hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? 'Menyimpan...' : (mode === 'create' ? 'Buat Akun' : 'Simpan Perubahan')}
              </button>
            </div>
          </form>

        </div>
      </div>

      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />
    </>
  );
}
