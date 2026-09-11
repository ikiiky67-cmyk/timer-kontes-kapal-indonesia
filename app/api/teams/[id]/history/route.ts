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
        targetTime: h.targetTime,
        mode: h.mode,
        createdAt: h.createdAt,
      })),
      ...raceHistories.map(h => ({
        id: h.id,
        type: 'RACE' as const,
        remainingTime: h.remainingTime,
        targetTime: h.targetTime,
        mode: h.mode,
        createdAt: h.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(unifiedHistories);
  } catch (error) {
    console.error('Error fetching team history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'clear_all') {
      await prisma.prepHistory.deleteMany({ where: { teamId: id } });
      await prisma.raceHistory.deleteMany({ where: { teamId: id } });
      return NextResponse.json({ success: true, message: 'All history cleared' });
    } 
    
    if (action === 'delete_single') {
      const historyId = url.searchParams.get('historyId');
      const type = url.searchParams.get('type');
      
      if (!historyId || !type) {
        return NextResponse.json({ error: 'historyId and type are required' }, { status: 400 });
      }

      if (type === 'PREP') {
        await prisma.prepHistory.delete({ where: { id: historyId } });
      } else if (type === 'RACE') {
        await prisma.raceHistory.delete({ where: { id: historyId } });
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
      
      return NextResponse.json({ success: true, message: 'History deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting team history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
