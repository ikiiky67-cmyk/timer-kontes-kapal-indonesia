'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Loader2, Pencil, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import OperatorFormModal from '@/components/admin/OperatorFormModal';

export default function OperatorTable({ initialOperators }: { initialOperators: User[] }) {
  const [operators, setOperators] = useState<User[]>(initialOperators);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null);

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

  // Sync state if server component data changes
  useEffect(() => {
    setOperators(initialOperators);
  }, [initialOperators]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedOperator(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (operator: User) => {
    setModalMode('edit');
    setSelectedOperator(operator);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/operators/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal hapus operator');
      }

      setOperators(operators.filter(op => op.id !== id));
      router.refresh();
      setAlertState({ isOpen: true, title: 'Berhasil', message: 'Operator berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Menghapus', message: err.message || 'Terjadi kesalahan saat menghapus operator.', type: 'error' });
    } finally {
      setLoadingId(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col h-full overflow-hidden">
      
      {/* TABLE HEADER & ACTIONS */}
      <div className="p-6 border-b border-slate-100/80 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Daftar Operator Aktif</h2>
          <p className="text-[13px] font-medium text-slate-500 mt-0.5">
            Total: <span className="font-bold text-blue-600">{operators.length}</span> operator terdaftar
          </p>
        </div>
        
        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-600/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Tambah Operator
        </button>
      </div>

      <div className="p-0 overflow-x-auto flex-1">
        <div className="p-6">
          <div className="w-full">
            {operators.length === 0 ? (
              <div className="text-center text-slate-500 text-[13px] py-12">
                Belum ada operator yang terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Divisi</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    <AnimatePresence>
                      {operators.map((operator) => (
                        <motion.tr 
                          key={operator.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, backgroundColor: '#fee2e2' }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 text-[14px] font-mono">{operator.username}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100/80 tracking-wide">
                              {operator.division || 'Umum'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {loadingId === operator.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" />
                            ) : (
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEditModal(operator)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteConfirmId(operator.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <OperatorFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={selectedOperator}
      />

      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />

      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        title="Hapus Operator"
        message="Apakah Anda yakin ingin menghapus akun operator ini?"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) handleDelete(deleteConfirmId);
        }}
      />
    </div>
  );
}
