import prisma from '@/lib/prisma';
import { Division } from '@prisma/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OperatorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ div?: string }>;
}) {
  const params = await searchParams;
  // Simulasi autentikasi operator: Gunakan query param ?div=ROV untuk testing.
  // Dalam implementasi nyata, ini diambil dari session/token user yang login.
  const operatorDivision = (params.div as Division) || Division.ROV;
  
  const divisions = Object.values(Division);

  const teams = await prisma.team.findMany({
    where: { division: operatorDivision },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-8 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-zinc-900">Operator Dashboard</h1>
            <p className="text-zinc-500 mt-2">Daftar tim divisi <strong className="text-zinc-900">{operatorDivision}</strong>.</p>
          </div>
          
          {/* Switcher untuk simulasi - Hapus di produksi */}
          <div className="bg-white border border-zinc-200 rounded-lg p-1 flex shadow-sm">
            {divisions.map((div) => (
              <Link
                key={div}
                href={`/operator?div=${div}`}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  operatorDivision === div 
                    ? 'bg-zinc-900 text-white' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {div}
              </Link>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length === 0 ? (
            <div className="col-span-full bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500">
              Tidak ada tim yang terdaftar di divisi {operatorDivision}.
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col hover:border-zinc-300 hover:shadow-sm transition-all">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg text-zinc-900 leading-tight">{team.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                      {team.division}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-6">{team.institution || 'Tidak ada institusi'}</p>
                </div>
                
                <Link 
                  href={`/timer/${team.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-white border border-zinc-200 text-zinc-900 font-medium py-2 px-4 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
                >
                  Buka Timer
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 w-4 h-4 text-zinc-500"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
