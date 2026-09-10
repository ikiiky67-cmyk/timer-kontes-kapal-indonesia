import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ClientTimer from '@/components/timer/ClientTimer';
import { TeamStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function TimerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  
  // Menggunakan transaksi agar pengecekan status dan penguncian bersifat atomic
  const team = await prisma.$transaction(async (tx) => {
    const currentTeam = await tx.team.findUnique({
      where: { id: teamId }
    });

    if (!currentTeam) return null;

    // Jika sudah dikunci oleh perangkat lain
    if (currentTeam.status !== TeamStatus.IDLE) {
      return { error: 'LOCKED' };
    }

    // Jika aman, ubah status menjadi PREPARING
    return await tx.team.update({
      where: { id: teamId },
      data: { status: TeamStatus.PREPARING }
    });
  });

  if (!team) {
    notFound();
  }

  // Cek apakah ada properti error
  if ('error' in team) {
    // Redirect ke dashboard operator dengan membawa parameter error
    redirect('/operator/dashboard?error=TeamLocked');
  }

  return (
    <ClientTimer teamId={team.id} teamName={team.name} division={team.division} />
  );
}
