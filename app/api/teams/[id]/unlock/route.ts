import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TeamStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, context: any) {
  try {
    const { id } = await context.params;

    const team = await prisma.team.update({
      where: { id },
      data: { status: TeamStatus.IDLE },
    });

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    console.error('Error unlocking team:', error);
    return NextResponse.json({ error: 'Failed to unlock team' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: any) {
  return POST(req, context);
}
