import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Division } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'OPERATOR',
        division: division as Division,
      },
    });

    return NextResponse.json({ success: true, user: { username: user.username, division: user.division } }, { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: 'Failed to create operator account' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, username, password, division } = body;

    if (!id || !username || !division) {
      return NextResponse.json(
        { error: 'ID, Username, and division are required' },
        { status: 400 }
      );
    }

    if (!Object.values(Division).includes(division)) {
      return NextResponse.json({ error: 'Invalid division' }, { status: 400 });
    }

    // Cek apakah username dipakai oleh user lain
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== id) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh operator lain' }, { status: 400 });
    }

    const updateData: any = {
      username,
      division: division as Division,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: { username: user.username, division: user.division } }, { status: 200 });
  } catch (error) {
    console.error('Error updating operator:', error);
    return NextResponse.json({ error: 'Failed to update operator account' }, { status: 500 });
  }
}
