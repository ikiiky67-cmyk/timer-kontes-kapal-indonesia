'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { History, X } from 'lucide-react';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';

interface UnifiedHistory {
  id: string;
  type: 'PREP' | 'RACE';
  remainingTime: number;
  createdAt: string;
}

// Default times (in ms)
const DEFAULT_PREP_TIME_MS = 5 * 60 * 1000; // 5 menit
const DEFAULT_RACE_TIME_MS = 15 * 60 * 1000; // 15 menit

interface ClientTimerProps {
  teamId: string;
  teamName: string;
  division: string;
}

type SessionType = 'PREP' | 'RACE';

export default function ClientTimer({ teamId, teamName, division }: ClientTimerProps) {
  const [session, setSession] = useState<SessionType>('PREP');
  const [remainingTime, setRemainingTime] = useState<number>(DEFAULT_PREP_TIME_MS);
  const [targetTime, setTargetTime] = useState<number>(DEFAULT_PREP_TIME_MS);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSettingTime, setIsSettingTime] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Modal History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<UnifiedHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Alert Modal State
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

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      } else {
        setAlertState({ isOpen: true, title: 'Gagal Memuat', message: 'Tidak dapat mengambil riwayat tim.', type: 'error' });
      }
    } catch (e: any) {
      console.error('Failed to fetch history', e);
      setAlertState({ isOpen: true, title: 'Error', message: e.message || 'Terjadi kesalahan saat mengambil riwayat.', type: 'error' });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [teamId]);

  const handleExit = useCallback(async () => {
    try {
      await fetch(`/api/teams/${teamId}/unlock`, { method: 'PATCH' });
    } catch (e: any) {
      console.error(e);
      setAlertState({ isOpen: true, title: 'Error', message: 'Gagal membuka kunci tim.', type: 'warning' });
    }
    router.push('/operator/dashboard');
  }, [teamId, router]);

  // Handle tutup tab / browser (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`/api/teams/${teamId}/unlock`);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    // Cleanup removed per request
  }, [teamId]);

  const reqRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const isSavingRef = useRef(false);

  // Kunci status menjadi RACING saat pindah ke sesi RACE
  const lockAsRacing = useCallback(async () => {
    try {
      await fetch('/api/timer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, status: 'RACING' }),
      });
    } catch (err: any) {
      console.error('Failed to lock as RACING', err);
      setAlertState({ isOpen: true, title: 'Error', message: 'Gagal mengunci status Racing.', type: 'error' });
    }
  }, [teamId]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (reqRef.current) {
      cancelAnimationFrame(reqRef.current);
      reqRef.current = null;
    }
  }, []);

  const finishTimer = useCallback(async (finalTime: number) => {
    if (isFinished || isSavingRef.current) return;
    
    isSavingRef.current = true;
    stopTimer();
    setStatus('saving');

    try {
      // API ini akan menyimpan histori DAN membebaskan kunci (IDLE)
      const res = await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId, 
          remainingTime: finalTime, 
          targetTime: targetTime,
          type: session 
        }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan histori');
      
      setStatus('saved');

      // Jika ini adalah PREP, kita lanjut ke RACE
      if (session === 'PREP') {
        setTimeout(() => {
          setSession('RACE');
          setRemainingTime(DEFAULT_RACE_TIME_MS);
          setTargetTime(DEFAULT_RACE_TIME_MS);
          setStatus('idle');
          isSavingRef.current = false;
          // Mengunci kembali dengan status RACING
          lockAsRacing();
        }, 3000); // Tunda 3 detik sebelum lanjut ke race
      } else {
        // Jika RACE, berarti selesai total
        setIsFinished(true);
        setAlertState({ isOpen: true, title: 'Selesai Total', message: 'Seluruh sesi untuk tim ini telah selesai.', type: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setAlertState({ isOpen: true, title: 'Gagal Menyimpan', message: err.message || 'Terjadi kesalahan saat menyimpan histori.', type: 'error' });
      isSavingRef.current = false;
    }
  }, [isFinished, stopTimer, teamId, targetTime, session, lockAsRacing]);

  const tick = useCallback(() => {
    if (!isRunning || isFinished) return;

    const now = Date.now();
    const delta = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    setRemainingTime((prev) => {
      const nextTime = prev - delta;
      if (nextTime <= 0) {
        finishTimer(0);
        return 0;
      }
      return nextTime;
    });

    reqRef.current = requestAnimationFrame(tick);
  }, [isRunning, isFinished, finishTimer]);

  useEffect(() => {
    if (isRunning) {
      lastUpdateRef.current = Date.now();
      reqRef.current = requestAnimationFrame(tick);
    } else {
      if (reqRef.current) {
        cancelAnimationFrame(reqRef.current);
        reqRef.current = null;
      }
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isRunning, tick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Jika Alert terbuka, abaikan input lain (Alert menutup dengan Esc/Enter secara mandiri via capture)
      if (alertState.isOpen) return;

      if (key === 'escape') {
        if (isHistoryModalOpen) {
          setIsHistoryModalOpen(false);
          return;
        } else if (isSettingTime) {
          setIsSettingTime(false);
          return;
        } else if (status !== 'saving') {
          handleExit();
          return;
        }
      }

      if (isSettingTime || status === 'saving' || isHistoryModalOpen) return; 
      
      if (key === 'h' && (!isRunning || isFinished)) {
        setIsHistoryModalOpen(true);
        fetchHistory();
        return;
      }
      
      if (key === 's') {
        setIsRunning(false);
        setIsSettingTime(true);
      } else if (key === ' ' || e.code === 'Space') {
        e.preventDefault(); 
        if (!isFinished) {
          setIsRunning((prev) => !prev);
        }
      } else if (key === 'f') {
        if (!isFinished) {
          finishTimer(remainingTime);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingTime, isFinished, remainingTime, finishTimer, status, handleExit, isHistoryModalOpen, isRunning, fetchHistory, alertState.isOpen]);

  const handleSetTimeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mins = parseInt(formData.get('minutes') as string || '0', 10);
    const secs = parseInt(formData.get('seconds') as string || '0', 10);
    const newTarget = (mins * 60 + secs) * 1000;
    
    setTargetTime(newTarget);
    setRemainingTime(newTarget);
    setIsSettingTime(false);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((Math.max(0, ms) % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden select-none">
      
      {/* Tombol Exit */}
      <button 
        onClick={handleExit}
        className="absolute top-12 right-12 text-zinc-600 hover:text-zinc-300 transition-colors text-sm font-medium flex items-center gap-2 z-20"
      >
        Exit (Esc)
      </button>

      {/* Tombol Buka Histori (Ikon Kiri Atas) */}
      <button 
        onClick={() => {
          setIsHistoryModalOpen(true);
          fetchHistory();
        }}
        className="absolute top-12 left-12 text-zinc-600 hover:text-zinc-300 transition-colors flex items-center gap-2 z-20"
        title="Buka Histori (H)"
      >
        <History className="w-6 h-6" />
      </button>

      {/* Indikator Status Simpan / Finish */}
      {(isFinished || status === 'saving' || status === 'saved') && (
        <div className="absolute top-12 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500 z-10">
          <span className="px-5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-100 font-medium tracking-widest text-sm uppercase shadow-2xl">
            {isFinished ? 'Selesai Total' : `Sesi ${session} Selesai`}
          </span>
          {status === 'saving' && <p className="mt-4 text-zinc-500 text-sm font-medium">Menyimpan waktu ke database...</p>}
          {status === 'saved' && !isFinished && <p className="mt-4 text-emerald-400 text-sm font-medium">Histori {session} tersimpan. Memulai {session === 'PREP' ? 'RACE' : ''}...</p>}
          {status === 'saved' && isFinished && <p className="mt-4 text-emerald-400 text-sm font-medium">Semua sesi selesai. Anda boleh menutup tab ini.</p>}
          {status === 'error' && <p className="mt-4 text-red-500 text-sm font-medium">Gagal menyimpan waktu. Periksa koneksi.</p>}
        </div>
      )}

      {/* Identitas Tim & Sesi */}
      <div className="absolute top-24 left-12 opacity-40 hover:opacity-100 transition-opacity">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-1">{teamName}</h2>
        <div className="flex items-center gap-3">
          <p className="text-zinc-400 font-medium tracking-wide uppercase text-sm">{division}</p>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          <p className="text-indigo-400 font-bold tracking-widest uppercase text-sm">{session === 'PREP' ? 'Preparation Time' : 'Race Time'}</p>
        </div>
      </div>
      
      {/* Tampilan Timer Utama */}
      <div className={`text-center transition-all duration-300 ${isSettingTime ? 'opacity-20 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
        <h1 className="text-[15vw] font-bold tracking-tighter text-white font-mono tabular-nums leading-none">
          {formatTime(remainingTime)}
        </h1>
      </div>

      {/* Indikator Status Pause/Running */}
      {!isFinished && !isSettingTime && status === 'idle' && (
        <div className="absolute bottom-16 flex space-x-6 items-center">
          <div className="flex items-center space-x-3 bg-zinc-900/50 px-5 py-2.5 rounded-full border border-zinc-800">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]' : 'bg-amber-500'}`}></span>
            <span className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">
              {isRunning ? 'Berjalan' : 'Jeda'}
            </span>
          </div>
        </div>
      )}

      {/* Modal Set Time */}
      {isSettingTime && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <form onSubmit={handleSetTimeSubmit} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-medium text-white mb-6">Set Durasi {session === 'PREP' ? 'Persiapan' : 'Race'}</h3>
            <div className="flex items-center space-x-4 mb-8">
              <div className="flex-1">
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium">Menit</label>
                <input 
                  type="number" 
                  name="minutes" 
                  min="0" 
                  max="999" 
                  defaultValue={Math.floor(remainingTime / 60000)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-3xl focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono transition-shadow"
                  autoFocus
                />
              </div>
              <span className="text-3xl text-zinc-600 mt-6 font-light">:</span>
              <div className="flex-1">
                <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium">Detik</label>
                <input 
                  type="number" 
                  name="seconds" 
                  min="0" 
                  max="59" 
                  defaultValue={Math.floor((remainingTime % 60000) / 1000)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-3xl focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono transition-shadow"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                type="button" 
                onClick={() => setIsSettingTime(false)}
                className="flex-1 py-3 px-4 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 px-4 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Terapkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Histori */}
      {isHistoryModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-lg text-white p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold tracking-tight">Riwayat Tim {teamName}</h3>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
              {isLoadingHistory ? (
                <div className="text-center py-10 text-gray-400 text-sm">Memuat riwayat...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm italic">Belum ada riwayat tercatat.</div>
              ) : (
                <div className="space-y-3">
                  {historyData.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <div className="font-semibold text-gray-200 mb-1">Sesi {h.type === 'PREP' ? 'Preparation' : 'Race'}</div>
                        <div className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sisa Waktu</div>
                        <div className="text-xl font-mono text-emerald-400 font-bold">{formatTime(h.remainingTime)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800 text-right">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors text-sm font-medium"
              >
                Tutup (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Petunjuk Shortcut */}
      {!isRunning && !isFinished && !isSettingTime && status === 'idle' && (
        <div className="absolute bottom-16 right-16 text-right">
          <ul className="space-y-3 text-xs text-zinc-500 uppercase tracking-widest font-medium">
            <li className="flex items-center justify-end space-x-3">
              <span>Set Durasi</span>
              <kbd className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded min-w-[30px] text-center shadow-sm">S</kbd> 
            </li>
            <li className="flex items-center justify-end space-x-3">
              <span>Mulai / Jeda</span>
              <kbd className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded min-w-[60px] text-center shadow-sm">Space</kbd> 
            </li>
            <li className="flex items-center justify-end space-x-3">
              <span>Selesai (Kirim API)</span>
              <kbd className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded min-w-[30px] text-center shadow-sm">F</kbd> 
            </li>
            <li className="flex items-center justify-end space-x-3 text-zinc-400 pt-2 border-t border-zinc-800/50">
              <span>Lihat Histori</span>
              <kbd className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded min-w-[30px] text-center shadow-sm">H</kbd> 
            </li>
          </ul>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />
    </div>
  );
}
