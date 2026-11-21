'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Concert, Order, Voucher } from '@/types/gheptix';

const ADDITIONAL_FEE = 1000;

export default function GheptixApp() {
  // Navigation & Filter States
  const [page, setPage] = useState<'home' | 'detail' | 'checkout' | 'payment' | 'confirmation'>('home');
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transaction States
  const [activeConcert, setActiveConcert] = useState<Concert | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Buyer & Payment States
  const [buyer, setBuyer] = useState({
    fullName: '',
    phone: '',
    email: '',
    ktp: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('bca');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modals & My Orders States
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [showOrdersModal, setShowOrdersModal] = useState<boolean>(false);
  const [ordersHistory, setOrdersHistory] = useState<Order[]>([]);
  const [eoForm, setEoForm] = useState({ organizer_name: '', concert_title: '', estimated_date_location: '' });

  // 1. Fetch Concerts + Ticket Tiers dari Supabase
  useEffect(() => {
    fetchConcerts();
  }, []);

  async function fetchConcerts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('concerts')
      .select(`
        *,
        ticket_tiers (*)
      `)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setConcerts(data as Concert[]);
    }
    setLoading(false);
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        concerts (title, date_display)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setOrdersHistory(data as Order[]);
    }
  }

  // Filter Konser
  const filteredConcerts = concerts.filter((c) => {
    const matchCat = selectedCategory === 'Semua' || c.category === selectedCategory;
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Hitung Subtotal, Diskon, dan Grand Total
  const subtotal =
    activeConcert?.ticket_tiers?.reduce((acc, tier) => {
      const qty = selectedTickets[tier.id] || 0;
      return acc + qty * Number(tier.price);
    }, 0) || 0;

  const totalQty = Object.values(selectedTickets).reduce((acc, q) => acc + q, 0);

  const discountAmount = appliedVoucher
    ? appliedVoucher.discount_type === 'percentage'
      ? (subtotal * Number(appliedVoucher.discount_value)) / 100
      : Number(appliedVoucher.discount_value)
    : 0;

  const grandTotal = Math.max(0, subtotal - discountAmount + ADDITIONAL_FEE);

  // 2. Cek Kode Voucher ke Tabel `vouchers` Supabase
  async function handleApplyVoucher() {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setAppliedVoucher(null);
      setVoucherMessage({ text: 'Kode voucher tidak valid atau telah kadaluarsa.', isError: true });
    } else {
      setAppliedVoucher(data as Voucher);
      setVoucherMessage({ text: `Voucher ${data.code} berhasil diterapkan!`, isError: false });
    }
  }

  // 3. Simpan Order Baru ke Tabel `orders` & `order_items`
  async function handleCreateOrder() {
    if (!activeConcert) return;
    setSubmitting(true);

    const prefixMap: Record<string, string> = {
      bca: '8802938',
      bni: '9880293',
      bri: '1029381',
      cc: '4532000',
      qris: 'QRIS-GHX-',
    };
    const generatedPaymentCode = `${prefixMap[paymentMethod] || '8802938'}${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          concert_id: activeConcert.id,
          buyer_full_name: buyer.fullName,
          buyer_phone: buyer.phone,
          buyer_email: buyer.email,
          buyer_ktp: buyer.ktp,
          voucher_code: appliedVoucher?.code || null,
          subtotal,
          discount_amount: discountAmount,
          additional_fee: ADDITIONAL_FEE,
          grand_total: grandTotal,
          payment_method: paymentMethod,
          payment_code: generatedPaymentCode,
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (orderError || !orderData) {
      alert('Gagal membuat pesanan: ' + orderError?.message);
      setSubmitting(false);
      return;
    }

    const itemsPayload = activeConcert.ticket_tiers!
      .filter((t) => (selectedTickets[t.id] || 0) > 0)
      .map((t) => ({
        order_id: orderData.id,
        ticket_tier_id: t.id,
        quantity: selectedTickets[t.id],
        unit_price: t.price,
        subtotal: selectedTickets[t.id] * Number(t.price),
      }));

    await supabase.from('order_items').insert(itemsPayload);

    setCurrentOrder(orderData as Order);
    setSubmitting(false);
    setPage('confirmation');
  }

  // 4. Simulasi Konfirmasi Pembayaran Selesai
  async function handleConfirmPayment() {
    if (!currentOrder) return;
    setSubmitting(true);

    const redemptionCode = `GHX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        redemption_code: redemptionCode,
      })
      .eq('id', currentOrder.id)
      .select()
      .single();

    if (!error && data) {
      setCurrentOrder(data as Order);
    }
    setSubmitting(false);
  }

  // 5. Submit Pengajuan Event Baru EO
  async function handleEoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('event_submissions').insert([eoForm]);
    if (!error) {
      alert('Pengajuan Event Berhasil Terkirim ke Database!');
      setEoForm({ organizer_name: '', concert_title: '', estimated_date_location: '' });
      setShowAddEventModal(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans flex flex-col justify-between">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 px-6 h-20 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="text-2xl font-extrabold text-emerald-950">
          Gheptix<span className="text-emerald-600">.id</span>
        </button>
        <div className="flex items-center gap-6">
          <button onClick={() => setPage('home')} className="text-sm font-semibold hover:text-emerald-800">
            Homepage
          </button>
          <button
            onClick={() => setShowAddEventModal(true)}
            className="text-sm font-semibold hover:text-emerald-800"
          >
            Add Event
          </button>
          <button
            onClick={() => {
              fetchOrders();
              setShowOrdersModal(true);
            }}
            className="text-sm font-semibold hover:text-emerald-800"
          >
            My Orders
          </button>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-8 flex-grow">
        {/* PAGE 1: HOMEPAGE */}
        {page === 'home' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto">
                {['Semua', 'Pop & Indie', 'Festival Musik', 'Jazz & Akustik'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      selectedCategory === cat
                        ? 'bg-emerald-900 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari konser atau lokasi..."
                className="px-4 py-2 text-sm bg-white border border-stone-300 rounded-xl w-full md:w-72"
              />
            </div>

            {loading ? (
              <p className="text-center py-12 text-stone-500">Memuat daftar konser dari Supabase...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConcerts.map((concert) => {
                  const minPrice = concert.ticket_tiers?.length
                    ? Math.min(...concert.ticket_tiers.map((t) => Number(t.price)))
                    : 0;

                  return (
                    <div
                      key={concert.id}
                      className="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm flex flex-col justify-between"
                    >
                      <div
                        className="aspect-video p-6 text-white flex flex-col justify-between"
                        style={{ background: concert.landscape_theme }}
                      >
                        <div className="flex justify-between">
                          <span className="px-2.5 py-1 bg-black/40 rounded-full text-[10px] font-bold uppercase">
                            {concert.category}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${concert.badge_bg}`}>
                            {concert.age_restriction}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xl font-extrabold">{concert.artist_name}</h4>
                          <p className="text-xs text-stone-200">{concert.tagline}</p>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-extrabold text-stone-900 text-base">{concert.title}</h3>
                          <p className="text-xs text-stone-600 mt-1">{concert.date_display}</p>
                          <p className="text-xs text-stone-500">{concert.location}</p>
                        </div>
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-400 uppercase block">Mulai Dari</span>
                            <span className="text-sm font-extrabold text-emerald-900">
                              Rp {minPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setActiveConcert(concert);
                              setSelectedTickets({});
                              setAppliedVoucher(null);
                              setVoucherMessage(null);
                              setPage('detail');
                            }}
                            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                          >
                            Buy Ticket Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PAGE 2: DETAIL & PILIH TIKET */}
        {page === 'detail' && activeConcert && (
          <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => setPage('home')} className="text-sm font-semibold text-stone-600">
              &larr; Kembali ke Daftar Konser
            </button>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 space-y-4">
              <h2 className="text-2xl font-extrabold">{activeConcert.title}</h2>
              <p className="text-sm text-stone-600">{activeConcert.description}</p>

              <div className="space-y-3 pt-4">
                {activeConcert.ticket_tiers?.map((tier) => {
                  const qty = selectedTickets[tier.id] || 0;
                  return (
                    <div
                      key={tier.id}
                      className="p-4 rounded-2xl border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-stone-900">{tier.name}</h4>
                        <p className="text-xs text-stone-500">{tier.description}</p>
                        <p className="font-extrabold text-emerald-900 mt-1">
                          Rp {Number(tier.price).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setSelectedTickets((prev) => ({
                              ...prev,
                              [tier.id]: Math.max(0, (prev[tier.id] || 0) - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-stone-200 font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold">{qty}</span>
                        <button
                          onClick={() =>
                            setSelectedTickets((prev) => ({
                              ...prev,
                              [tier.id]: Math.min(5, (prev[tier.id] || 0) + 1),
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-emerald-900 text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-stone-100">
                <div>
                  <span className="text-xs text-stone-500 block">Total ({totalQty} Tiket)</span>
                  <span className="text-xl font-extrabold text-emerald-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  disabled={totalQty === 0}
                  onClick={() => setPage('checkout')}
                  className="px-6 py-3 bg-emerald-900 disabled:bg-stone-300 text-white font-bold rounded-xl"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: CHECKOUT FORM & VOUCHER */}
        {page === 'checkout' && activeConcert && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage('payment');
              }}
              className="md:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 space-y-4"
            >
              <h3 className="text-lg font-bold">Buyer Information</h3>
              <input
                required
                placeholder="Nama Lengkap"
                value={buyer.fullName}
                onChange={(e) => setBuyer({ ...buyer, fullName: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border rounded-xl"
              />
              <input
                required
                placeholder="Nomor WhatsApp"
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border rounded-xl"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border rounded-xl"
              />
              <input
                required
                placeholder="Nomor KTP / Passport"
                value={buyer.ktp}
                onChange={(e) => setBuyer({ ...buyer, ktp: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border rounded-xl"
              />
              <button type="submit" className="w-full py-3 bg-emerald-900 text-white font-bold rounded-xl">
                Proceed to Payment
              </button>
            </form>

            <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
              <h3 className="text-lg font-bold">Order Summary</h3>
              <div className="flex gap-2">
                <input
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="Kode: GHEPTIX10"
                  className="flex-1 px-3 py-2 text-sm border rounded-xl uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="px-4 py-2 bg-stone-800 text-white text-xs font-bold rounded-xl"
                >
                  Apply
                </button>
              </div>
              {voucherMessage && (
                <p className={`text-xs ${voucherMessage.isError ? 'text-red-600' : 'text-emerald-600'}`}>
                  {voucherMessage.text}
                </p>
              )}

              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon Voucher</span>
                    <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Additional Fee</span>
                  <span>Rp {ADDITIONAL_FEE.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base border-t pt-2">
                  <span>Grand Total</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 4: PAYMENT METHOD */}
        {page === 'payment' && (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-stone-200 space-y-6">
            <h3 className="text-lg font-bold">Pilih Metode Pembayaran</h3>
            <div className="space-y-3">
              {[
                { id: 'bca', label: 'BCA Virtual Account' },
                { id: 'bni', label: 'BNI Virtual Account' },
                { id: 'bri', label: 'BRI Virtual Account' },
                { id: 'qris', label: 'QRIS Instant' },
              ].map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:border-emerald-700"
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <span className="font-bold text-sm">{m.label}</span>
                </label>
              ))}
            </div>
            <button
              disabled={submitting}
              onClick={handleCreateOrder}
              className="w-full py-3.5 bg-emerald-900 text-white font-bold rounded-xl"
            >
              {submitting ? 'Memproses Pesanan...' : `Process Payment (Rp ${grandTotal.toLocaleString('id-ID')})`}
            </button>
          </div>
        )}

        {/* PAGE 5: CONFIRMATION & REDEMPTION */}
        {page === 'confirmation' && currentOrder && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-6">
            {currentOrder.payment_status === 'pending' ? (
              <>
                <h3 className="text-2xl font-bold">Selesaikan Pembayaran Anda</h3>
                <div className="p-5 bg-stone-50 rounded-2xl border">
                  <p className="text-xs uppercase text-stone-500 font-bold">Kode Pembayaran</p>
                  <p className="text-2xl font-mono font-extrabold text-emerald-950 mt-1">
                    {currentOrder.payment_code}
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={handleConfirmPayment}
                  className="px-6 py-3 bg-emerald-700 text-white font-bold rounded-xl"
                >
                  {submitting ? 'Mengonfirmasi...' : 'Simulasi Konfirmasi Pembayaran Selesai'}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-extrabold text-emerald-950">
                  Pembayaran berhasil, cek email dan whatsapp untuk mendapat kode penukaran tiket.
                </h3>
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-sm">
                  <p className="font-bold text-emerald-900">Kode Penukaran Tiket:</p>
                  <p className="font-mono text-lg font-extrabold bg-white py-2 rounded border">
                    {currentOrder.redemption_code}
                  </p>
                  <p className="text-xs text-stone-600">
                    Dikirim ke <strong>{currentOrder.buyer_email}</strong> &{' '}
                    <strong>{currentOrder.buyer_phone}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setPage('home')}
                  className="px-8 py-3 bg-emerald-900 text-white font-bold rounded-xl"
                >
                  Kembali ke Home
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* ADD EVENT MODAL */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Pengajuan Konser Baru (EO)</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-stone-400 font-bold">
                X
              </button>
            </div>
            <form onSubmit={handleEoSubmit} className="space-y-3">
              <input
                required
                placeholder="Nama Organisasi / EO"
                value={eoForm.organizer_name}
                onChange={(e) => setEoForm({ ...eoForm, organizer_name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border rounded-xl"
              />
              <input
                required
                placeholder="Judul Konser"
                value={eoForm.concert_title}
                onChange={(e) => setEoForm({ ...eoForm, concert_title: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border rounded-xl"
              />
              <input
                required
                placeholder="Estimasi Tanggal & Lokasi"
                value={eoForm.estimated_date_location}
                onChange={(e) => setEoForm({ ...eoForm, estimated_date_location: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border rounded-xl"
              />
              <button type="submit" className="w-full py-2.5 bg-emerald-900 text-white font-bold text-sm rounded-xl">
                Kirim Pengajuan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MY ORDERS MODAL */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">My Orders (Riwayat Tiket)</h3>
              <button onClick={() => setShowOrdersModal(false)} className="text-stone-400 font-bold">
                X
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {ordersHistory.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-6">Belum ada pesanan.</p>
              ) : (
                ordersHistory.map((ord) => (
                  <div key={ord.id} className="p-3 bg-stone-50 rounded-xl border flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs">{ord.concerts?.title || 'Konser'}</h4>
                      <p className="text-[11px] text-stone-500">
                        {ord.buyer_full_name} • Status: {ord.payment_status.toUpperCase()}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-900 px-2 py-1 rounded">
                      {ord.redemption_code || ord.payment_code}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="bg-emerald-950 text-stone-400 text-center py-6 text-xs mt-12">
        Copyright @ 2026 Gheptix. All Reserved.
      </footer>
    </div>
  );
}
