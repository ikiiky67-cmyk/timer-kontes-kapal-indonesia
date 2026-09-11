import { Clock } from 'lucide-react';
import prisma from '@/lib/prisma';
import SidebarLayout from '@/components/layout/SidebarLayout';
import HistoryMasterView from '@/components/admin/HistoryMasterView';

export const dynamic = 'force-dynamic';

export default async function HistoryManagementPage() {
  const allTeams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
  });

  const prepCounts = await prisma.prepHistory.groupBy({
    by: ['teamId'],
    _count: { teamId: true },
  });

  const raceCounts = await prisma.raceHistory.groupBy({
    by: ['teamId'],
    _count: { teamId: true },
  });

  const prepMap = new Map(prepCounts.map(p => [p.teamId, p._count.teamId]));
  const raceMap = new Map(raceCounts.map(r => [r.teamId, r._count.teamId]));

  const teamsWithCounts = allTeams.map(team => ({
    ...team,
    _count: {
      prepHistories: prepMap.get(team.id) || 0,
      raceHistories: raceMap.get(team.id) || 0,
    }
  }));

  return (
    <SidebarLayout role="admin">
      <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Manajemen Riwayat Waktu
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              Pantau dan kelola riwayat catatan waktu untuk setiap tim dari seluruh divisi.
            </p>
          </div>
        </div>

        {/* FULL-WIDTH DATA TABLE */}
        <HistoryMasterView teams={teamsWithCounts} />

      </div>
    </SidebarLayout>
  );
}
