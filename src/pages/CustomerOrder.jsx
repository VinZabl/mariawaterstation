/* src/pages/CustomerOrder.jsx */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, X, Droplets, Package, ChevronDown } from 'lucide-react';

const LOGO_TEXT = 'Maria\'s Water Station';
const ACCENT = '#3b82f6';

function usePublicProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [{ data: prods }, { data: cats }] = await Promise.all([
                supabase.from('products').select('*').eq('show_in_customer', true).gt('stock', 0).order('name'),
                supabase.from('categories').select('name').order('name'),
            ]);
            setProducts(prods ?? []);
            setCategories(cats?.map(c => c.name) ?? []);
            setLoading(false);
        };
        load();
    }, []);

    return { products, categories, loading };
}

export default function CustomerOrder() {
    const { products, categories, loading } = usePublicProducts();
    const [activeCategory, setActiveCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        customerName: '', address: '', paymentMethod: 'Cash', isDelivery: false, jugStatus: 'none',
    });

    // Splash phases: 'text' → 'loading' → 'out' → done
    const [splashPhase, setSplashPhase] = useState('text');
    const [splashDone, setSplashDone] = useState(false);
    const dataReady = !loading; // track when Supabase has responded

    useEffect(() => {
        // After 1.4s, transition from brand text → loading spinner
        const toLoading = setTimeout(() => setSplashPhase('loading'), 1400);
        return () => clearTimeout(toLoading);
    }, []);

    useEffect(() => {
        // Once we're in loading phase AND data is ready, start fade-out
        if (splashPhase === 'loading' && dataReady) {
            // Small grace period so spinner is visible for at least a beat
            const toOut = setTimeout(() => setSplashPhase('out'), 600);
            return () => clearTimeout(toOut);
        }
        if (splashPhase === 'out') {
            const toDone = setTimeout(() => setSplashDone(true), 700);
            return () => clearTimeout(toDone);
        }
    }, [splashPhase, dataReady]);

    const filtered = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

    const addToCart = (product) => {
        setCart(prev => {
            const ex = prev.find(i => i.id === product.id);
            if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
        });
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const changeQty = (id, delta) => {
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setSubmitting(true);

        const total = cartTotal;
        const { data: saleData, error: saleError } = await supabase.from('sales').insert({
            customer_name: form.customerName || 'Online Customer',
            total,
            payment_method: form.paymentMethod,
            jug_status: form.jugStatus,
            is_delivery: form.isDelivery,
            source: 'online',
        }).select().single();

        if (saleError) { setSubmitting(false); return; }

        const saleItems = cart.map(item => ({
            sale_id: saleData.id,
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: item.qty,
        }));
        await supabase.from('sale_items').insert(saleItems);

        // Reduce stock
        await Promise.all(cart.map(item =>
            supabase.rpc ? null : supabase.from('products')
                .select('stock')
                .eq('id', item.id)
                .single()
                .then(({ data }) => {
                    if (data) {
                        return supabase.from('products').update({ stock: data.stock - item.qty }).eq('id', item.id);
                    }
                })
        ));

        if (form.isDelivery) {
            await supabase.from('deliveries').insert({
                sale_id: saleData.id,
                customer_name: form.customerName || 'Walk-in customer',
                address: form.address || 'N/A',
                rider: 'Unassigned',
                status: 'Pending',
            });
        }

        setSubmitting(false);
        setOrderSuccess(true);
        setCart([]);
        setForm({ customerName: '', address: '', paymentMethod: 'Cash', isDelivery: false, jugStatus: 'none' });
        setCheckoutOpen(false);
    };

    const categoryIcons = { Water: <Droplets size={14} />, Container: <Package size={14} /> };

    if (!splashDone) return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: '#ffffff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Google Sans', 'Product Sans', Inter, system-ui, sans-serif",
            transition: 'opacity 0.7s ease',
            opacity: splashPhase === 'out' ? 0 : 1,
            pointerEvents: splashPhase === 'out' ? 'none' : 'all',
        }}>
            {/* Subtle glow */}
            <div style={{
                position: 'absolute',
                width: 500, height: 500,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
                filter: 'blur(50px)',
            }} />

            {/* Brand text */}
            <div style={{
                position: 'relative',
                textAlign: 'center',
                animation: 'customerSplashIn 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}>
                <p style={{
                    fontSize: 'clamp(2rem, 8vw, 3.6rem)',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: 0,
                    lineHeight: 1.05,
                    letterSpacing: '-0.01em',
                }}>
                    Maria's
                </p>
                <p style={{
                    fontSize: 'clamp(2rem, 8vw, 3.6rem)',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: '0 0 0.6rem',
                    lineHeight: 1.05,
                    letterSpacing: '-0.01em',
                }}>
                    Water Station
                </p>
                <p style={{
                    fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)',
                    fontWeight: 600,
                    color: ACCENT,
                    margin: 0,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                }}>
                    MICIT.
                </p>
            </div>

            {/* Loading spinner — fades in after text phase */}
            <div style={{
                marginTop: '2.5rem',
                transition: 'opacity 0.5s ease',
                opacity: splashPhase === 'loading' || splashPhase === 'out' ? 1 : 0,
                position: 'relative',
            }}>
                <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    border: `2.5px solid rgba(59,130,246,0.2)`,
                    borderTopColor: ACCENT,
                    animation: 'spin 0.8s linear infinite',
                }} />
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');
                @keyframes customerSplashIn {
                    from { opacity: 0; transform: translateY(18px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );


    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: cartCount > 0 ? 90 : 0 }}>
            {/* ── Header ── */}
            <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'white', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Droplets size={24} color={ACCENT} />
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{LOGO_TEXT}</span>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        style={{ position: 'relative', background: ACCENT, color: 'white', border: 'none', borderRadius: 40, padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
                    >
                        <ShoppingCart size={18} />
                        Cart
                        {cartCount > 0 && (
                            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, position: 'absolute', top: -6, right: -6 }}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <div style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #1d4ed8 100%)`, color: 'white', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 1rem', letterSpacing: '0.02em' }}>WE ARE OPEN DAILY.</h1>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', flexWrap: 'nowrap', opacity: 0.92 }}>
                    <div>
                        <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', opacity: 0.75 }}>CALL US</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>09216888006 | 09278765309</p>
                    </div>
                    <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                    <div>
                        <p style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', opacity: 0.75 }}>VISIT US</p>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>25 National Road Bigaa</p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

                {/* ── Category Tabs ── */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {['All', ...categories].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '0.45rem 1.1rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
                                background: activeCategory === cat ? ACCENT : 'white',
                                color: activeCategory === cat ? 'white' : '#64748b',
                                boxShadow: activeCategory === cat ? `0 2px 8px ${ACCENT}44` : '0 1px 3px rgba(0,0,0,0.08)',
                            }}
                        >
                            {categoryIcons[cat] && <span style={{ marginRight: 4 }}>{categoryIcons[cat]}</span>}
                            {cat}
                        </button>
                    ))}
                </div>

                {/* ── Product Grid ── */}
                {filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>No products available in this category.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                        {filtered.map(p => {
                            const inCart = cart.find(i => i.id === p.id);
                            return (
                                <div key={p.id} style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Droplets size={36} color={ACCENT} opacity={0.5} />
                                    </div>
                                    <div style={{ padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <span style={{ fontSize: '0.65rem', color: ACCENT, fontWeight: 600, background: '#eff6ff', borderRadius: 5, padding: '0.1rem 0.4rem', alignSelf: 'flex-start' }}>{p.category}</span>
                                        <h3 style={{ margin: '0.35rem 0 0.15rem', fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{p.name}</h3>
                                        <p style={{ color: ACCENT, fontWeight: 800, fontSize: '0.95rem', margin: '0 0 0.6rem' }}>₱{Number(p.price).toFixed(2)}</p>
                                        {/* Button always at bottom */}
                                        <div style={{ marginTop: 'auto' }}>
                                            {inCart ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <button onClick={() => changeQty(p.id, -1)} style={{ width: 28, height: 28, border: 'none', borderRadius: 7, background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                                                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.85rem' }}>{inCart.qty}</span>
                                                    <button onClick={() => changeQty(p.id, 1)} style={{ width: 28, height: 28, border: 'none', borderRadius: 7, background: ACCENT, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                                                    <button onClick={() => removeFromCart(p.id)} style={{ width: 28, height: 28, border: 'none', borderRadius: 7, background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}><Trash2 size={12} /></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(p)}
                                                    style={{ width: '100%', padding: '0.5rem 0.4rem', border: 'none', borderRadius: 9, background: ACCENT, color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                                                >
                                                    <Plus size={13} /> Add to Cart
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Sticky Checkout Bar ── */}
            {cartCount > 0 && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150,
                    background: 'white', borderTop: '1px solid #e2e8f0',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
                    padding: '1rem 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</p>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>₱{cartTotal.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setCart([])}
                            style={{
                                background: 'white', color: '#ef4444', border: '2px solid #ef4444', borderRadius: 14,
                                padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.95rem',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setCheckoutOpen(true)}
                            style={{
                                background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`,
                                color: 'white', border: 'none', borderRadius: 14,
                                padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '0.95rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: `0 4px 14px ${ACCENT}55`, maxWidth: 220, justifyContent: 'center',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <ShoppingCart size={18} />
                            Proceed to Order
                        </button>
                    </div>
                </div>
            )}

            {/* ── Cart Drawer ── */}
            {isCartOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={() => setIsCartOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 360, maxWidth: '90vw', background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={20} /> Your Cart</h2>
                            <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={22} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                            {cart.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '2rem' }}>Your cart is empty.</p>
                            ) : cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{item.name}</p>
                                        <p style={{ margin: 0, color: ACCENT, fontWeight: 700, fontSize: '0.9rem' }}>₱{(item.price * item.qty).toFixed(2)}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <button onClick={() => changeQty(item.id, -1)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: '#f1f5f9', cursor: 'pointer' }}><Minus size={12} /></button>
                                        <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                                        <button onClick={() => changeQty(item.id, 1)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: ACCENT, color: 'white', cursor: 'pointer' }}><Plus size={12} /></button>
                                        <button onClick={() => removeFromCart(item.id)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700, fontSize: '1.05rem' }}>
                                    <span>Total</span>
                                    <span style={{ color: ACCENT }}>₱{cartTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => { setIsCartOpen(false); setCheckoutOpen(true); }}
                                    style={{ width: '100%', padding: '0.8rem', background: ACCENT, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Checkout Modal ── */}
            {checkoutOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 20, width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 700 }}>Place Your Order</h2>
                            <button onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Your Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} placeholder="e.g. Juan dela Cruz" style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box' }} required />
                            </div>

                            {/* Delivery Mode */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Order Type <span style={{ color: '#ef4444' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[
                                        { val: false, label: 'Pick Up', desc: 'I will pick up my order' },
                                        { val: true, label: 'Delivery', desc: 'Deliver to my address' },
                                    ].map(opt => (
                                        <button
                                            key={String(opt.val)}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, isDelivery: opt.val }))}
                                            style={{
                                                flex: 1, padding: '0.75rem 0.5rem', borderRadius: 12,
                                                border: `2px solid ${form.isDelivery === opt.val ? ACCENT : '#e2e8f0'}`,
                                                background: form.isDelivery === opt.val ? '#eff6ff' : 'white',
                                                color: form.isDelivery === opt.val ? ACCENT : '#64748b',
                                                fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <div style={{ fontSize: '0.95rem' }}>{opt.label}</div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 400, marginTop: '0.2rem', opacity: 0.8 }}>{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {form.isDelivery && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Delivery Address <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Your full address" style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box' }} required />
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Payment Method</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" disabled
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: `2px solid ${ACCENT}`, background: '#eff6ff', color: ACCENT, fontWeight: 700, cursor: 'default' }}>
                                        {form.isDelivery ? 'Cash on Delivery' : 'Cash'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>Container</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[{ val: 'none', label: 'None' }, { val: 'owned', label: 'I have one' }, { val: 'borrowed', label: 'Borrow from you' }].map(o => (
                                        <button key={o.val} type="button" onClick={() => setForm(p => ({ ...p, jugStatus: o.val }))}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: 10, border: `2px solid ${form.jugStatus === o.val ? ACCENT : '#e2e8f0'}`, background: form.jugStatus === o.val ? '#eff6ff' : 'white', color: form.jugStatus === o.val ? ACCENT : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Order summary */}
                            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem' }}>
                                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#1e293b' }}>Order Summary</p>
                                {cart.map(i => (
                                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                        <span>{i.name} × {i.qty}</span>
                                        <span>₱{(i.price * i.qty).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e293b' }}>
                                    <span>Total</span>
                                    <span style={{ color: ACCENT }}>₱{cartTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.85rem', background: submitting ? '#94a3b8' : ACCENT, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                                {submitting ? 'Placing Order…' : `Place Order · ₱${cartTotal.toFixed(2)}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Success Screen ── */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', textAlign: 'center', maxWidth: 360, width: '100%' }}>
                        <CheckCircle size={60} color="#10b981" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Order Placed!</h2>
                        <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>Thank you for your order. We'll prepare it right away!</p>
                        <button onClick={() => setOrderSuccess(false)} style={{ width: '100%', padding: '0.8rem', background: ACCENT, color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
