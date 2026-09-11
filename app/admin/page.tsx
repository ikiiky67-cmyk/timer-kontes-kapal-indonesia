import prisma from '@/lib/prisma';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { Users, UserCheck, LayoutGrid, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch only 5 recent teams for overview
  const recentTeams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const totalTeams = await prisma.team.count();
  const activeOperators = await prisma.user.count({ where: { role: 'OPERATOR' } });
  const totalDivisions = 4; // Constant based on Division enum

  return (
    <SidebarLayout role="admin">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* QUICK STATS */}
        <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500">Total Tim</p>
              <p className="text-[24px] font-bold text-slate-800 tracking-tight leading-tight">{totalTeams}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500">Operator Aktif</p>
              <p className="text-[24px] font-bold text-slate-800 tracking-tight leading-tight">{activeOperators}</p>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500">Total Divisi</p>
              <p className="text-[24px] font-bold text-slate-800 tracking-tight leading-tight">{totalDivisions}</p>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY & QUICK ACTIONS */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-400" />
                <div>
                  <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Pendaftar Terbaru</h2>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">5 tim terakhir yang didaftarkan ke dalam sistem.</p>
                </div>
              </div>
              <Link href="/admin/teams" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                Lihat Semua
              </Link>
            </div>
            <div className="p-0 overflow-x-auto">
              {recentTeams.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-[13px]">Belum ada aktivitas.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Nama Tim</th>
                      <th className="px-6 py-4">Institusi</th>
                      <th className="px-6 py-4 text-right">Divisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {recentTeams.map(team => (
                      <tr key={team.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800 text-[14px]">{team.name}</td>
                        <td className="px-6 py-4 text-[13px] text-slate-500">{team.institution}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/80 tracking-wide">
                            {team.division}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <Link href="/admin/teams" className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-blue-900/5 transition-all duration-300 group flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Daftarkan Tim Baru</h3>
              <p className="text-[13px] text-slate-500 mt-1">Buka form pendaftaran tim.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </Link>
          
          <Link href="/admin/operators" className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-blue-900/5 transition-all duration-300 group flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Kelola Operator</h3>
              <p className="text-[13px] text-slate-500 mt-1">Tambah atau atur ulang operator.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
          </Link>
        </div>

      </div>
    </SidebarLayout>
  );
}
