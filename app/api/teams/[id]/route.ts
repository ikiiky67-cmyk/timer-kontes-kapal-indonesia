import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Division, TeamStatus } from '@prisma/client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, institution, division } = body;

    if (!name || !institution || !division) {
      return NextResponse.json(
        { error: 'Name, institution, and division are required' },
        { status: 400 }
      );
    }

    if (!Object.values(Division).includes(division)) {
      return NextResponse.json({ error: 'Invalid division' }, { status: 400 });
    }

    // Pengecekan status: Tim tidak boleh diedit jika tidak IDLE
    const currentTeam = await prisma.team.findUnique({ where: { id } });
    if (!currentTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (currentTeam.status !== TeamStatus.IDLE) {
      return NextResponse.json(
        { error: 'Tim sedang digunakan dalam perlombaan, tidak dapat diedit.' },
        { status: 400 }
      );
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        institution,
        division: division as Division,
      },
    });

    return NextResponse.json(team);
  } catch (error: any) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const { id } = await context.params;

    // Pengecekan sesi: Hanya ADMIN yang boleh menghapus
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Admin yang dapat menghapus tim.' },
        { status: 403 }
      );
    }

    // Pengecekan status: Tim tidak boleh dihapus jika tidak IDLE
    const currentTeam = await prisma.team.findUnique({ where: { id } });
    if (!currentTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (currentTeam.status !== TeamStatus.IDLE) {
      return NextResponse.json(
        { error: 'Tim sedang digunakan dalam perlombaan, tidak dapat dihapus.' },
        { status: 400 }
      );
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
