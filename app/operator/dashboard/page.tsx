import OperatorTeamTable from '@/components/operator/OperatorTeamTable';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Division } from '@prisma/client';
import SidebarLayout from '@/components/layout/SidebarLayout';

export const dynamic = 'force-dynamic';

export default async function OperatorDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token?.startsWith('operator_')) {
    redirect('/login');
  }

  const divisionStr = token.split('_')[1];
  const division = divisionStr as Division;

  const divisionTeams = await prisma.team.findMany({
    where: { division },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <SidebarLayout role="operator" division={division}>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-1">
          <div>
            <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Daftar Tim Divisi {division}</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Pilih tim yang bertanding dan jalankan timer.</p>
          </div>
          <div className="bg-slate-800 text-white rounded-2xl px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center shrink-0">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Total Tim</span>
            <span className="text-xl font-black leading-none">{divisionTeams.length}</span>
          </div>
        </div>
        <OperatorTeamTable initialTeams={divisionTeams} currentDivision={division} />
      </div>
    </SidebarLayout>
  );
}
