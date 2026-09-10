'use client';

import { useState } from 'react';
import { Division } from '@prisma/client';
import { motion } from 'motion/react';
import { Loader2, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';

export default function OperatorRegistrationForm() {
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

  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const username = `operator_${division}`;
      const res = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, division }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mendaftarkan operator');
      }

      setAlertState({ isOpen: true, title: 'Berhasil', message: `Akun ${username} berhasil di-update!`, type: 'success' });
      setPassword('');
      router.refresh();
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Update', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 border border-zinc-200 rounded-xl w-full shadow-sm">
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <KeyRound className="w-5 h-5" />
        </div>
        <h3 className="text-base font-semibold text-zinc-900">Kelola Akun Operator</h3>
      </div>

      <div>
        <label htmlFor="op_division" className="block text-sm font-medium text-zinc-700 mb-1">Divisi</label>
        <select
          id="op_division"
          value={division}
          onChange={(e) => setDivision(e.target.value as Division)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-shadow text-sm"
        >
          {Object.values(Division).map((div) => (
            <option key={div} value={div}>Operator {div}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">Username otomatis: <span className="font-mono bg-zinc-100 px-1 py-0.5 rounded">operator_{division}</span></p>
      </div>

      <div>
        <label htmlFor="op_password" className="block text-sm font-medium text-zinc-700 mb-1">Password Baru</label>
        <input
          id="op_password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-sm"
          placeholder="Masukkan password"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center items-center bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {isSubmitting ? 'Menyimpan...' : 'Simpan Akun Operator'}
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
