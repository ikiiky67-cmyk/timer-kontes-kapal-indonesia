'use client';

import { motion, AnimatePresence } from 'motion/react';
import { History } from 'lucide-react';

export type UnifiedHistory = {
  id: string;
  teamName: string;
  type: 'PREP' | 'RACE';
  remainingTime: number;
  createdAt: Date;
};

const formatTime = (ms: number) => {
  const m = Math.floor(ms / 60000).toString().padStart(2, '0');
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  const msPart = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m}:${s}.${msPart}`;
};

export default function OperatorHistoryTable({ histories }: { histories: UnifiedHistory[] }) {
  if (histories.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden p-8 text-center text-zinc-500 text-sm shadow-sm flex flex-col items-center gap-2">
        <History className="w-8 h-8 text-zinc-300" />
        Belum ada riwayat penyelesaian timer.
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-sm font-medium text-zinc-500">
              <th className="px-6 py-4">Waktu Selesai</th>
              <th className="px-6 py-4">Nama Tim</th>
              <th className="px-6 py-4">Tipe</th>
              <th className="px-6 py-4 text-right">Sisa Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            <AnimatePresence>
              {histories.map((history) => (
                <motion.tr 
                  key={history.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-500">
                      {new Date(history.createdAt).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{history.teamName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      history.type === 'PREP' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {history.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-medium text-zinc-700">
                      {formatTime(history.remainingTime)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
