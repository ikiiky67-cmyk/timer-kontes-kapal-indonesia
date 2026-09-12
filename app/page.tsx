'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Keyboard,
  Play,
  Settings,
  LogIn,
  Clock,
  Tv,
  ChevronRight,
  Monitor,
  RotateCcw,
  Maximize,
  Square,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react';

type TabId = 'quickstart' | 'shortcuts' | 'modes' | 'tips';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'quickstart', label: 'Panduan Mulai Cepat', icon: <Play className="w-4 h-4" /> },
  { id: 'shortcuts', label: 'Pintasan Keyboard', icon: <Keyboard className="w-4 h-4" /> },
  { id: 'modes', label: 'Mode Timer', icon: <Timer className="w-4 h-4" /> },
  { id: 'tips', label: 'Tips Live Kompetisi', icon: <Tv className="w-4 h-4" /> },
];

const shortcuts = [
  {
    key: 'Space',
    action: 'Mulai / Jeda Timer',
    detail: 'Mulai atau jeda timer secara instan. Gunakan saat tim sudah siap menjalankan sesi.',
    color: 'bg-blue-950/50 border-blue-800/60',
    textColor: 'text-blue-200',
    keyColor: 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]',
  },
  {
    key: 'N',
    action: 'Pindah Fokus Timer',
    detail: 'Memindahkan fokus antara timer Preparation dan Race agar Anda dapat mengendalikan sesi yang tepat.',
    color: 'bg-slate-800/60 border-slate-700/60',
    textColor: 'text-slate-200',
    keyColor: 'bg-slate-600 text-white shadow-[0_0_12px_rgba(71,85,105,0.4)]',
  },
  {
    key: 'V / D',
    action: 'Buka Layar Belah',
    detail: 'Membuka tampilan Dual Screen untuk melihat timer Preparation dan Race berdampingan dalam satu layar.',
    color: 'bg-emerald-950/50 border-emerald-800/60',
    textColor: 'text-emerald-200',
    keyColor: 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]',
  },
  {
    key: 'R',
    action: 'Reset Timer',
    detail: 'Mengembalikan timer yang sedang fokus ke waktu awal sebelum sesi dimulai.',
    color: 'bg-violet-950/50 border-violet-800/60',
    textColor: 'text-violet-200',
    keyColor: 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]',
  },
  {
    key: 'S',
    action: 'Atur Target Waktu',
    detail: 'Membuka pengaturan untuk menentukan target waktu kompetisi pada sesi Preparation dan Race.',
    color: 'bg-amber-950/50 border-amber-800/60',
    textColor: 'text-amber-200',
    keyColor: 'bg-amber-600 text-white shadow-[0_0_12px_rgba(217,119,6,0.4)]',
  },
  {
    key: 'F',
    action: 'Selesaikan dan Simpan',
    detail: 'Menghentikan timer yang sedang berjalan dan langsung menyimpan waktu sesi ke riwayat tim.',
    color: 'bg-red-950/50 border-red-800/60',
    textColor: 'text-red-200',
    keyColor: 'bg-red-700 text-white shadow-[0_0_12px_rgba(185,28,28,0.4)]',
  },
  {
    key: 'M',
    action: 'Buka Layar Penuh',
    detail: 'Mengaktifkan atau menonaktifkan layar penuh untuk tampilan timer yang lebih besar di TV atau proyektor. F11 juga dapat digunakan.',
    color: 'bg-cyan-950/50 border-cyan-800/60',
    textColor: 'text-cyan-200',
    keyColor: 'bg-cyan-700 text-white shadow-[0_0_12px_rgba(14,116,144,0.4)]',
  },
  {
    key: 'H',
    action: 'Lihat Riwayat Tim',
    detail: 'Membuka riwayat waktu tim saat timer sedang berhenti atau sudah selesai.',
    color: 'bg-fuchsia-950/50 border-fuchsia-800/60',
    textColor: 'text-fuchsia-200',
    keyColor: 'bg-fuchsia-700 text-white shadow-[0_0_12px_rgba(162,28,175,0.4)]',
  },
];

