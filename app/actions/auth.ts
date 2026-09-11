'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

import bcrypt from 'bcryptjs';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Cek user di database
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { success: false, error: 'Username atau password salah.' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { success: false, error: 'Username atau password salah.' };
  }

  const cookieStore = await cookies();
  const tokenValue = user.role === 'ADMIN' ? 'admin' : `operator_${user.division}`;

  cookieStore.set('auth_token', tokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 hari
    path: '/',
  });

  return {
    success: true,
    role: user.role.toLowerCase(),
    division: user.division
  };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
