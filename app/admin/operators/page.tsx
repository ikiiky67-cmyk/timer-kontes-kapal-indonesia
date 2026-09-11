import OperatorTable from '@/components/admin/OperatorTable';
import prisma from '@/lib/prisma';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { UserCog } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OperatorManagementPage() {
  const allOperators = await prisma.user.findMany({
    where: { role: 'OPERATOR' },
    orderBy: { username: 'asc' },
  });

  return (
    <SidebarLayout role="admin">
      <div className="flex flex-col gap-8 max-w-[1200px] mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UserCog className="w-6 h-6 text-blue-600" />
              Manajemen Operator
            </h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Kelola akun dan akses operator untuk setiap divisi.</p>
          </div>
        </div>

        {/* FULL-WIDTH DATA TABLE */}
        <OperatorTable initialOperators={allOperators} />

      </div>
    </SidebarLayout>
  );
}
