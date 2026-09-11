'use client';

import { useState } from 'react';
import { Division } from '@prisma/client';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import { Plus, X } from 'lucide-react';

export default function TeamRegistrationModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [division, setDivision] = useState<Division>(Division.ROV);
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

  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));
  
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, institution, division }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mendaftarkan tim');
      }

      setAlertState({ isOpen: true, title: 'Berhasil', message: 'Tim berhasil didaftarkan!', type: 'success' });
      setName('');
      setInstitution('');
      setDivision(Division.ROV);
      handleCloseModal();
      router.refresh();
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Mendaftar', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button 
        onClick={handleOpenModal}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-600/20 active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        Daftarkan Tim
      </button>

      {/* MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight">Daftarkan Tim Baru</h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">Tambah tim ke divisi tertentu.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Nama Tim</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-[14px] text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Masukkan nama tim"
                />
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-zinc-700 mb-1">Asal Institusi / Universitas</label>
                <input
                  id="institution"
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-[14px] text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Contoh: Universitas Indonesia"
                />
              </div>

              <div>
                <label htmlFor="division" className="block text-sm font-medium text-zinc-700 mb-1">Divisi Kontes</label>
                <select
                  id="division"
                  required
                  value={division}
                  onChange={(e) => setDivision(e.target.value as Division)}
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-[14px] text-[13px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                >
                  {Object.values(Division).map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white text-[14px] font-bold py-3.5 px-4 rounded-[14px] hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Tim'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ALERT MODAL */}
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
