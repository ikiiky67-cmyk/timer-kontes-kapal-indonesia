import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: any) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const prepHistories = await prisma.prepHistory.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
    });

    const raceHistories = await prisma.raceHistory.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Unified history
    const unifiedHistories = [
      ...prepHistories.map(h => ({
        id: h.id,
        type: 'PREP' as const,
        remainingTime: h.remainingTime,
        createdAt: h.createdAt,
      })),
      ...raceHistories.map(h => ({
        id: h.id,
        type: 'RACE' as const,
        remainingTime: h.remainingTime,
        createdAt: h.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(unifiedHistories);
  } catch (error) {
    console.error('Error fetching team history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
