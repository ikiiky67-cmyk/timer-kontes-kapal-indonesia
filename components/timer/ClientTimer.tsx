'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { History, X } from 'lucide-react';
import AlertModal, { AlertType } from '@/components/ui/AlertModal';

interface UnifiedHistory {
  id: string;
  type: 'PREP' | 'RACE';
  remainingTime: number;
  targetTime: number;
  mode: 'DOWN' | 'UP' | 'STOPWATCH';
  createdAt: string;
}

const DEFAULT_PREP_TIME_MS = 5 * 60 * 1000;
const DEFAULT_RACE_TIME_MS = 15 * 60 * 1000;

interface ClientTimerProps {
  teamId: string;
  teamName: string;
  division: string;
}

type SessionType = 'PREP' | 'RACE';
type TimerPhase = 'IDLE' | 'RUNNING' | 'FINISHED';
type TimerDirection = 'DOWN' | 'UP' | 'STOPWATCH';

export default function ClientTimer({ teamId, teamName, division }: ClientTimerProps) {
  const [session, setSession] = useState<SessionType>('PREP');
  const [phase, setPhase] = useState<TimerPhase>('IDLE');
  const [direction, setDirection] = useState<TimerDirection>('DOWN');
  
  const [prepConfig, setPrepConfig] = useState<{target: number, mode: TimerDirection}>({ target: DEFAULT_PREP_TIME_MS, mode: 'DOWN' });
  const [raceConfig, setRaceConfig] = useState<{target: number, mode: TimerDirection}>({ target: DEFAULT_RACE_TIME_MS, mode: 'DOWN' });

  const [remainingTime, setRemainingTime] = useState<number>(DEFAULT_PREP_TIME_MS);
  const [targetTime, setTargetTime] = useState<number>(DEFAULT_PREP_TIME_MS);
  
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon(`/api/teams/${teamId}/unlock`);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [teamId]);

  const reqRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const isSavingRef = useRef(false);

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
    setPhase('IDLE');
    if (reqRef.current) {
      cancelAnimationFrame(reqRef.current);
      reqRef.current = null;
    }
  }, []);

  const finishTimer = useCallback(async (finalTime: number) => {
    if (phase === 'FINISHED' || isSavingRef.current) return;
    
    isSavingRef.current = true;
    stopTimer();
    setStatus('saving');

    try {
      const res = await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId, 
          remainingTime: finalTime, 
          targetTime: targetTime,
          type: session,
          mode: direction,
        }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan histori');
      
      setStatus('saved');

      if (session === 'PREP') {
        setTimeout(() => {
          setSession('RACE');
          setDirection(raceConfig.mode);
          setTargetTime(raceConfig.target);
          setRemainingTime(raceConfig.mode === 'DOWN' ? raceConfig.target : 0);
          setPhase('IDLE');
          setStatus('idle');
          isSavingRef.current = false;
          lockAsRacing();
        }, 3000);
      } else {
        setPhase('FINISHED');
        // Fitur peringatan Selesai dinonaktifkan sesuai permintaan (Clean TV UI)
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setAlertState({ isOpen: true, title: 'Gagal Menyimpan', message: err.message || 'Terjadi kesalahan saat menyimpan histori.', type: 'error' });
      isSavingRef.current = false;
    }
  }, [phase, stopTimer, teamId, targetTime, session, direction, lockAsRacing, raceConfig]);

  const tick = useCallback(() => {
    if (phase !== 'RUNNING') return;

    const now = Date.now();
    const delta = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    setRemainingTime((prev) => {
      if (direction === 'DOWN') {
        const nextTime = prev - delta;
        if (nextTime <= 0) {
          finishTimer(0);
          return 0;
        }
        return nextTime;
      } else if (direction === 'UP') {
        const nextTime = prev + delta;
        if (nextTime >= targetTime) {
          finishTimer(targetTime);
          return targetTime;
        }
        return nextTime;
      } else {
        // STOPWATCH
        return prev + delta;
      }
    });

    reqRef.current = requestAnimationFrame(tick);
  }, [phase, direction, targetTime, finishTimer]);

  useEffect(() => {
    if (phase === 'RUNNING') {
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
  }, [phase, tick]);

  // Pre-Start logic removed for instant start

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
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

      if (key === 'm' || key === 'f11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
          });
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
        return;
      }

      if (isSettingTime || status === 'saving' || isHistoryModalOpen) return; 
      
      if (key === 'h' && (phase === 'IDLE' || phase === 'FINISHED')) {
        setIsHistoryModalOpen(true);
        fetchHistory();
        return;
      }
      
      if (key === 's') {
        if (phase === 'RUNNING') {
          setPhase('IDLE'); // Auto pause
        }
        setIsSettingTime(true);
      } else if (key === ' ' || e.code === 'Space') {
        e.preventDefault(); 
        if (phase !== 'FINISHED') {
          if (phase === 'RUNNING') {
            setPhase('IDLE');
          } else if (phase === 'IDLE') {
            setPhase('RUNNING');
          }
        }
      } else if (key === 'f') {
        if (phase !== 'FINISHED') {
          finishTimer(remainingTime);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingTime, phase, remainingTime, finishTimer, status, handleExit, isHistoryModalOpen, fetchHistory, alertState.isOpen, direction, targetTime]);

  const [modalPrepMode, setModalPrepMode] = useState<TimerDirection>('DOWN');
  const [modalRaceMode, setModalRaceMode] = useState<TimerDirection>('DOWN');

  useEffect(() => {
    if (isSettingTime) {
      setModalPrepMode(prepConfig.mode);
      setModalRaceMode(raceConfig.mode);
    }
  }, [isSettingTime, prepConfig.mode, raceConfig.mode]);

  const handleBatchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const prepMode = formData.get('prep_direction') as TimerDirection;
    const prepMins = parseInt(formData.get('prep_minutes') as string || '0', 10);
    const prepSecs = parseInt(formData.get('prep_seconds') as string || '0', 10);
    const newPrepTarget = (prepMins * 60 + prepSecs) * 1000;
    
    const raceMode = formData.get('race_direction') as TimerDirection;
    const raceMins = parseInt(formData.get('race_minutes') as string || '0', 10);
    const raceSecs = parseInt(formData.get('race_seconds') as string || '0', 10);
    const newRaceTarget = (raceMins * 60 + raceSecs) * 1000;
    
    setPrepConfig({ target: newPrepTarget, mode: prepMode });
    setRaceConfig({ target: newRaceTarget, mode: raceMode });
    
    if (session === 'PREP') {
      setDirection(prepMode);
      setTargetTime(newPrepTarget);
      setRemainingTime(prepMode === 'DOWN' ? newPrepTarget : 0);
    } else {
      setDirection(raceMode);
      setTargetTime(newRaceTarget);
      setRemainingTime(raceMode === 'DOWN' ? newRaceTarget : 0);
    }
    
    setPhase('IDLE');
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/css/dseg.css');
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        .font-digital {
          font-family: 'DSEG7 Classic', monospace;
        }
        .font-digital-text {
          font-family: 'Share Tech Mono', monospace;
        }
      `}} />
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden select-none">
        
        {/* Tombol Exit - Tetap tersembunyi/kecil di pojok */}
        <button 
          onClick={handleExit}
          className="absolute top-8 right-8 text-zinc-800 hover:text-zinc-500 transition-colors text-sm font-medium flex items-center gap-2 z-20"
        >
          Exit (Esc)
        </button>

        {/* Indikator Status Simpan - Dipindah ke Kiri Bawah agar tidak menimpa judul */}
        {(status === 'saving' || status === 'saved') && phase !== 'FINISHED' && (
          <div className="absolute bottom-8 left-8 flex flex-col items-start animate-in fade-in slide-in-from-bottom-4 duration-500 z-30 opacity-70">
            <span className="px-4 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-300 font-medium tracking-widest text-xs uppercase shadow-2xl">
              Sesi {session} Selesai
            </span>
            {status === 'saving' && <p className="mt-2 text-zinc-500 text-xs font-medium">Menyimpan...</p>}
            {status === 'saved' && <p className="mt-2 text-emerald-500 text-xs font-medium">Tersimpan.</p>}
          </div>
        )}

        {/* Indikator Mode (Dipindah ke Kiri Atas) */}
        <div className="absolute top-8 left-8 text-zinc-500 font-bold tracking-widest uppercase text-sm z-20">
          Mode: <span className={direction === 'UP' ? 'text-indigo-400' : direction === 'DOWN' ? 'text-emerald-400' : 'text-amber-400'}>{direction === 'UP' ? 'Count-Up' : direction === 'DOWN' ? 'Count-Down' : 'Stopwatch'}</span>
        </div>

        {/* Kontainer Utama (Terpusat Sempurna) */}
        <div className="flex flex-col items-center justify-center gap-12 w-full z-10">
          
          {/* Grup Atas: Judul dan Timer (Sangat rapat) */}
          <div className="flex flex-col items-center justify-center w-full gap-2">
            
            {/* 1. Stage Subtitle (Atas, Free-floating Text) */}
            <div className="animate-in fade-in slide-in-from-top-8 duration-700 w-full px-8">
              <h2 className="text-4xl sm:text-5xl md:text-5xl leading-none font-black tracking-widest uppercase text-white text-center">
                {division} - {session === 'PREP' ? 'PREPARATION TIME' : 'RACE TIME'}
              </h2>
            </div>
            
            {/* 2. Tampilan Timer Utama (Tengah) - Desain Papan Skor Hardware Flat */}
            <div className="w-full flex items-center justify-center relative">
              <div className="bg-[#111] rounded-3xl px-12 py-6 relative overflow-hidden flex items-center justify-center min-w-[60vw]">
                
                  <div className={`text-center transition-all duration-500 z-10 ${isSettingTime ? 'opacity-10 blur-sm scale-95' : 'opacity-100 scale-100'}`}>
                    <h1 className="text-[16vw] font-bold tracking-tighter text-[#FF9900] font-digital italic tabular-nums leading-none">
                      {formatTime(remainingTime)}
                    </h1>
                  </div>
              </div>
            </div>
            
          </div>
          
          {/* 3. Identitas Tim (Bawah, Lebih Kecil) */}
          <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 px-8">
            <h3 className="text-3xl md:text-5xl leading-tight font-extrabold tracking-tight text-zinc-300 drop-shadow-lg text-center max-w-4xl">
              {teamName}
            </h3>
          </div>
          
        </div>

      {/* Indikator Status Pause/Running - Dipindah ke Kanan Bawah */}
      {phase !== 'FINISHED' && !isSettingTime && status === 'idle' && (
        <div className="absolute bottom-8 right-8 flex space-x-6 items-center z-10 opacity-70">
          <div className="flex items-center space-x-3 bg-zinc-900/80 backdrop-blur px-5 py-2.5 rounded-lg border border-zinc-800 shadow-2xl">
            <span className={`w-2.5 h-2.5 rounded-sm ${phase === 'RUNNING' ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.7)]' : 'bg-amber-500'}`}></span>
            <span className="text-zinc-300 text-xs md:text-sm uppercase tracking-widest font-bold">
              {phase === 'RUNNING' ? 'Berjalan' : 'Jeda'}
            </span>
          </div>
        </div>
      )}

      {/* Modal Batch Configuration */}
      {isSettingTime && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleBatchSubmit} className="bg-[#111] border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold tracking-widest uppercase text-white mb-8 text-center border-b border-zinc-800 pb-4">Konfigurasi Pertandingan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              
              {/* Preparation Time Config */}
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80">
                <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Tahap Persiapan
                </h4>
                
                <div className="mb-6 flex p-1 bg-black rounded-lg border border-zinc-800">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="prep_direction" value="DOWN" checked={modalPrepMode === 'DOWN'} onChange={(e) => setModalPrepMode(e.target.value as TimerDirection)} className="peer sr-only" />
                    <div className="text-center py-2 text-xs font-bold tracking-widest uppercase text-zinc-500 peer-checked:bg-zinc-800 peer-checked:text-white rounded transition-all">Mundur</div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="prep_direction" value="UP" checked={modalPrepMode === 'UP'} onChange={(e) => setModalPrepMode(e.target.value as TimerDirection)} className="peer sr-only" />
                    <div className="text-center py-2 text-xs font-bold tracking-widest uppercase text-zinc-500 peer-checked:bg-zinc-800 peer-checked:text-white rounded transition-all">Maju</div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="prep_direction" value="STOPWATCH" checked={modalPrepMode === 'STOPWATCH'} onChange={(e) => setModalPrepMode(e.target.value as TimerDirection)} className="peer sr-only" />
                    <div className="text-center py-2 text-xs font-bold tracking-widest uppercase text-zinc-500 peer-checked:bg-zinc-800 peer-checked:text-white rounded transition-all">Stopwatch</div>
                  </label>
                </div>

                <div className={`flex items-center space-x-4 transition-opacity ${modalPrepMode === 'STOPWATCH' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex-1">
                    <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium text-center">Menit</label>
                    <input type="number" name="prep_minutes" min="0" max="999" defaultValue={Math.floor(prepConfig.target / 60000)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-3xl focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono transition-shadow" />
                  </div>
                  <span className="text-3xl text-zinc-600 mt-6 font-light">:</span>
                  <div className="flex-1">
                    <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium text-center">Detik</label>
                    <input type="number" name="prep_seconds" min="0" max="59" defaultValue={Math.floor((prepConfig.target % 60000) / 1000)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-3xl focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono transition-shadow" />
                  </div>
                </div>
              </div>

              {/* Race Time Config */}
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/80">
                <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tahap Race
                </h4>
                
                <div className="mb-6 flex p-1 bg-black rounded-lg border border-zinc-800">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="race_direction" value="DOWN" checked={modalRaceMode === 'DOWN'} onChange={(e) => setModalRaceMode(e.target.value as TimerDirection)} className="peer sr-only" />
                    <div className="text-center py-2 text-xs font-bold tracking-widest uppercase text-zinc-500 peer-checked:bg-zinc-800 peer-checked:text-white rounded transition-all">Mundur</div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="race_direction" value="UP" checked={modalRaceMode === 'UP'} onChange={(e) => setModalRaceMode(e.target.value as TimerDirection)} className="peer sr-only" />
                    <div className="text-center py-2 text-xs font-bold tracking-widest uppercase text-zinc-500 peer-checked:bg-zinc-800 peer-checked:text-white rounded transition-all">Maju</div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="race_direction" value="STOPWATCH" checked={modalRaceMode === 'STOPWATCH'} onChange={(e) => setModalRaceMode(e.target.value as TimerDirection)} className="peer sr-only" />
                    <div className="text-center py-2 text-xs font-bold tracking-widest uppercase text-zinc-500 peer-checked:bg-zinc-800 peer-checked:text-white rounded transition-all">Stopwatch</div>
                  </label>
                </div>

                <div className={`flex items-center space-x-4 transition-opacity ${modalRaceMode === 'STOPWATCH' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex-1">
                    <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium text-center">Menit</label>
                    <input type="number" name="race_minutes" min="0" max="999" defaultValue={Math.floor(raceConfig.target / 60000)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-3xl focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono transition-shadow" />
                  </div>
                  <span className="text-3xl text-zinc-600 mt-6 font-light">:</span>
                  <div className="flex-1">
                    <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-medium text-center">Detik</label>
                    <input type="number" name="race_seconds" min="0" max="59" defaultValue={Math.floor((raceConfig.target % 60000) / 1000)} className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-4 text-white text-center text-3xl focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono transition-shadow" />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex space-x-4 max-w-md mx-auto">
              <button type="button" onClick={() => setIsSettingTime(false)} className="flex-1 py-4 px-4 bg-zinc-800/80 text-white rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 border border-zinc-700">Batal</button>
              <button type="submit" className="flex-1 py-4 px-4 bg-white text-black rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white">Terapkan Konfigurasi</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Histori */}
      {isHistoryModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-lg text-white p-6 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
                  {historyData.map((h) => {
                    const elapsed = (h.mode === 'UP' || h.mode === 'STOPWATCH') ? h.remainingTime : Math.max(0, h.targetTime - h.remainingTime);
                    
                    return (
                      <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-200 mb-1 flex items-center gap-2">
                            Sesi {h.type === 'PREP' ? 'Preparation' : 'Race'}
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${h.mode === 'UP' ? 'bg-indigo-500/20 text-indigo-400' : h.mode === 'STOPWATCH' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {h.mode === 'UP' ? 'Count-Up' : h.mode === 'STOPWATCH' ? 'Stopwatch' : 'Count-Down'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString('id-ID')}</div>
                        </div>
                        <div className="flex items-center gap-6 sm:gap-12">
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Waktu Target</div>
                            <div className="text-base font-mono text-gray-300">{h.mode === 'STOPWATCH' ? '-' : formatTime(h.targetTime)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-emerald-500 uppercase tracking-wider mb-1 font-bold">Waktu Terpakai</div>
                            <div className="text-2xl font-mono text-emerald-400 font-bold">{formatTime(elapsed)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={closeAlert}
      />
    </div>
    </>
  );
}
