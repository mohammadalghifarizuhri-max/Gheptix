-- ==========================================
-- SEED DATA GHEPTIX.ID (6 KONSER & VOUCHER)
-- ==========================================
INSERT INTO public.vouchers (code, discount_type, discount_value) VALUES
('GHEPTIX10', 'percentage', 10),
('MALANG2026', 'fixed', 50000);

DO $$
DECLARE
    c1_id UUID; c2_id UUID; c3_id UUID; c4_id UUID; c5_id UUID; c6_id UUID;
BEGIN
    -- C1: Sheila On 7
    INSERT INTO public.concerts (slug, title, category, date_display, time_display, location, age_restriction, badge_bg, description, landscape_theme, portrait_theme, artist_name, tagline)
    VALUES ('c1', 'Sheila On 7 - Tunggu Aku Di Jakarta 2026', 'Pop & Indie', '18 Juli 2026', '19:00 WIB', 'Stadion Utama Gelora Bung Karno, Jakarta', 'All Ages', 'bg-emerald-100 text-emerald-800',
    'Konser tur tunggal terbesar Sheila On 7 di tahun 2026. Menghadirkan panggung spektakuler 360 derajat dengan membawakan lebih dari 25 lagu hits legendaris sepanjang masa dari era 90-an hingga saat ini.',
    'linear-gradient(135deg, #064e3b 0%, #1e3a8a 100%)', 'linear-gradient(180deg, #064e3b 0%, #0f172a 100%)', 'SHEILA ON 7', 'Tunggu Aku Di Jakarta Tour 2026')
    RETURNING id INTO c1_id;

    INSERT INTO public.ticket_tiers (concert_id, name, price, description) VALUES
    (c1_id, 'Festival Standing', 450000, 'Akses area berdiri depan stage utama'),
    (c1_id, 'VIP Standing', 750000, 'Akses eksklusif dekat panggung & fast-track gate'),
    (c1_id, 'VIP Seating (Numbered)', 1250000, 'Kursi bernomor dengan view lurus ke panggung');

    -- C2: Pesta Pora
    INSERT INTO public.concerts (slug, title, category, date_display, time_display, location, age_restriction, badge_bg, description, landscape_theme, portrait_theme, artist_name, tagline)
    VALUES ('c2', 'Pesta Pora Music Festival 2026', 'Festival Musik', '25 - 27 September 2026', '14:00 - 23:30 WIB', 'Gambir Expo Kemayoran, Jakarta', '18+', 'bg-amber-100 text-amber-800',
    'Perayaan festival musik lintas generasi terbesar selama 3 hari berturut-turut! Menampilkan lebih dari 100 musisi nasional, panggung komedi, instalasi seni, dan pasar kuliner nusantara.',
    'linear-gradient(135deg, #78350f 0%, #064e3b 100%)', 'linear-gradient(180deg, #78350f 0%, #111827 100%)', 'PESTA PORA 2026', '3 Days Multi-Genre Music Festival')
    RETURNING id INTO c2_id;

    INSERT INTO public.ticket_tiers (concert_id, name, price, description) VALUES
    (c2_id, '3-Day Pass Festival', 650000, 'Tiket terusan 3 hari ke seluruh panggung regular'),
    (c2_id, 'VIP Festival Pass', 1100000, 'Tiket 3 hari + Akses VIP Lounge & Toilet khusus'),
    (c2_id, 'VIP Seating Tribune', 1800000, 'Tribun VIP terlindung atap dengan snack complimentary');

    -- C3: Hindia & .Feast
    INSERT INTO public.concerts (slug, title, category, date_display, time_display, location, age_restriction, badge_bg, description, landscape_theme, portrait_theme, artist_name, tagline)
    VALUES ('c3', 'Hindia & .Feast: Malam Badai Konser 2026', 'Pop & Indie', '12 Agustus 2026', '18:30 WIB', 'Jatim Expo Convention Hall, Surabaya', '15+', 'bg-blue-100 text-blue-800',
    'Kolaborasi panggung ganda antara Hindia dan .Feast dalam satu rangkaian tur Pulau Jawa. Menyajikan narasi visual yang dramatis dan energi rock indie yang menggelegar.',
    'linear-gradient(135deg, #312e81 0%, #047857 100%)', 'linear-gradient(180deg, #1e1b4b 0%, #064e3b 100%)', 'HINDIA x .FEAST', 'Malam Badai Double-Headliner Tour')
    RETURNING id INTO c3_id;

    INSERT INTO public.ticket_tiers (concert_id, name, price, description) VALUES
    (c3_id, 'Festival Regular', 320000, 'Area standing tengah hall'),
    (c3_id, 'VIP Front Row Standing', 580000, 'Area paling depan barikade panggung'),
    (c3_id, 'VIP Seating Center', 850000, 'Tempat duduk bernomor posisi tengah');

    -- C4: Nadin Amizah
    INSERT INTO public.concerts (slug, title, category, date_display, time_display, location, age_restriction, badge_bg, description, landscape_theme, portrait_theme, artist_name, tagline)
    VALUES ('c4', 'Nadin Amizah: Concert Intimat "Selamat Ulang Tahun"', 'Jazz & Akustik', '05 Oktober 2026', '19:30 WIB', 'Teater Jakarta, Taman Ismail Marzuki', 'All Ages', 'bg-emerald-100 text-emerald-800',
    'Pertunjukan teaterikal dan musik intim yang menyentuh hati dari Nadin Amizah. Didukung oleh orkestra gesek dan tata pencahayaan hangat khas panggung musikal.',
    'linear-gradient(135deg, #065f46 0%, #831843 100%)', 'linear-gradient(180deg, #064e3b 0%, #4c0519 100%)', 'NADIN AMIZAH', 'Intimate Orchestra & Theater Show')
    RETURNING id INTO c4_id;

    INSERT INTO public.ticket_tiers (concert_id, name, price, description) VALUES
    (c4_id, 'Regular Bronze Seat', 350000, 'Tempat duduk balkon teater'),
    (c4_id, 'VIP Silver Seating', 600000, 'Tempat duduk lantai utama tengah'),
    (c4_id, 'VVIP Gold Center + Merchandise', 950000, 'Baris paling depan + Paket CD & Goodie Bag');

    -- C5: Java Jazz
    INSERT INTO public.concerts (slug, title, category, date_display, time_display, location, age_restriction, badge_bg, description, landscape_theme, portrait_theme, artist_name, tagline)
    VALUES ('c5', 'International Java Jazz Festival 2026', 'Jazz & Akustik', '14 - 16 November 2026', '16:00 WIB', 'JIExpo Kemayoran, Jakarta', 'All Ages', 'bg-emerald-100 text-emerald-800',
    'Festival Jazz internasional legendaris edisi ke-21. Menampilkan musisi jazz dunia peraih Grammy Awards bersanding dengan talenta terbaik tanah air.',
    'linear-gradient(135deg, #1e293b 0%, #047857 100%)', 'linear-gradient(180deg, #0f172a 0%, #065f46 100%)', 'JAVA JAZZ 2026', 'Where Jazz Meets The World')
    RETURNING id INTO c5_id;

    INSERT INTO public.ticket_tiers (concert_id, name, price, description) VALUES
    (c5_id, 'Daily Pass (1 Day)', 550000, 'Akses ke 10 panggung dalam 1 hari pilihan'),
    (c5_id, 'Special Show Pass', 950000, 'Termasuk tiket panggung utama artis internasional'),
    (c5_id, 'VIP Platinum 3-Day', 1650000, 'Tiket terusan VIP 3 hari dengan akses lounge khusus');

    -- C6: Soundrenaline
    INSERT INTO public.concerts (slug, title, category, date_display, time_display, location, age_restriction, badge_bg, description, landscape_theme, portrait_theme, artist_name, tagline)
    VALUES ('c6', 'Soundrenaline 2026 Revival Bali', 'Festival Musik', '05 - 06 Desember 2026', '15:00 WIB', 'GWK Cultural Park, Badung, Bali', '18+', 'bg-amber-100 text-amber-800',
    'Kembalinya gelaran musik rock dan alternatif termegah di tebing batu kapur GWK Bali. Suasana sunset tak terlupakan diiringi dentuman musik kualitas dunia.',
    'linear-gradient(135deg, #991b1b 0%, #064e3b 100%)', 'linear-gradient(180deg, #7f1d1d 0%, #022c22 100%)', 'SOUNDRENALINE 2026', 'The Greatest Rock Experience in Bali')
    RETURNING id INTO c6_id;

    INSERT INTO public.ticket_tiers (concert_id, name, price, description) VALUES
    (c6_id, 'Early Bird Festival', 500000, 'Tiket festival 2 hari masuk awal'),
    (c6_id, 'VIP Standing Arena', 900000, 'Area VIP depan panggung tebing'),
    (c6_id, 'VVIP Sunset Suite', 2000000, 'Suite eksklusif ber-AC view panggung & makan gratis');
END $$;