const modes = [
  {
    name: 'Count-Down (Mundur)',
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    glow: 'shadow-emerald-500/10',
    desc: 'Timer dimulai dari waktu target yang ditentukan dan berjalan mundur hingga 00:00.00. Saat selesai, sistem menyimpan hasil dan menyiapkan sesi berikutnya.',
    use: 'Paling umum digunakan untuk kedua sesi Persiapan dan Race di kontes KKI.',
    config: 'Atur Menit & Detik target. Default: Persiapan = 5 menit, Race = 15 menit.',
    icon: <RotateCcw className="w-5 h-5 text-emerald-400" />,
  },
  {
    name: 'Count-Up (Maju)',
    badge: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]',
    glow: 'shadow-indigo-500/10',
    desc: 'Timer dimulai dari 00:00.00 dan berjalan maju hingga mencapai target waktu. Berguna untuk memantau durasi yang digunakan tim.',
    use: 'Digunakan jika format penilaian berdasarkan waktu tercepat dari titik nol.',
    config: 'Atur Menit & Detik batas maksimum. Timer akan berhenti dan menyimpan saat batas tercapai.',
    icon: <Play className="w-5 h-5 text-indigo-400" />,
  },
  {
    name: 'Stopwatch',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    glow: 'shadow-amber-500/10',
    desc: 'Timer berjalan maju dari 00:00.00 tanpa batas waktu. Operator menghentikan timer saat sesi selesai untuk menyimpan durasi aktual.',
    use: 'Digunakan jika panitia tidak menetapkan batas waktu spesifik dan ingin merekam durasi aktual.',
    config: 'Tidak memerlukan pengaturan target waktu (input Menit/Detik akan dinonaktifkan).',
    icon: <Clock className="w-5 h-5 text-amber-400" />,
  },
];

