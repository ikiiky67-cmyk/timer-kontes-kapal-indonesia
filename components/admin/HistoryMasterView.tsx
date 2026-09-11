'use client';

import { useState, useMemo } from 'react';
import { Division } from '@prisma/client';
import { Search, History, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HistoryDetailDrawer from '@/components/admin/HistoryDetailDrawer';

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

export default function HistoryMasterView({ teams }: { teams: Team[] }) {
  const [activeTab, setActiveTab] = useState<Division | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesDivision = activeTab === 'ALL' || team.division === activeTab;
      const matchesSearch = 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.institution.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDivision && matchesSearch;
    });
  }, [teams, activeTab, searchQuery]);

  const handleRowClick = (team: Team) => {
    setSelectedTeam(team);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col h-full overflow-hidden">
        
        {/* TOP CONTROLS: TABS & SEARCH */}
        <div className="p-6 border-b border-slate-100/80 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          
          {/* Tabs */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
                activeTab === 'ALL' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Semua
            </button>
            {Object.values(Division).map((div) => (
              <button
                key={div}
                onClick={() => setActiveTab(div)}
                className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
                  activeTab === div 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {div}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-[300px] shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama tim atau institusi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          </div>

        </div>

        {/* TEAM LIST TABLE */}
        <div className="p-0 overflow-x-auto flex-1">
          <div className="p-6">
            {filteredTeams.length === 0 ? (
              <div className="text-center text-slate-500 text-[13px] py-16 flex flex-col items-center">
                <Search className="w-8 h-8 text-slate-300 mb-3" />
                <p>Tidak ada tim yang cocok dengan pencarian atau filter.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4 rounded-tl-xl">Nama Tim & Institusi</th>
                      <th className="px-6 py-4">Divisi</th>
                      <th className="px-6 py-4">Total Riwayat</th>
                      <th className="px-6 py-4 text-right rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    <AnimatePresence>
                      {filteredTeams.map((team) => {
                        const totalLogs = team._count.prepHistories + team._count.raceHistories;
                        return (
                          <motion.tr 
                            key={team.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => handleRowClick(team)}
                            className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-[14px]">{team.name}</div>
                              <div className="text-[12px] text-slate-500 mt-0.5">{team.institution}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80 tracking-wide">
                                {team.division}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${
                                  totalLogs > 0 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100/80' 
                                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                                }`}>
                                  <History className="w-3 h-3" />
                                  {totalLogs} Log
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-400 group-hover:text-blue-600 transition-colors">
                              <div className="flex justify-end items-center h-full">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <HistoryDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        team={selectedTeam}
      />
    </>
  );
}
