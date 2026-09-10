import OperatorTeamTable from '@/components/operator/OperatorTeamTable';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Division } from '@prisma/client';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

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
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Dashboard Operator</h1>
              <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold tracking-widest">
                {division}
              </span>
            </div>
            <p className="text-zinc-500 text-sm md:text-base">Kelola tim dan jalankan timer khusus untuk divisi Anda.</p>
          </div>
          <form action={logoutAction}>
            <button 
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </form>
        </header>

        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-semibold text-zinc-900">Daftar Tim Divisi {division}</h2>
            <span className="text-sm font-medium text-zinc-500">
              Total: {divisionTeams.length} Tim
            </span>
          </div>
          <OperatorTeamTable initialTeams={divisionTeams} currentDivision={division} />
        </div>
      </div>
    </div>
  );
}
