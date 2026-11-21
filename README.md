# Gheptix.id — Supabase + Next.js (TSX) Concert Ticketing

## Struktur Folder
```text
gheptix-supabase-project/
├── supabase/
│   ├── migrations/
│   │   └── 001_init_schema.sql   # Skema 6 tabel utama + RLS Policies
│   └── seed.sql                  # Data awal 6 konser, kategori tiket, & voucher
├── src/
│   ├── app/
│   │   └── page.tsx              # Entry point halaman utama Next.js
│   ├── components/
│   │   └── GheptixApp.tsx        # Komponen UI & integrasi penuh ke Supabase
│   ├── lib/
│   │   └── supabase.ts           # Konfigurasi Supabase Client
│   └── types/
│       └── gheptix.ts            # TypeScript Interfaces
├── .env.example                  # Template environment variable Supabase
├── package.json                  # Daftar dependensi project
└── README.md                     # Panduan instalasi
```

## Cara Menjalankan
1. Buat project baru di **Supabase Dashboard**.
2. Buka **SQL Editor**, jalankan isi file `supabase/migrations/001_init_schema.sql`, lalu jalankan `supabase/seed.sql`.
3. Salin `.env.example` menjadi `.env.local` dan isi `NEXT_PUBLIC_SUPABASE_URL` serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Jalankan `npm install` lalu `npm run dev`.