const quicksteps = [
  {
    num: '01',
    title: 'Login ke Sistem',
    desc: 'Buka halaman Login dan masukkan username serta password akun Operator yang diberikan oleh Admin. Setiap akun Operator sudah terikat ke satu Divisi tertentu (ROV, ASV, ERC, FERC, IDK, atau ISPK).',
    icon: <LogIn className="w-5 h-5" />,
    accent: 'from-blue-500 to-blue-700',
    action: { label: 'Pergi ke Login', href: '/login' },
  },
  {
    num: '02',
    title: 'Pilih Tim dari Dasbor',
    desc: 'Setelah login, Anda akan masuk ke Dasbor Operator yang menampilkan daftar tim sesuai divisi Anda. Klik tombol "Buka Timer" pada kartu tim yang akan bertanding.',
    icon: <Monitor className="w-5 h-5" />,
    accent: 'from-violet-500 to-violet-700',
    action: null,
  },
  {
    num: '03',
    title: 'Atur Target Waktu (Tombol S)',
    desc: 'Setelah layar Timer terbuka, tekan S untuk mengatur target waktu sesi Preparation dan Race sesuai ketentuan panitia. Tekan "Terapkan" setelah selesai.',
    icon: <Settings className="w-5 h-5" />,
    accent: 'from-slate-500 to-slate-700',
    action: null,
  },
  {
    num: '04',
    title: 'Buka Layar Belah (Tombol V atau D)',
    desc: 'Tekan V atau D untuk menampilkan timer Preparation dan Race berdampingan pada satu layar. Gunakan tampilan ini saat operator perlu memantau kedua fase.',
    icon: <Maximize className="w-5 h-5" />,
    accent: 'from-amber-500 to-amber-700',
    action: null,
  },
  {
    num: '05',
    title: 'Mulai Sesi (Tombol Space)',
    desc: 'Saat tim siap, tekan Spacebar. Timer langsung berjalan dari waktu awal dengan mesin performa 60 FPS.',
    icon: <Play className="w-5 h-5" />,
    accent: 'from-emerald-500 to-emerald-700',
    action: null,
  },
  {
    num: '06',
    title: 'Pindah Fase dan Simpan Hasil',
    desc: 'Gunakan N untuk memindahkan fokus antara Preparation dan Race. Tekan F untuk menghentikan dan menyimpan sesi, H untuk melihat riwayat, atau M untuk layar penuh.',
    icon: <Square className="w-5 h-5" />,
    accent: 'from-red-500 to-red-700',
    action: null,
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('quickstart');

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/assets/img/logo_polbeng.png"
                alt="Logo Polbeng"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-white text-[14px] tracking-tight hidden sm:block">
              Timer KKI — Sistem Timer Resmi
            </span>
            <span className="font-bold text-white text-[14px] tracking-tight sm:hidden">
              Timer KKI
            </span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </Link>
        </div>
      </header>

      {/* ── Hero Section (with kki.jpeg background) ── */}
      <section className="relative overflow-hidden min-h-[420px] sm:min-h-[480px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/img/kki.jpeg"
            alt="Kontes Kapal Indonesia"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Manual Resmi Operator
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              <span className="text-white">Sistem Timer Resmi Kontes Kapal Indonesia (KKI)</span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                Politeknik Negeri Bengkalis
              </span>
            </h1>

            <p className="text-slate-400 text-[15px] sm:text-base leading-relaxed mb-8">
              Timer live berpresisi tinggi untuk membantu operator dan juri menjalankan fase Preparation dan Race secara tertib, cepat, dan mudah dipantau.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[14px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)] active:scale-95"
            >
              Mulai Sekarang
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stat Cards (glassmorphism) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12">
            {[
              { label: 'Pintasan Utama', value: '5', color: 'text-blue-400', glow: 'from-blue-500/20 to-transparent' },
              { label: 'Tampilan Layar', value: '2', color: 'text-emerald-400', glow: 'from-emerald-500/20 to-transparent' },
              { label: 'Divisi Kompetisi', value: '6', color: 'text-violet-400', glow: 'from-violet-500/20 to-transparent' },
              { label: 'Performa', value: '60 FPS', color: 'text-amber-400', glow: 'from-amber-500/20 to-transparent' },
            ].map((s) => (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md p-4 text-center transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px] hover:shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${s.glow} opacity-60`} />
                <div className={`relative text-3xl font-black ${s.color}`}>{s.value}</div>
                <div className="relative text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-6">

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-200 border ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200 backdrop-blur-md'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Quick Start ── */}
        {activeTab === 'quickstart' && (
          <div className="space-y-4">
            <div className="bg-blue-950/40 border border-blue-800/50 backdrop-blur-md rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-blue-300 font-medium leading-relaxed">
                Ikuti langkah-langkah ini untuk memulai timer tim baru dengan cepat dan konsisten.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quicksteps.map((step) => (
                <div
                  key={step.num}
                  className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-slate-900/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center flex-shrink-0 text-white shadow-lg`}>
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Langkah {step.num}</div>
                      <h3 className="text-[15px] font-bold text-white mt-0.5">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{step.desc}</p>
                  {step.action && (
                    <Link
                      href={step.action.href}
                      className="mt-auto self-start flex items-center gap-1.5 text-[12px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {step.action.label}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Keyboard Shortcuts ── */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
              <Keyboard className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate-400 leading-relaxed">
                Semua pintasan bekerja langsung di layar Timer. Gunakan keyboard agar pengoperasian tetap cepat saat kompetisi berlangsung.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {shortcuts.map((s) => (
                <div
                  key={s.key}
                  className={`border rounded-xl p-5 backdrop-blur-md flex flex-col sm:flex-row sm:items-start gap-4 transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl ${s.color}`}
                >
                  <div className={`flex-shrink-0 self-start px-4 py-2 rounded-lg text-[13px] font-black font-mono tracking-widest ${s.keyColor}`}>
                    {s.key}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-[15px] mb-1 ${s.textColor}`}>{s.action}</div>
                    <p className="text-[13px] text-slate-400 leading-relaxed">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Timer Modes ── */}
        {activeTab === 'modes' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
              <Settings className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate-400 leading-relaxed">
                Target waktu diatur melalui panel Konfigurasi (tekan{' '}
                <kbd className="bg-slate-700 text-slate-200 text-[11px] font-bold px-1.5 py-0.5 rounded font-mono">S</kbd>
                {' '}di layar timer). Anda dapat mengatur target berbeda untuk sesi Preparation dan Race secara bersamaan.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {modes.map((m) => (
                <div
                  key={m.name}
                  className={`bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px] hover:shadow-xl`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${m.dot}`} />
                    <span className={`text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${m.badge}`}>{m.name}</span>
                  </div>
                  <p className="text-[14px] text-slate-300 leading-relaxed mb-4">{m.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 rounded-xl p-4">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Kapan Digunakan</div>
                      <p className="text-[13px] text-slate-300">{m.use}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-4">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Cara Konfigurasi</div>
                      <p className="text-[13px] text-slate-300">{m.config}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Live Tips ── */}
        {activeTab === 'tips' && (
          <div className="space-y-3">
            {[
              {
                title: 'Atur Target Sebelum Memulai',
                body: 'Tekan S setelah masuk ke layar timer. Pastikan target waktu untuk Preparation dan Race sudah benar sebelum tim siap di arena.',
                accent: 'border-amber-800/50 bg-amber-950/30',
                iconColor: 'text-amber-400',
              },
              {
                title: 'Gunakan Layar Belah Saat Memantau Dua Fase',
                body: 'Tekan V atau D untuk membuka Dual Screen. Preparation dan Race tampil berdampingan sehingga operator dapat melihat fase yang sedang aktif dengan jelas.',
                accent: 'border-blue-800/50 bg-blue-950/30',
                iconColor: 'text-blue-400',
              },
              {
                title: 'Timer Dimulai Secara Instan',
                body: 'Tekan Spacebar setelah aba-aba diberikan. Timer langsung berjalan dengan performa 60 FPS agar tampilan tetap halus dan responsif.',
                accent: 'border-slate-700/50 bg-slate-800/30',
                iconColor: 'text-slate-400',
              },
              {
                title: 'Transisi Otomatis Persiapan → Race',
                body: 'Setelah sesi Preparation selesai, sistem menyimpan catatan waktunya dan menyiapkan sesi Race. Tekan N untuk memindahkan fokus, lalu Spacebar untuk memulai Race.',
                accent: 'border-emerald-800/50 bg-emerald-950/30',
                iconColor: 'text-emerald-400',
              },
              {
                title: 'Kembalikan Timer dengan Tombol R',
                body: 'Jika perlu mengulang persiapan sebelum sesi dimulai, tekan R untuk mengembalikan timer yang sedang fokus ke waktu awal.',
                accent: 'border-red-800/50 bg-red-950/30',
                iconColor: 'text-red-400',
              },
              {
                title: 'Riwayat Tim Tersimpan Otomatis di Server',
                body: 'Setiap hasil sesi tersimpan dalam riwayat tim. Admin dapat memeriksa catatan resmi dan mengekspor laporan PDF untuk proses pengesahan.',
                accent: 'border-violet-800/50 bg-violet-950/30',
                iconColor: 'text-violet-400',
              },
            ].map((tip, i) => (
              <div
                key={i}
                className={`border rounded-xl p-5 flex gap-4 backdrop-blur-md transition-all duration-300 hover:translate-y-[-1px] hover:shadow-xl ${tip.accent}`}
              >
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tip.iconColor}`} />
                <div>
                  <h3 className="font-bold text-white text-[14px] mb-1">{tip.title}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed">{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-slate-800/60 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex-shrink-0 opacity-60">
              <Image src="/assets/img/logo_polbeng.png" alt="Polbeng" fill className="object-contain" />
            </div>
            <p className="text-[12px] text-slate-500 font-medium">
              © {new Date().getFullYear()} Politeknik Negeri Bengkalis — Kontes Kapal Indonesia
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white transition-colors duration-200"
          >
            Akses Dasbor
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </footer>

    </div>
  );
}
