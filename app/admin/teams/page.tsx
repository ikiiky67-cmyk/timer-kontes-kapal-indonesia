import TeamRegistrationModal from '@/components/admin/TeamRegistrationModal';
import TeamTable from '@/components/admin/TeamTable';
import prisma from '@/lib/prisma';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamManagementPage() {
  const allTeams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <SidebarLayout role="admin">
      <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Manajemen Tim
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Kelola data seluruh tim yang terdaftar di dalam sistem.</p>
          </div>
        </div>

        {/* FULL-WIDTH DATA TABLE */}
        <div className="w-full flex flex-col">
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100/80 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Daftar Semua Tim</h2>
                <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                  Total: <span className="font-bold text-blue-600">{allTeams.length}</span> tim terdaftar
                </p>
              </div>
              
              {/* MODAL TRIGGER BUTTON INJECTED HERE */}
              <TeamRegistrationModal />
            </div>
            
            <div className="p-0 overflow-x-auto flex-1">
              <div className="p-6">
                <TeamTable initialTeams={allTeams} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
}
