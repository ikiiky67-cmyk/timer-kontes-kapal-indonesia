'use client';

import { useState, useEffect } from 'react';
import { Division, Team } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function TeamTable({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string, institution: string, division: Division } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
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

  // Sinkronisasi state lokal jika data Server Component berubah melalui router.refresh()
  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  const handleEditClick = (team: Team) => {
    setEditingId(team.id);
    setEditForm({ name: team.name, institution: team.institution, division: team.division });
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
        body: JSON.stringify(editForm),
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

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal hapus tim');
      }

      setTeams(teams.filter(t => t.id !== id));
      router.refresh();
      setAlertState({ isOpen: true, title: 'Berhasil', message: 'Tim berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Menghapus', message: err.message || 'Terjadi kesalahan saat menghapus tim.', type: 'error' });
    } finally {
      setLoadingId(null);
      setDeleteConfirmId(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden p-8 text-center text-zinc-500 text-sm shadow-sm">
        Belum ada tim yang terdaftar.
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
              <th className="px-6 py-4">Divisi</th>
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
                        <select
                          value={editForm.division}
                          onChange={(e) => setEditForm({ ...editForm, division: e.target.value as Division })}
                          className="w-full px-3 py-1.5 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                        >
                          {Object.values(Division).map((div) => (
                            <option key={div} value={div}>{div}</option>
                          ))}
                        </select>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {team.division}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {loadingId === team.id ? (
                           <Loader2 className="w-5 h-5 animate-spin text-zinc-400 inline" />
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(team)} className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirmId(team.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
        isOpen={deleteConfirmId !== null}
        title="Hapus Tim"
        message="Apakah Anda yakin ingin menghapus data tim ini? Seluruh data histori yang terkait juga akan terhapus secara permanen."
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDelete(deleteConfirmId);
        }}
      />
    </div>
  );
}
