import TeamRegistrationForm from '@/components/admin/TeamRegistrationForm';
import OperatorRegistrationForm from '@/components/admin/OperatorRegistrationForm';
import TeamTable from '@/components/admin/TeamTable';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const recentTeams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Admin Dashboard</h1>
            <p className="text-zinc-500 mt-1 text-sm md:text-base">Kelola pendaftaran tim dan akun operator untuk seluruh divisi.</p>
          </div>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Log out
          </Link>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 px-1">Daftarkan Tim Baru</h2>
              <TeamRegistrationForm />
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 px-1">Manajemen Operator</h2>
              <OperatorRegistrationForm />
            </section>
          </div>

          <div className="xl:col-span-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-semibold text-zinc-900">Daftar Semua Tim</h2>
              <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs font-bold">
                Total: {recentTeams.length} Tim
              </span>
            </div>
            <TeamTable initialTeams={recentTeams} />
          </div>
        </div>
      </div>
    </div>
  );
}
