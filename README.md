# Struktur Folder Aplikasi Timer Kontes Kapal Indonesia

Aplikasi ini menggunakan **Next.js (App Router)** dengan struktur folder yang dirancang untuk memisahkan logika (admin, operator) secara modular.

```text
/
├── app/
│   ├── (admin)/                   # Rute khusus untuk Admin
│   │   ├── dashboard/             # Dashboard utama Admin
│   │   │   └── page.tsx           # Halaman statistik, dll
│   │   └── teams/                 # Manajemen Tim (Tambah/Edit)
│   │       └── page.tsx
│   ├── (operator)/                # Rute khusus untuk Operator
│   │   ├── select-team/           # Halaman pemilihan tim dalam divisinya
│   │   │   └── page.tsx
│   │   └── timer/                 # Halaman Timer (Inti Aplikasi)
│   │       └── [teamId]/          # Timer spesifik untuk satu tim
│   │           └── page.tsx       # Memuat komponen timer yang dikendalikan shortcut
│   ├── api/                       # API Routes
│   │   ├── team/                  # Endpoint untuk manajemen tim
│   │   │   └── route.ts           
│   │   └── timer/                 # Endpoint untuk menyimpan histori timer
│   │       └── route.ts           
│   ├── layout.tsx                 # Root layout (Metadata, Providers)
│   └── globals.css                # Global styles (Tailwind)
│
├── components/                    # Reusable UI Components
│   ├── timer/                     # Komponen khusus timer
│   │   ├── TimerDisplay.tsx       # Tampilan angka digital putih di background hitam
│   │   └── KeyboardControls.tsx   # Pembungkus untuk logika shortcut keyboard
│   └── ui/                        # Komponen UI umum (Tombol, Input, dll)
│
├── lib/                           # Utility functions & Singleton
│   ├── prisma.ts                  # Inisialisasi Prisma Client
│   └── utils.ts                   # Utilitas umum (cn, dll)
│
├── prisma/                        # Skema Database
│   └── schema.prisma              # Skema model dan enum (MySQL)
│
└── public/                        # Static assets (Icon, logo)
```

## Prinsip Pengembangan:

1. **Client-Side Timer**: State "Preparation Time" dan "Race Time" serta logika keyboard akan berada murni di Client Component (di dalam `app/(operator)/timer/[teamId]/page.tsx` atau `components/timer`).
2. **Event Selesai**: Hanya ketika timer selesai atau diberhentikan secara eksplisit, hasil (remaining time) dikirim ke `/api/timer` untuk disimpan di tabel history.
3. **Validasi**: Route API memvalidasi enum Divisi (ROV, ASV, dll) agar aman dari input eksternal.

## Skema Alur Saat Ini

Berikut adalah alur sistem yang berjalan saat ini mulai dari antarmuka pengguna (Frontend) hingga ke penyimpanan data (Database):

```mermaid
graph TD
    %% Frontend / Client
    subgraph Frontend [Frontend - Next.js App Router]
        A[Admin Dashboard<br>/admin] -->|Input Data Tim| B(Form Pendaftaran Tim)
        C[Operator Dashboard<br>/operator] -->|Pilih Divisi & Tim| D(Daftar Tim per Divisi)
        D -->|Klik Buka Timer| E[Timer Page<br>/timer/:teamId]
        E -->|Start/Stop/Reset Timer| F((ClientTimer Component))
    end

    %% Backend / API
    subgraph Backend [Backend - API Routes]
        G[POST /api/team]
        H[POST /api/timer]
    end

    %% Database / Prisma
    subgraph Database [Database - MySQL via Prisma]
        I[(Team)]
        J[(PrepHistory)]
        K[(RaceHistory)]
    end

    %% Hubungan Frontend ke Backend
    B -->|Submit data tim<br>(name, institution, division)| G
    F -->|Timer Selesai / Simpan<br>(teamId, remainingTime, type)| H

    %% Hubungan Backend ke Database
    G -->|Insert| I
    H -->|Insert (type: PREP)| J
    H -->|Insert (type: RACE)| K
```

**Penjelasan Alur:**
1. **Admin Dashboard (`/admin`)**: Admin mendaftarkan tim baru dengan mengisi nama, institusi, dan divisi. Data dikirim ke endpoint `POST /api/team` dan disimpan di tabel **Team**.
2. **Operator Dashboard (`/operator`)**: Operator melihat daftar tim berdasarkan divisi. Operator dapat mengklik "Buka Timer" untuk membuka halaman timer khusus untuk tim tersebut.
3. **Timer Page (`/timer/[teamId]`)**: Menampilkan komponen timer (Preparation dan Race). Proses countdown atau pengurangan waktu berjalan di sisi klien (_client-side_).
4. **Menyimpan Riwayat (History)**: Setelah timer selesai atau saat hasil disimpan, sisa waktu (_remaining time_) dikirim ke `POST /api/timer`. Berdasarkan tipenya, data tersebut akan disimpan ke tabel **PrepHistory** atau **RaceHistory**.

