import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Ensure we are deleting an operator
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'OPERATOR') {
      return NextResponse.json({ error: 'Operator not found or invalid role' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json({ error: 'Failed to delete operator' }, { status: 500 });
  }
}
