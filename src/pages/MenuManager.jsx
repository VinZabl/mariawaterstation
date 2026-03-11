/* src/pages/MenuManager.jsx */
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Eye, ExternalLink, Plus, Search, X, Trash2 } from 'lucide-react';

export default function MenuManager() {
    const { products, categories, toggleProductCustomerVisibility, showToast } = useStore();
    const [activeCategory, setActiveCategory] = useState('All');

    // Add Item modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalCategory, setModalCategory] = useState('All');

    // Items ON the menu (visible to customers)
    const menuItems = products.filter(p =>
        p.showInCustomer === true &&
        (activeCategory === 'All' || p.category === activeCategory)
    );

    // Items NOT on the menu (available to add)
    const availableItems = useMemo(() => {
        return products.filter(p => {
            const notOnMenu = p.showInCustomer !== true;
            const matchCat = modalCategory === 'All' || p.category === modalCategory;
            const matchSearch = p.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
                p.category.toLowerCase().includes(modalSearch.toLowerCase());
            return notOnMenu && matchCat && matchSearch;
        });
    }, [products, modalCategory, modalSearch]);

    const visibleCount = products.filter(p => p.showInCustomer === true).length;

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-md">
                <div>
                    <h2 className="h3">Customer Menu Manager</h2>
                    <p className="text-muted">Control which products appear on the customer ordering page</p>
                </div>
                <div className="flex gap-sm">
                    <button
                        onClick={() => { setShowAddModal(true); setModalSearch(''); setModalCategory('All'); }}
                        className="btn btn-primary flex items-center gap-sm"
                    >
                        <Plus size={16} />
                        Add Item
                    </button>
                    <a
                        href="/order"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary flex items-center gap-sm"
                        style={{ textDecoration: 'none' }}
                    >
                        <ExternalLink size={16} />
                        Preview
                    </a>
                </div>
            </div>

            {/* Category filter */}
            <div className="flex gap-sm mb-lg" style={{ overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                {['All', ...categories].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.5rem 1rem', borderRadius: '20px' }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Menu grid — only shows items currently ON the customer menu */}
            {menuItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <Eye size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No items on the customer menu yet</p>
                    <p className="text-sm" style={{ margin: '0.25rem 0 1rem' }}>Click <strong>Add Item</strong> to choose products to display</p>
                    <button onClick={() => { setShowAddModal(true); setModalSearch(''); setModalCategory('All'); }} className="btn btn-primary flex items-center gap-sm" style={{ margin: '0 auto' }}>
                        <Plus size={16} /> Add Item
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                    {menuItems.map(product => {
                        const outOfStock = product.stock <= 0;
                        return (
                            <div
                                key={product.id}
                                style={{
                                    background: 'var(--bg-card, white)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1.5px solid ${outOfStock ? 'var(--border-light)' : 'var(--success)'}`,
                                    padding: '1rem',
                                    opacity: outOfStock ? 0.6 : 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                }}
                            >
                                {/* Top row: category + status badge */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                                        {product.category}
                                    </span>
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px',
                                        background: outOfStock ? '#fee2e2' : 'rgba(16,185,129,0.12)',
                                        color: outOfStock ? 'var(--error)' : 'var(--success)',
                                    }}>
                                        {outOfStock ? 'Out of Stock' : '● On Menu'}
                                    </span>
                                </div>

                                {/* Product info */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>{product.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        ₱{Number(product.price).toFixed(2)} &nbsp;·&nbsp; {product.stock} in stock
                                    </p>
                                </div>

                                {/* Footer row: type + remove button */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{product.type}</span>
                                    <button
                                        onClick={() => {
                                            toggleProductCustomerVisibility(product.id);
                                            showToast(`"${product.name}" removed from customer menu.`);
                                        }}
                                        title="Remove from customer menu"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--error)',
                                            background: 'transparent',
                                            color: 'var(--error)',
                                            fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                                        }}
                                    >
                                        <Trash2 size={13} /> Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add Item Modal ── */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ width: 560, maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>

                        {/* Modal header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div>
                                <h3 className="h4" style={{ margin: 0 }}>Add Item to Customer Menu</h3>
                                <p className="text-sm text-muted" style={{ margin: '0.25rem 0 0' }}>
                                    {availableItems.length === 0 && !modalSearch && modalCategory === 'All'
                                        ? 'All inventory items are already on the menu.'
                                        : 'Select items from inventory to show on the customer page'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '1rem 1.5rem 0.5rem', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
                            <div className="search-input-wrapper" style={{ marginBottom: '0.75rem' }}>
                                <Search size={18} className="text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by name or category…"
                                    value={modalSearch}
                                    onChange={e => setModalSearch(e.target.value)}
                                    className="search-input"
                                    autoFocus
                                />
                            </div>
                            {/* Category pills */}
                            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', scrollbarWidth: 'none' }}>
                                {['All', ...categories].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setModalCategory(cat)}
                                        style={{
                                            padding: '0.3rem 0.85rem', borderRadius: '20px', border: 'none',
                                            cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap',
                                            background: modalCategory === cat ? 'var(--primary)' : 'var(--bg-body)',
                                            color: modalCategory === cat ? 'white' : 'var(--text-muted)',
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item list */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {availableItems.length === 0 ? (
                                <p className="text-muted text-center" style={{ padding: '2rem' }}>
                                    {modalSearch || modalCategory !== 'All'
                                        ? 'No products match your search.'
                                        : 'All products are already on the customer menu.'}
                                </p>
                            ) : (
                                availableItems.map(product => {
                                    const outOfStock = product.stock <= 0;
                                    return (
                                        <div
                                            key={product.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border-light)',
                                                opacity: outOfStock ? 0.5 : 1,
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--bg-body)', color: 'var(--text-muted)', padding: '0.1rem 0.4rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                                        {product.category}
                                                    </span>
                                                    {outOfStock && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#fee2e2', color: 'var(--error)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-medium" style={{ margin: 0, fontSize: '0.9rem' }}>{product.name}</p>
                                                <p className="text-sm text-muted" style={{ margin: 0 }}>
                                                    ₱{Number(product.price).toFixed(2)} · {product.stock} in stock
                                                </p>
                                            </div>
                                            <button
                                                disabled={outOfStock}
                                                onClick={() => {
                                                    if (!outOfStock) {
                                                        toggleProductCustomerVisibility(product.id);
                                                        showToast(`"${product.name}" added to menu!`);
                                                    }
                                                }}
                                                style={{
                                                    flexShrink: 0, marginLeft: '1rem',
                                                    padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--primary)',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    fontWeight: 700, fontSize: '0.82rem',
                                                    cursor: outOfStock ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                }}
                                            >
                                                <Plus size={14} /> Add
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal footer */}
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', flexShrink: 0, textAlign: 'right' }}>
                            <button onClick={() => setShowAddModal(false)} className="btn btn-primary">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
