'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Clock, Loader2, AlertTriangle, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Team {
  id: string;
  name: string;
  institution: string;
  division: string;
  status: string;
  _count: {
    prepHistories: number;
    raceHistories: number;
  };
}

interface HistoryLog {
  id: string;
  type: 'PREP' | 'RACE';
  remainingTime: number;
  targetTime: number;
  mode: string;
  createdAt: string;
}

interface HistoryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
}

export default function HistoryDetailDrawer({ isOpen, onClose, team }: HistoryDetailDrawerProps) {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals state
  const [deleteId, setDeleteId] = useState<{ id: string, type: 'PREP' | 'RACE' } | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch history when drawer opens
  useEffect(() => {
    if (isOpen && team) {
      fetchHistory(team.id);
    } else {
      setLogs([]);
    }
  }, [isOpen, team]);

  const fetchHistory = async (teamId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/history`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

  const handleDeleteSingle = async () => {
    if (!deleteId || !team) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/history?action=delete_single&historyId=${deleteId.id}&type=${deleteId.type}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus log');
      }

      setLogs(logs.filter(log => log.id !== deleteId.id));
      router.refresh(); // Update the counts in the master table
      setAlertState({ isOpen: true, title: 'Berhasil', message: 'Log riwayat berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Menghapus', message: err.message, type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleClearAll = async () => {
    if (!team) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/history?action=clear_all`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus semua riwayat');
      }

      setLogs([]);
      router.refresh(); // Update the counts in the master table
      setAlertState({ isOpen: true, title: 'Berhasil', message: 'Semua riwayat berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setAlertState({ isOpen: true, title: 'Gagal Menghapus', message: err.message, type: 'error' });
    } finally {
      setIsDeleting(false);
      setIsClearingAll(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((Math.max(0, ms) % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const exportToPDF = () => {
    if (!team || logs.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Header & Official Branding
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Official Team History Report", 14, 22);

    // Team Identity
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175); // blue-800
    doc.text(`Team: ${team.name}`, 14, 32);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Division: ${team.division}   |   Institution: ${team.institution}`, 14, 39);

    // Divider
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.5);
    doc.line(14, 44, pageWidth - 14, 44);

    // Table
    const tableColumn = ["NO.", "DATE & TIME", "PHASE", "MODE", "TARGET TIME", "ACTUAL TIME USED"];
    const tableRows = logs.map((log, index) => {
      const isStopwatch = log.mode === 'STOPWATCH';
      
      let actualTimeMs = 0;
      if (isStopwatch) {
        actualTimeMs = log.remainingTime;
      } else {
        actualTimeMs = log.targetTime - log.remainingTime;
      }
      
      const targetTimeStr = isStopwatch ? '-' : formatTime(log.targetTime);
      const actualTimeStr = formatTime(actualTimeMs);
      const phase = log.type === 'PREP' ? 'Preparation' : 'Race';

      return [
        (index + 1).toString(),
        formatDate(log.createdAt),
        phase,
        log.mode,
        targetTimeStr,
        actualTimeStr
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid', // Menggunakan grid untuk mendapatkan border horisontal & vertikal
      margin: { left: 20, right: 20 }, // Menambahkan margin agar tabel tidak full-width (lebih compact)
      headStyles: {
        fillColor: [15, 23, 42], // #0F172A
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 9,
        lineWidth: 0.1,
        lineColor: [15, 23, 42], // Match head bg or use light gray
      },
      styles: {
        fontSize: 9,
        cellPadding: 4, // Padding diturunkan agar lebih seimbang
        textColor: [51, 65, 85],
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [203, 213, 225], // Border abu-abu terang (grid lines explicit)
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Zebra striping
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, 
        1: { halign: 'left', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 26 }, 
        3: { halign: 'center', cellWidth: 28 }, 
        4: { halign: 'center', cellWidth: 32 }, 
        5: { halign: 'center', cellWidth: 34 }, 
      },
    });

    // Footer Pagination & Generation Timestamp
    const exportDate = new Date().toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Generated on: ${exportDate} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const filename = `History_${team.name.replace(/\s+/g, '_')}_${team.division}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100/80"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-[18px] font-bold text-slate-800 tracking-tight leading-tight flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Riwayat Tim
                  </h2>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">
                    {team?.name} • {team?.division}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToPDF}
                    disabled={logs.length === 0 || isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Export to PDF"
                  >
                    <FileDown className="w-4 h-4" />
                    Ekspor PDF
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body - History List */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                    <p className="text-sm font-medium">Memuat riwayat...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center text-slate-500 text-[13px] py-12 flex flex-col items-center">
                    <Clock className="w-10 h-10 text-slate-200 mb-3" />
                    <p>Belum ada riwayat tercatat untuk tim ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-blue-100 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                            log.type === 'PREP' 
                              ? 'bg-amber-50 text-amber-600 border border-amber-100/50' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                          }`}>
                            {log.type === 'PREP' ? 'Preparation' : 'Race'}
                          </span>
                          <button
                            onClick={() => setDeleteId({ id: log.id, type: log.type })}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
                            title="Hapus log ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Waktu Target</p>
                            <p className="text-[14px] font-mono font-semibold text-slate-700">{formatTime(log.targetTime)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Sisa Waktu</p>
                            <p className="text-[14px] font-mono font-semibold text-blue-600">{formatTime(log.remainingTime)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span>{formatDate(log.createdAt)}</span>
                          <span className="uppercase tracking-wider">{log.mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer - Clear All Action */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setIsClearingAll(true)}
                  disabled={logs.length === 0 || isLoading || isDeleting}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-bold py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-red-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Hapus Semua Riwayat
                </button>
              </div>
            </motion.div>
          </>
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
        isOpen={deleteId !== null}
        title="Hapus Log Riwayat"
        message="Apakah Anda yakin ingin menghapus log ini? Data tidak dapat dikembalikan."
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteSingle}
      />

      <ConfirmModal
        isOpen={isClearingAll}
        title="Hapus Semua Riwayat"
        message={`Apakah Anda yakin ingin menghapus SELURUH riwayat untuk tim ${team?.name}? Tindakan ini permanen.`}
        onCancel={() => setIsClearingAll(false)}
        onConfirm={handleClearAll}
      />
    </>
  );
}
