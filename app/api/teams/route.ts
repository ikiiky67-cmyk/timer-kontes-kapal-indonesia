import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Division } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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

    const team = await prisma.team.create({
      data: {
        name,
        institution,
        division: division as Division,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
