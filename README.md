<div align="center">

# 🚢 Timer Kontes Kapal Indonesia

**Sistem manajemen timer berbasis web untuk kompetisi kapal robotik**
Dibangun dengan Next.js 15 · Prisma ORM · MySQL · TailwindCSS

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38BDF8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## 📖 Tentang Proyek

**Timer Kontes Kapal Indonesia (KKI)** adalah sistem manajemen waktu berbasis web yang dirancang khusus untuk mendukung pelaksanaan kompetisi kapal robotik. Sistem ini memungkinkan operator lapangan mengelola timer setiap tim secara real-time, sementara admin memiliki kontrol penuh atas seluruh data tim, operator, dan riwayat perlombaan.

---

## ✨ Fitur Utama

### 🎯 Timer Real-time
- **Countdown (Mundur)** — Hitung mundur dari target waktu
- **Count-up (Maju)** — Hitung dari 0 ke atas
- **Stopwatch** — Mode stopwatch bebas
- Animasi countdown **3-2-1-GO!** sebelum sesi dimulai
- Auto-save riwayat waktu ke database saat timer selesai

### ⌨️ Pintasan Keyboard

| Tombol | Fungsi |
|--------|--------|
| `Space` | Mulai / Jeda timer |
| `S` | Buka konfigurasi pertandingan |
| `F` | Selesaikan & simpan waktu |
| `H` | Lihat riwayat tim aktif |
| `R` | Reset timer |
| `Esc` | Tutup panel |

### 👤 Role & Akses

| Role | Akses |
|------|-------|
| **Admin** | Kelola tim, operator, lihat semua riwayat, export PDF |
| **Operator** | Jalankan timer untuk tim di divisinya |

### 🏆 Divisi Kompetisi
- **ROV** — Remotely Operated Vehicle
- **ASV** — Autonomous Surface Vehicle
- **ERC** — Electric Remote Control
- **FERC** — Free Electric Remote Control
- **IDK** — Inovasi Desain dan Konstruksi
- **ISPK** — Inovasi Sistem Permesinan dan Kelistrikan

### 📊 Fitur Admin
- Manajemen tim (tambah, edit, hapus)
- Manajemen operator per divisi
- Riwayat lengkap sesi Persiapan & Race
- **Export laporan ke PDF** (jsPDF + AutoTable)

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.9 |
| Database | MySQL + Prisma ORM 5.22 |
| Styling | TailwindCSS 4.1 + tw-animate-css |
| Auth | Session-based (bcryptjs) |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| PDF Export | jsPDF + jspdf-autotable |
| AI | Google Gemini API |

---

## 📁 Struktur Proyek

```
timer-kontes-kapal-indonesia/
├── app/
│   ├── page.tsx                  # Halaman utama (panduan & shortcut)
│   ├── login/                    # Halaman login
│   ├── admin/
│   │   ├── page.tsx              # Dashboard admin
│   │   ├── teams/                # Manajemen tim
│   │   ├── operators/            # Manajemen operator
│   │   └── history/              # Riwayat semua sesi
│   ├── operator/
│   │   └── dashboard/            # Dashboard operator + timer
│   └── api/
│       ├── admin/operators/      # API CRUD operator
│       ├── teams/[id]/history/   # API riwayat per tim
│       └── timer/                # API kontrol timer
├── components/
│   ├── admin/                    # Komponen UI admin
│   ├── operator/                 # Komponen UI operator
│   ├── timer/                    # Komponen ClientTimer
│   ├── layout/                   # SidebarLayout
│   └── ui/                       # Komponen UI reusable
├── prisma/
│   └── schema.prisma             # Skema database
├── lib/                          # Utility & helper
├── hooks/                        # Custom React hooks
└── middleware.ts                 # Auth middleware
```

---

## 🗄️ Skema Database

```prisma
// Role pengguna
enum Role       { ADMIN | OPERATOR }

// Divisi kompetisi
enum Division   { ROV | ASV | ERC | FERC | IDK | ISPK }

// Status tim
enum TeamStatus { IDLE | PREPARING | RACING }

model User         // Akun admin & operator
model Team         // Data tim peserta
model PrepHistory  // Riwayat sesi persiapan
model RaceHistory  // Riwayat sesi race
```

---

## 🚀 Instalasi & Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/ikiiky67-cmyk/timer-kontes-kapal-indonesia.git
cd timer-kontes-kapal-indonesia
```

### 2. Install Dependencies
```bash
npm install
# atau
bun install
```

### 3. Konfigurasi Environment
```bash
cp .env.example .env
```

Edit file `.env`:
```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### 4. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka **http://localhost:3000** di browser.

---

## 🌐 Deployment (VPS / Cloud)

### Prasyarat Server
- Node.js >= 18
- MySQL 8.0+
- PM2 (process manager)

### Langkah Deploy
```bash
# Build production
npm run build

# Jalankan dengan PM2
pm2 start npm --name "timer-kki" -- start
pm2 save && pm2 startup
```

### Environment Production
```env
DATABASE_URL="mysql://user:pass@localhost:3306/timer_kki"
APP_URL="https://yourdomain.com"
GEMINI_API_KEY="your_key"
```

> 💡 Disarankan menggunakan **Cloudflare CDN** untuk performa optimal di seluruh Indonesia.

---

## 📋 Alur Penggunaan

```
Admin login
  └─► Tambah Tim & Operator
        └─► Operator login
              └─► Pilih Tim → Konfigurasi Timer
                    └─► Jalankan Sesi PERSIAPAN
                          └─► Jalankan Sesi RACE
                                └─► Waktu tersimpan otomatis
                                      └─► Admin lihat Riwayat & Export PDF
```

---

## 🔒 Autentikasi

- Login menggunakan **username & password** (hash bcrypt)
- **Middleware** melindungi semua route `/admin` dan `/operator`
- Operator hanya dapat mengakses divisi yang ditugaskan

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan **Kontes Kapal Indonesia (KKI)**.

---

<div align="center">

Dikembangkan dengan ❤️ untuk kompetisi kapal robotik Indonesia 🚢

</div>