'use client';

import { useState, useEffect } from 'react';
import { Division, Team, TeamStatus } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, Loader2, TimerReset, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function OperatorTeamTable({ initialTeams, currentDivision }: { initialTeams: Team[], currentDivision: Division }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string, institution: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmUnlockId, setConfirmUnlockId] = useState<string | null>(null);
  
  // Alert State
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

  // Sinkronisasi state lokal dengan data terbaru dari Server Component
  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  // Polling data secara real-time menggunakan router.refresh() setiap 5 detik
  useEffect(() => {
    if (isNavigating) return;

    const intervalId = setInterval(() => {
      router.refresh();
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [router, isNavigating]);

  const handleForceUnlock = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/teams/${id}/unlock`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Gagal membuka kunci.');
      router.refresh();
      setAlertState({ isOpen: true, title: 'Kunci Terbuka', message: 'Kunci timer berhasil dibuka secara paksa.', type: 'success' });
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    } finally {
      setLoadingId(null);
      setConfirmUnlockId(null);
    }
  };

  const handleEditClick = (team: Team) => {
    setEditingId(team.id);
    setEditForm({ name: team.name, institution: team.institution });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm) return;
    setLoadingId(id);

    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, division: currentDivision }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal update tim');
      }

      const updatedTeam = await res.json();
      setTeams(teams.map(t => t.id === id ? updatedTeam : t));
      setEditingId(null);
      setEditForm(null);
      router.refresh();
      setAlertState({ isOpen: true, title: 'Berhasil', message: 'Data tim berhasil diperbarui.', type: 'success' });
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Update', message: err.message || 'Terjadi kesalahan saat menyimpan perubahan.', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden p-12 text-center text-zinc-500 text-sm shadow-sm">
        Belum ada tim yang terdaftar di divisi {currentDivision}.
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-medium text-zinc-500">
              <th className="px-6 py-4">Nama Tim</th>
              <th className="px-6 py-4">Asal Institusi</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <AnimatePresence>
              {teams.map((team) => (
                <motion.tr 
                  key={team.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, backgroundColor: '#fee2e2' }}
                  className="hover:bg-zinc-50/50 transition-colors group"
                >
                  {editingId === team.id && editForm ? (
                    <>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={editForm.institution}
                          onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                          className="w-full px-3 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </td>
                      <td className="px-6 py-3">
                         <span className="text-zinc-400 text-xs">-</span>
                      </td>
                      <td className="px-6 py-3 text-right space-x-2">
                        {loadingId === team.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-400 inline" />
                        ) : (
                          <>
                            <button onClick={() => handleSaveEdit(team.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-500">{team.institution}</div>
                      </td>
                      <td className="px-6 py-4">
                        {team.status === TeamStatus.IDLE ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">IDLE</span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">{team.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          {team.status === TeamStatus.IDLE ? (
                            <button 
                              onClick={() => {
                                setIsNavigating(true);
                                router.push(`/timer/${team.id}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
                            >
                              <TimerReset className="w-3.5 h-3.5" />
                              Buka Timer
                            </button>
                          ) : (
                             <button 
                              onClick={() => setConfirmUnlockId(team.id)}
                              disabled={loadingId === team.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-medium transition-colors group w-[160px] justify-center"
                            >
                              {loadingId === team.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 group-hover:hidden" />
                                  <Unlock className="w-3.5 h-3.5 hidden group-hover:block" />
                                </>
                              )}
                              <span className="group-hover:hidden">Sedang Digunakan</span>
                              <span className="hidden group-hover:inline">Paksa Buka Kunci</span>
                            </button>
                          )}
                          
                          {loadingId === team.id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-zinc-400 inline" />
                          ) : (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {team.status === TeamStatus.IDLE ? (
                                <button onClick={() => handleEditClick(team)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Tim">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              ) : (
                                <button disabled className="p-1.5 text-zinc-300 cursor-not-allowed" title="Tim sedang digunakan">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />

      <ConfirmModal
        isOpen={confirmUnlockId !== null}
        title="Peringatan Bahaya!"
        message={`Membuka kunci secara paksa saat timer SEDANG BERJALAN di perangkat lain dapat menyebabkan data hilang atau bertabrakan. Hanya lakukan ini jika tab timer sebelumnya telah tertutup atau mati.`}
        confirmWord="BUKA"
        onCancel={() => setConfirmUnlockId(null)}
        onConfirm={() => {
          if (confirmUnlockId) handleForceUnlock(confirmUnlockId);
        }}
      />
    </div>
  );
}
