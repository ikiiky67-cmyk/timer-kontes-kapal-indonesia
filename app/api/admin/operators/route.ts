import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, Division } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, division } = body;

    if (!username || !password || !division) {
      return NextResponse.json(
        { error: 'Username, password, and division are required' },
        { status: 400 }
      );
    }

    if (!Object.values(Division).includes(division)) {
      return NextResponse.json({ error: 'Invalid division' }, { status: 400 });
    }

    // Menggunakan upsert untuk membuat atau memperbarui akun operator divisi tersebut
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        password,
        division: division as Division,
      },
      create: {
        username,
        password,
        role: 'OPERATOR',
        division: division as Division,
      },
    });

    return NextResponse.json({ success: true, user: { username: user.username, division: user.division } }, { status: 201 });
  } catch (error) {
    console.error('Error managing operator:', error);
    return NextResponse.json({ error: 'Failed to manage operator account' }, { status: 500 });
  }
}
