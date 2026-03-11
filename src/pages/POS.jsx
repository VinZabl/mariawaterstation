/* src/pages/POS.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Truck, User, X, CheckCircle, Bell } from 'lucide-react';

export default function POS() {
    const { 
        products, cart, addToCart, removeFromCart, adjustCartQuantity, 
        clearCart, processCheckout, customers, riders, showToast 
    } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerInputRef = useRef(null);

    // Online orders
    const [onlineOrders, setOnlineOrders] = useState([]);
    const [showOnlineOrders, setShowOnlineOrders] = useState(false);
    const [newOrderAlert, setNewOrderAlert] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second for live 'time ago' labels
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeAgo = (dateString) => {
        const past = new Date(dateString);
        const diffInSecs = Math.floor((currentTime - past) / 1000);
        if (diffInSecs < 0) return 'Just now'; // Handle slight client/server drift
        
        if (diffInSecs < 60) return `${diffInSecs}sec ago`;
        const diffInMins = Math.floor(diffInSecs / 60);
        if (diffInMins < 60) return `${diffInMins}min ago`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours}hour ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}days ago`;
    };

    // Poll for online orders every 1 minute
    useEffect(() => {
        const loadOnlineOrders = async (isInitial = false) => {
            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data } = await supabase
                .from('sales')
                .select('*, sale_items(*), deliveries(*)')
                .eq('acknowledged', false)
                .gte('created_at', since)
                .order('created_at', { ascending: false });
            
            if (data) {
                // Determine if any order is new before updating state
                setOnlineOrders(prev => {
                    const hasNew = data.some(newOrder => !prev.find(old => old.id === newOrder.id));
                    if (hasNew && !isInitial) {
                        // Defer side effect to avoid React batching/purity issues
                        setTimeout(() => showToast(`New online order detected!`), 0);
                    }
                    return data;
                });

                // Alert badge depends on 'notified' column
                setNewOrderAlert(data.some(o => !o.notified));
            }
        };

        loadOnlineOrders(true);
        const interval = setInterval(() => loadOnlineOrders(false), 60000);
        return () => clearInterval(interval);
    }, [showToast]);

    // Mark online orders as notified in the DB
    const markOrdersAsNotified = async () => {
        const unnotifiedIds = onlineOrders.filter(o => !o.notified).map(o => o.id);
        if (unnotifiedIds.length > 0) {
            await supabase.from('sales').update({ notified: true }).in('id', unnotifiedIds);
            setOnlineOrders(prev => prev.map(o => ({ ...o, notified: true })));
        }
        setNewOrderAlert(false);
    };

    // Lock parent scroll while on POS page
    useEffect(() => {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.style.overflow = 'hidden';
        }
        return () => {
            if (contentArea) {
                contentArea.style.overflow = '';
            }
        };
    }, []);

    // Checkout State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(1); // 1: Details, 2: Review
    const [customerDetails, setCustomerDetails] = useState({
        customerName: '',
        paymentMethod: 'Cash',
        isDelivery: false,
        riderName: '',
        address: '',
        jugStatus: 'none', // 'none', 'owned', or 'borrowed'
        orderSource: 'pos', // 'pos' | 'online'
    });

    // Handle customer selection from dropdown
    const handleCustomerSelect = (e) => {
        const selectedName = e.target.value;
        const customer = customers.find(c => c.name === selectedName);

        setCustomerDetails(prev => ({
            ...prev,
            customerName: selectedName,
            // Auto-fill address if they check delivery later or if it's already checked
            address: customer ? customer.address : prev.address
        }));
    };

    // Handle delivery toggle
    const handleDeliveryToggle = (e) => {
        const isDeliveryChecked = e.target.checked;
        setCustomerDetails(prev => {
            const updatedDetails = { ...prev, isDelivery: isDeliveryChecked };
            if (isDeliveryChecked && prev.customerName) {
                const customer = customers.find(c => c.name === prev.customerName);
                if (customer) {
                    updatedDetails.address = customer.address;
                }
            } else if (!isDeliveryChecked) {
                // Clear address if delivery is unchecked, unless it's a registered customer's address
                const customer = customers.find(c => c.name === prev.customerName);
                if (!customer || customer.address !== prev.address) {
                    updatedDetails.address = '';
                }
            }
            return updatedDetails;
        });
    };

    // Calculate Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Add tax/fees here if needed

    // Only show products that are marked for POS (showInPos !== false defaults to true)
    const posVisibleProducts = products.filter(p => p.showInPos !== false);

    const filteredProducts = posVisibleProducts.filter(p =>
        (selectedCategory === 'All' || p.category === selectedCategory) &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Categories available in POS based on visible products
    const categories = ['All', ...new Set(posVisibleProducts.map(p => p.category))];

    const handleCheckoutSubmit = () => {
        processCheckout(customerDetails);
        setIsCheckoutOpen(false);
        setCheckoutStep(1);
        setCustomerDetails({
            customerName: '',
            paymentMethod: 'Cash',
            isDelivery: false,
            riderName: '',
            address: '',
            jugStatus: 'none',
            orderSource: 'pos',
        });
        showToast('Transaction Completed Successfully!');
    };

    return (
        <div className="flex pos-layout" style={{ gap: 'var(--space-md)', height: 'calc(100vh - 130px)', overflow: 'hidden', position: 'relative' }}>

            {/* ─── Online Orders Panel ─── */}
            {showOnlineOrders && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowOnlineOrders(false)} />
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, maxWidth: '95vw', background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={18} /> Online Orders
                                {onlineOrders.length > 0 && (
                                    <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '20px', padding: '0.1rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}>{onlineOrders.length}</span>
                                )}
                            </h2>
                            <button onClick={() => setShowOnlineOrders(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {onlineOrders.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem', fontSize: '1rem' }}>No online orders in the last 7 days.</p>
                            ) : onlineOrders.map(order => (
                                <div key={order.id} style={{ borderBottom: '1px solid var(--border-light)', padding: '1.1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {order.customer_name || 'Online Customer'}
                                                {(order.source === 'online' || !order.source) && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(14,165,233,0.12)', color: 'var(--primary)', borderRadius: '10px', padding: '0.1rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Online</span>
                                                )}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                                {order.is_delivery ? '🚚 Delivery' : '🏪 Pickup'} · {order.payment_method} · <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{getTimeAgo(order.created_at || order.date)}</span>
                                            </p>
                                            {(order.deliveries?.[0]?.address) && (
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>📍 {order.deliveries[0].address}</p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>₱{Number(order.total).toFixed(2)}</span>
                                            <button
                                                title="Cancel / Dismiss order"
                                                onClick={async () => {
                                                    await supabase.from('sales').update({ acknowledged: true }).eq('id', order.id);
                                                    setOnlineOrders(prev => prev.filter(o => o.id !== order.id));
                                                }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex', flexShrink: 0 }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Items */}
                                    <div style={{ background: 'var(--bg-body)', borderRadius: '8px', padding: '0.6rem 0.9rem', marginBottom: '0.75rem' }}>
                                        {(order.sale_items ?? []).map((item, i) => (
                                            <p key={i} style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                {item.product_name} <span style={{ color: 'var(--text-muted)' }}>× {item.quantity}</span>
                                            </p>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                // 1. Load items into cart
                                                (order.sale_items ?? []).forEach(item => {
                                                    const product = products.find(p => p.id === item.product_id);
                                                    if (product) {
                                                        for (let i = 0; i < item.quantity; i++) addToCart(product);
                                                    }
                                                });
                                                // 2. Pre-fill all checkout fields from the online order
                                                setCustomerDetails({
                                                    customerName: order.customer_name || '',
                                                    paymentMethod: order.payment_method || 'Cash',
                                                    isDelivery: !!order.is_delivery,
                                                    address: order.deliveries?.[0]?.address || '',
                                                    riderName: order.deliveries?.[0]?.rider || '',
                                                    jugStatus: order.jug_status || 'none',
                                                    orderSource: 'online', // preserve origin
                                                });
                                                // 3. Open checkout at Review step (skip to step 2)
                                                setCheckoutStep(2);
                                                setIsCheckoutOpen(true);
                                                // 4. Close the online orders panel
                                                setShowOnlineOrders(false);
                                            }}
                                            style={{ flex: 2, padding: '0.6rem 0.5rem', border: 'none', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                        >
                                            <ShoppingCart size={15} /> Enter on POS
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await supabase.from('sales').update({ acknowledged: true }).eq('id', order.id);
                                                setOnlineOrders(prev => prev.filter(o => o.id !== order.id));
                                            }}
                                            style={{ flex: 1, padding: '0.6rem 0.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                        >
                                            <CheckCircle size={15} /> Done
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Product Grid Area (Left) */}
            <div className="flex-col gap-md pos-products" style={{ flex: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Search & Categories */}
                <div className="flex-col gap-md bg-surface p-md rounded-lg mb-md" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="search-input-wrapper" style={{ background: 'transparent', flex: 1 }}>
                            <Search size={20} className="text-muted" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        {/* Online orders bell */}
                        <button
                            onClick={() => { setShowOnlineOrders(true); markOrdersAsNotified(); }}
                            title="Online orders"
                            style={{ position: 'relative', background: newOrderAlert ? 'var(--primary)' : 'var(--bg-body)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '0.5rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newOrderAlert ? 'white' : 'var(--text-muted)', flexShrink: 0, transition: 'background 0.2s' }}
                        >
                            <Bell size={18} />
                            {onlineOrders.length > 0 && (
                                <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{onlineOrders.length}</span>
                            )}
                        </button>
                    </div>
                    <div className="flex gap-sm" style={{ overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid  — scrollable */}
                <div className="grid-pos" style={{
                    overflowY: 'auto',
                    height: 'calc(100vh - 390px)',
                    paddingBottom: '1rem',
                    justifyContent: 'start',
                    alignContent: 'start'
                }}>
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="pos-card"
                            onClick={() => addToCart(product)}
                        >
                            <div className="pos-card-content">
                                <div className="flex justify-between items-center mb-sm">
                                    <span className="pos-card-category" style={{ marginBottom: 0 }}>{product.category}</span>
                                    <h4 className="pos-card-price" style={{ marginBottom: 0 }}>₱{product.price}</h4>
                                </div>
                                <h3 className="pos-card-title" style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{product.name}</h3>
                            </div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '0.5rem', userSelect: 'none' }}>Tap to add</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Area (Right) */}
            <div className="card flex-col" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 240px)',
                position: 'sticky',
                top: 0,
                overflow: 'hidden'
            }}>
                <h2 className="h4 flex items-center gap-sm mb-md" style={{ flexShrink: 0 }}>
                    <ShoppingCart size={20} /> Current Order
                </h2>

                {/* Scrollable Items */}
                <div style={{
                    height: 'calc(100vh - 430px)',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    {cart.length === 0 ? (
                        <div className="cart-empty-state">
                            <ShoppingCart size={48} className="text-light" />
                            <div>
                                <h3 className="h4 text-muted">Cart is empty</h3>
                                <p className="text-sm text-light">Select items to start an order</p>
                            </div>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex-col p-md gap-sm" style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium" style={{ fontSize: '0.95rem' }}>{item.name}</p>
                                        <p className="text-sm text-muted">₱{item.price} each</p>
                                    </div>
                                    <p className="font-bold text-primary">₱{item.price * item.quantity}</p>
                                </div>

                                <div className="flex justify-between items-center mt-xs">
                                    <div className="flex items-center gap-sm">
                                        <button onClick={() => adjustCartQuantity(item.id, -1)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', visibility: item.quantity > 1 ? 'visible' : 'hidden' }}><Minus size={16} /></button>
                                        <span className="font-bold text-sm" style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button onClick={() => adjustCartQuantity(item.id, 1)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Plus size={16} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals Section */}
                <div style={{ flexShrink: 0, borderTop: '2px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="flex justify-between mb-sm">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-lg">
                        <span className="h3">Total</span>
                        <span className="h3 text-primary">₱{total.toFixed(2)}</span>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem' }}
                        disabled={cart.length === 0}
                        onClick={() => { setCheckoutStep(1); setIsCheckoutOpen(true); }}
                    >
                        Checkout
                    </button>
                </div>
            </div>

            {/* Checkout Modal */}
            {isCheckoutOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card" style={{ width: '640px', maxWidth: '92%' }}>

                        {/* Step 1: Walk-In or Delivery */}
                        {checkoutStep === 1 && (
                            <div className="flex-col gap-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="h2 mb-sm">How is this order?</h3>
                                        <p className="text-muted mb-md" style={{ fontSize: '1rem' }}>Select the order type to continue.</p>
                                    </div>
                                    <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                                        <X size={22} />
                                    </button>
                                </div>

                                <div className="flex gap-md">
                                    <button
                                        className="btn btn-secondary"
                                        style={{ flex: 1, height: '160px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}
                                        onClick={() => { setCustomerDetails({ ...customerDetails, isDelivery: false }); setCheckoutStep(2); }}
                                    >
                                        <span className="font-bold" style={{ fontSize: '1.25rem' }}>Walk-In</span>
                                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Customer takes order now</span>
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ flex: 1, height: '160px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', border: '2px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}
                                        onClick={() => { setCustomerDetails({ ...customerDetails, isDelivery: true }); setCheckoutStep(2); }}
                                    >
                                        <span className="font-bold" style={{ fontSize: '1.25rem' }}>Delivery</span>
                                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Assign rider &amp; address</span>
                                    </button>
                                </div>

                                <div className="flex justify-end mt-sm" style={{ display: 'none' }}></div>
                            </div>
                        )}

                        {/* Step 2: Order Details */}
                        {checkoutStep === 2 && (
                            <div className="flex-col gap-md">
                                <div className="flex justify-between items-center mb-sm" style={{ position: 'relative' }}>
                                    <div className="flex items-center gap-sm">
                                        <button onClick={() => setCheckoutStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.4rem', padding: '0.25rem', fontWeight: 400, lineHeight: 1, marginRight: '0.5rem' }}>&lt;</button>
                                        <div>
                                            <h3 className="h2" style={{ marginBottom: '0.1rem' }}>
                                                {customerDetails.isDelivery ? 'Delivery' : 'Walk-In'}
                                            </h3>
                                            <p className="text-muted" style={{ fontSize: '0.9rem' }}>Fill in the details to confirm the order.</p>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', paddingRight: '2.5rem' }}>
                                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Total</p>
                                        <p style={{ fontSize: '2rem', lineHeight: 1.1, fontWeight: 700, color: '#0ea5e9' }}>₱{total}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCheckoutOpen(false)}
                                        style={{
                                            position: 'absolute',
                                            top: '-0.5rem',
                                            right: '-1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            padding: '0.5rem'
                                        }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div style={{ marginBottom: '1rem', position: 'relative' }} ref={customerInputRef}>
                                    <label className="font-medium mb-sm block" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Name</label>
                                    <input
                                        className="input"
                                        value={customerDetails.customerName}
                                        onChange={e => {
                                            handleCustomerSelect(e);
                                            setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                                        placeholder="Type or select customer..."
                                        style={{ fontSize: '1rem', paddingRight: '2.5rem' }}
                                        autoComplete="off"
                                    />
                                    {/* Dropdown arrow — solid triangle matching native selects */}
                                    <span style={{ position: 'absolute', right: '0.75rem', top: '60%', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1 }}>
                                        ▼
                                    </span>

                                    {/* Custom dropdown panel */}
                                    {showCustomerDropdown && (
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                            background: '#ffffff', border: '1px solid #d1d5db',
                                            borderRadius: 'var(--radius-md)', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                                            zIndex: 2000, maxHeight: '220px', overflowY: 'auto'
                                        }}>
                                            {/* Filtered customer list */}
                                            {customers
                                                .filter(c => c.name.toLowerCase().includes(customerDetails.customerName.toLowerCase()))
                                                .map(c => (
                                                    <div
                                                        key={c.id}
                                                        onMouseDown={() => {
                                                            setCustomerDetails(prev => ({ ...prev, customerName: c.name, address: c.address || prev.address }));
                                                            setShowCustomerDropdown(false);
                                                        }}
                                                        style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px dashed var(--border-light)' }}
                                                        className="hover-bg"
                                                    >
                                                        <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{c.name}</p>
                                                        {c.address && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{c.address}</p>}
                                                    </div>
                                                ))
                                            }
                                            {customers.filter(c => c.name.toLowerCase().includes(customerDetails.customerName.toLowerCase())).length === 0 && customerDetails.customerName && (
                                                <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No match — will save as "{customerDetails.customerName}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-md" style={{ marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="font-medium mb-sm block" style={{ fontSize: '1rem' }}>Jug Status</label>
                                        <select
                                            className="input"
                                            value={customerDetails.jugStatus}
                                            onChange={e => setCustomerDetails({ ...customerDetails, jugStatus: e.target.value })}
                                        >
                                            <option value="none">None</option>
                                            <option value="owned">Customer Owned Container</option>
                                            <option value="borrowed">Borrowed Container</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="font-medium mb-sm block" style={{ fontSize: '1rem' }}>Payment Method</label>
                                        <select
                                            className="input"
                                            value={customerDetails.paymentMethod}
                                            onChange={e => setCustomerDetails({ ...customerDetails, paymentMethod: e.target.value })}
                                        >
                                            <option>Cash</option>
                                            <option>GCash</option>
                                        </select>
                                    </div>
                                </div>

                                {customerDetails.isDelivery && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(14,165,233,0.02))',
                                        border: '1px solid rgba(14,165,233,0.25)',
                                        borderTop: '3px solid var(--primary)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1.25rem',
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem'
                                    }}>
                                        {/* Section Header */}
                                        <div className="flex items-center gap-sm">
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'var(--primary)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Truck size={16} color="white" />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Delivery Details</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Fill in the destination and assign a rider</p>
                                            </div>
                                        </div>

                                        {/* Delivery Address */}
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                Delivery Address
                                            </label>
                                            <input
                                                className="input"
                                                placeholder="Enter full delivery address..."
                                                value={customerDetails.address}
                                                onChange={e => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                                                style={{ fontSize: '0.95rem' }}
                                            />
                                        </div>

                                        {/* Assign Rider */}
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                Assign Rider
                                            </label>
                                            <select
                                                className="input"
                                                value={customerDetails.riderName}
                                                onChange={e => setCustomerDetails({ ...customerDetails, riderName: e.target.value })}
                                                style={{ fontSize: '0.95rem' }}
                                            >
                                                <option value="" disabled hidden>Select active rider...</option>
                                                {riders.filter(r => r.status === 'Active').map(r => (
                                                    <option key={r.id} value={r.name}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}


                                <div className="flex justify-center mt-sm">
                                    <button className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem', fontWeight: 600 }} onClick={handleCheckoutSubmit}>Confirm Payment</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
