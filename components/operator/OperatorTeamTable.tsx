'use client';

import { useState, useEffect, useMemo } from 'react';
import { Division, Team, TeamStatus } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, Loader2, TimerReset, Lock, Unlock, Search, FilterX } from 'lucide-react';
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
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TeamStatus>('All');
  
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
      <div className="bg-white border border-slate-100/80 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-12 text-center text-slate-500 text-sm">
        Belum ada tim yang terdaftar di divisi {currentDivision}.
      </div>
    );
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        team.institution.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || team.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [teams, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
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
          {(['All', ...Object.values(TeamStatus)] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all border ${
                statusFilter === status 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {status === 'All' ? 'Semua Status' : status}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team) => (
            <motion.div 
            key={team.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-100/80 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left Side: Data Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1 items-center">
                
                {editingId === team.id && editForm ? (
                  <>
                    <div className="md:col-span-4 space-y-1.5 min-w-0">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Tim</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 text-[14px] font-semibold text-slate-800 transition-all"
                      />
                    </div>
                    <div className="md:col-span-5 space-y-1.5 min-w-0">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institusi</label>
                      <input
                        type="text"
                        value={editForm.institution}
                        onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-100 text-[14px] font-semibold text-slate-800 transition-all"
                      />
                    </div>
                    {/* Placeholder kosong untuk Status saat mode edit */}
                    <div className="hidden md:block md:col-span-3"></div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-4 space-y-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Tim</h3>
                      <div className="text-[15px] font-bold text-slate-800 truncate" title={team.name}>{team.name}</div>
                    </div>
                    
                    <div className="md:col-span-5 space-y-1 min-w-0">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institusi</h3>
                      <div className="text-[14px] font-medium text-slate-600 truncate" title={team.institution}>{team.institution}</div>
                    </div>
                    
                    <div className="md:col-span-3 space-y-2">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</h3>
                      <div className="flex items-center">
                        {team.status === TeamStatus.IDLE ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            IDLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {team.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100/80">
                {editingId === team.id && editForm ? (
                  <div className="flex items-center gap-2">
                    {loadingId === team.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-2" />
                    ) : (
                      <>
                        <button onClick={() => handleSaveEdit(team.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={handleCancelEdit} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Only show pencil if IDLE */}
                    {team.status === TeamStatus.IDLE && (
                      <div className="md:opacity-0 group-hover:opacity-100 transition-opacity">
                        {loadingId === team.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2 inline" />
                        ) : (
                          <button onClick={() => handleEditClick(team)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Edit Tim">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {team.status === TeamStatus.IDLE ? (
                      <button 
                        onClick={() => {
                          setIsNavigating(true);
                          router.push(`/timer/${team.id}`);
                        }}
                        disabled={loadingId === team.id}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-500 hover:text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        <TimerReset className="w-4 h-4" />
                        Buka Timer
                      </button>
                    ) : (
                      <button 
                        onClick={() => setConfirmUnlockId(team.id)}
                        disabled={loadingId === team.id}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl text-sm font-bold transition-all group/btn w-[180px]"
                      >
                        {loadingId === team.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-4 h-4 group-hover/btn:hidden" />
                            <Unlock className="w-4 h-4 hidden group-hover/btn:block" />
                          </>
                        )}
                        <span className="group-hover/btn:hidden">Sedang Digunakan</span>
                        <span className="hidden group-hover/btn:inline">Paksa Buka Kunci</span>
                      </button>
                    )}
                  </>
                )}
              </div>

            </div>
          </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-100/80 rounded-[24px] p-12 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] mt-2"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-[15px] font-bold text-slate-800 mb-1">Tidak ada tim yang ditemukan</p>
            <p className="text-[13px] text-slate-500 max-w-sm mb-6">Pencarian untuk "{searchQuery}" atau saringan status "{statusFilter === 'All' ? 'Semua Status' : statusFilter}" tidak memberikan hasil.</p>
            <button 
              onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-800 hover:text-white border border-slate-200 hover:border-slate-800 rounded-xl text-[13px] font-bold transition-all"
            >
              <FilterX className="w-4 h-4" />
              Reset Pencarian
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
