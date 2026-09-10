'use client';

import { useState } from 'react';
import { Division } from '@prisma/client';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';

export default function TeamRegistrationForm() {
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
      router.refresh();
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Mendaftar', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 border border-zinc-200 rounded-xl w-full">

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Nama Tim</label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
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
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
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
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white transition-shadow"
        >
          {Object.values(Division).map((div) => (
            <option key={div} value={div}>{div}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-zinc-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Tim'}
      </button>
    </form>

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
