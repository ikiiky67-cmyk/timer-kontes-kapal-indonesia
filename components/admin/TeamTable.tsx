'use client';

import { useState, useEffect, useMemo } from 'react';
import { Division, Team } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, Loader2, Search, FilterX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function TeamTable({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string, institution: string, division: Division } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<'All' | Division>('All');
  
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
      <div className="text-center text-slate-500 text-[13px] py-12">
        Belum ada tim yang terdaftar.
      </div>
    );
  }



  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        team.institution.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDivision = divisionFilter === 'All' || team.division === divisionFilter;
      
      return matchesSearch && matchesDivision;
    });
  }, [teams, searchQuery, divisionFilter]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* DATA CONTROL BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-100/80 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-4">
        {/* Search */}
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama tim atau institusi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-[14px] font-semibold text-slate-800 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(['All', ...Object.values(Division)] as const).map(div => (
            <button
              key={div}
              onClick={() => setDivisionFilter(div as any)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all border ${
                divisionFilter === div 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {div === 'All' ? 'Semua Divisi' : div}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-100/80 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Nama Tim</th>
              <th className="px-6 py-4">Asal Institusi</th>
              <th className="px-6 py-4">Divisi</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            <AnimatePresence mode="popLayout">
              {filteredTeams.length > 0 ? (
                filteredTeams.map((team) => (
                  <motion.tr 
                  key={team.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, backgroundColor: '#fee2e2' }}
                  className="hover:bg-slate-50/50 transition-colors group"
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
                        <div className="font-semibold text-slate-800 text-[14px]">{team.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] text-slate-500">{team.institution}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/80 tracking-wide">
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
                ))
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-[15px] font-bold text-slate-800 mb-1">Tidak ada tim yang ditemukan</p>
                      <p className="text-[13px] text-slate-500 max-w-sm mb-4">Pencarian untuk "{searchQuery}" atau saringan divisi "{divisionFilter === 'All' ? 'Semua Divisi' : divisionFilter}" tidak memberikan hasil.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setDivisionFilter('All'); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-800 hover:text-white border border-slate-200 hover:border-slate-800 rounded-xl text-[13px] font-bold transition-all"
                      >
                        <FilterX className="w-4 h-4" />
                        Reset Pencarian
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )}
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
