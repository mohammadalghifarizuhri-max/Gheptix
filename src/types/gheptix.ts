export type ConcertCategory = 'Pop & Indie' | 'Festival Musik' | 'Jazz & Akustik';

export interface TicketTier {
  id: string;
  concert_id: string;
  name: string;
  price: number;
  description: string;
  quota: number;
}

export interface Concert {
  id: string;
  slug: string;
  title: string;
  category: ConcertCategory;
  date_display: string;
  time_display: string;
  location: string;
  age_restriction: string;
  badge_bg: string;
  description: string;
  landscape_theme: string;
  portrait_theme: string;
  artist_name: string;
  tagline: string;
  ticket_tiers?: TicketTier[];
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  concert_id: string;
  buyer_full_name: string;
  buyer_phone: string;
  buyer_email: string;
  buyer_ktp: string;
  voucher_code?: string | null;
  subtotal: number;
  discount_amount: number;
  additional_fee: number;
  grand_total: number;
  payment_method: string;
  payment_code: string;
  payment_status: 'pending' | 'paid' | 'expired';
  redemption_code?: string | null;
  created_at: string;
  concerts?: {
    title: string;
    date_display: string;
  };
}

export interface EventSubmission {
  organizer_name: string;
  concert_title: string;
  estimated_date_location: string;
}
