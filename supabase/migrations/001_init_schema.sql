-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL CONCERTS
CREATE TABLE public.concerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Pop & Indie', 'Festival Musik', 'Jazz & Akustik')),
    date_display TEXT NOT NULL,
    time_display TEXT NOT NULL,
    location TEXT NOT NULL,
    age_restriction TEXT NOT NULL DEFAULT 'All Ages',
    badge_bg TEXT DEFAULT 'bg-emerald-100 text-emerald-800',
    description TEXT NOT NULL,
    landscape_theme TEXT NOT NULL,
    portrait_theme TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    tagline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL TICKET TIERS
CREATE TABLE public.ticket_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concert_id UUID NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    description TEXT,
    quota INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL VOUCHERS
CREATE TABLE public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL ORDERS
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    concert_id UUID NOT NULL REFERENCES public.concerts(id) ON DELETE RESTRICT,
    buyer_full_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_ktp TEXT NOT NULL,
    voucher_code TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    additional_fee NUMERIC(12, 2) DEFAULT 1000,
    grand_total NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    payment_code TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired')),
    redemption_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    ticket_tier_id UUID NOT NULL REFERENCES public.ticket_tiers(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 5),
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 6. TABEL EVENT SUBMISSIONS (FORM ADD EVENT EO)
CREATE TABLE public.event_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_name TEXT NOT NULL,
    concert_title TEXT NOT NULL,
    estimated_date_location TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read concerts" ON public.concerts FOR SELECT USING (true);
CREATE POLICY "Public read ticket_tiers" ON public.ticket_tiers FOR SELECT USING (true);
CREATE POLICY "Public read active vouchers" ON public.vouchers FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can submit events" ON public.event_submissions FOR INSERT WITH CHECK (true);
