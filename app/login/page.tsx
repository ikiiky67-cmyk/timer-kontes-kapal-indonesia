'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, KeyRound, Loader2, Anchor, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await loginAction(formData);

      if (res.success) {
        if (res.role === 'admin') {
          router.push('/admin');
        } else if (res.role === 'operator') {
          router.push(`/operator/dashboard?division=${res.division}`);
        }
      } else {
        setError(res.error || 'Terjadi kesalahan saat login.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8">
      {/* Background Utama (kki.jpeg) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/img/kki.jpeg"
          alt="Latar Belakang Utama"
          fill
          priority
          className="object-cover"
        />
        {/* Overlay gelap agar widget tetap terlihat menonjol */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
      </div>

      {/* The Widget Window */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">

        {/* Sisi Kiri: Cover Art (Gambar Kapal KKI2) */}
        <div className="relative w-full md:w-1/2 h-[250px] md:h-auto flex-shrink-0">
          <Image
            src="/assets/img/KKI2.jpeg"
            alt="Kontes Kapal Indonesia"
            fill
            priority
            className="object-cover"
          />
          {/* Overlay gradasi tipis di gambar agar menyatu dengan border */}
        </div>

        {/* Sisi Kanan: Form Login */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-slate-50/50">
          <div className="mb-6">
            {/* Header (Logo + Title) */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12 bg-white border border-slate-200 rounded-xl shadow-sm p-1.5 flex-shrink-0">
                <Image
                  src="/assets/img/logo_polbeng.png"
                  alt="Logo Polbeng"
                  fill
                  className="object-contain p-1.5"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Selamat Datang
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Masukkan Akun dari Admin untuk mengakses<br className="hidden sm:block" /> Dashboard Timer.
            </p>
          </div>

          {/* Kotak Card Pembungkus Form */}
          <div className="bg-white p-5 sm:p-6 rounded-[20px] border border-slate-200 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                {/* Input Username */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">
                    Username
                  </label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center pointer-events-none">
                      <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-700 transition-colors" strokeWidth={2.5} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all text-sm font-bold"
                      placeholder="Ketik username Anda"
                      required
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-4 flex items-center pointer-events-none">
                      <KeyRound className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-slate-700 transition-colors" strokeWidth={2.5} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all text-sm font-bold"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      ) : (
                        <Eye className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-[14px] bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center animate-in fade-in zoom-in-95">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-[12px] text-[14px] font-bold text-white bg-[#0f172a] hover:bg-[#1e293b] focus:outline-none focus:ring-4 focus:ring-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Log in to Dashboard'
                )}
              </button>
            </form>
          </div>

          {/* Footer Card */}
          <div className="mt-8 pt-4 text-center">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider">
              &copy; {new Date().getFullYear()} POLITEKNIK NEGERI BENGKALIS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
