import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TeamStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teamId, remainingTime, targetTime, type = 'RACE' } = body;

    if (!teamId || remainingTime === undefined || targetTime === undefined) {
      return NextResponse.json(
        { error: 'teamId, remainingTime, and targetTime are required' },
        { status: 400 }
      );
    }

    // Gunakan transaksi untuk menyimpan histori dan update status menjadi IDLE
    const result = await prisma.$transaction(async (tx) => {
      let history;
      if (type === 'PREP') {
        history = await tx.prepHistory.create({
          data: {
            teamId,
            targetTime,
            remainingTime,
          },
        });
      } else {
        history = await tx.raceHistory.create({
          data: {
            teamId,
            targetTime,
            remainingTime,
          },
        });
      }

      // Bebaskan tim (kembali ke IDLE) karena sesi sudah selesai atau dihentikan
      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: { status: TeamStatus.IDLE },
      });

      return { history, updatedTeam };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving timer history:', error);
    return NextResponse.json(
      { error: 'Failed to save timer history' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { teamId, status } = body;

    if (!teamId || !status) {
      return NextResponse.json(
        { error: 'teamId and status are required' },
        { status: 400 }
      );
    }

    if (!Object.values(TeamStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { status: status as TeamStatus },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team status:', error);
    return NextResponse.json(
      { error: 'Failed to update team status' },
      { status: 500 }
    );
  }
}
