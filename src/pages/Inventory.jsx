/* src/pages/Inventory.jsx */
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Search, Edit, Trash2, FolderPlus, X } from 'lucide-react';

const EMPTY_FORM = {
    name: '', price: '', stock: '', category: '', type: 'refill', showInPos: true, showInCustomer: false
};

export default function Inventory() {
    const {
        products, addProduct, updateProduct, deleteProduct,
        categories, addCategory, toggleProductPosVisibility,
        showToast
    } = useStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryNav, setSelectedCategoryNav] = useState('All');

    // Add / Edit product modal
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); // null = adding new
    const [formData, setFormData] = useState(EMPTY_FORM);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState(null); // product to delete

    // Category modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // ─── Helpers ────────────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({ ...EMPTY_FORM, category: categories[0] || '' });
        setIsProductModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            type: product.type,
            showInPos: product.showInPos,
            showInCustomer: product.showInCustomer,
        });
        setIsProductModalOpen(true);
    };

    const closeProductModal = () => {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        setFormData(EMPTY_FORM);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleProductSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock || 0),
        };

        if (editingProduct) {
            updateProduct(editingProduct.id, payload);
            showToast('Product updated successfully!');
        } else {
            addProduct(payload);
            showToast('New product added!');
        }
        closeProductModal();
    };

    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            deleteProduct(deleteTarget.id);
            showToast('Product deleted.');
        }
        setDeleteTarget(null);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        const cat = newCategoryName.trim();
        if (cat && !categories.includes(cat)) {
            addCategory(cat);
            setSelectedCategoryNav(cat);
            showToast(`Category "${cat}" added!`);
        }
        setIsCategoryModalOpen(false);
        setNewCategoryName('');
    };

    const quickAssignCategory = async (product, newCategory) => {
        if (newCategory === product.category) return;
        await updateProduct(product.id, { ...product, category: newCategory });
    };

    // ─── Filtering ──────────────────────────────────────────────────────────
    const filteredProducts = products.filter(p => {
        let matchesCategory = false;
        if (selectedCategoryNav === 'All') matchesCategory = true;
        else if (selectedCategoryNav === 'Showing on POS') matchesCategory = p.showInPos !== false;
        else matchesCategory = p.category === selectedCategoryNav;

        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // ─── Shared input style ─────────────────────────────────────────────────
    const fieldStyle = { border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', width: '100%' };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-md">
                <div>
                    <h2 className="h3">Inventory Management</h2>
                    <p className="text-muted">Track stock levels and manage products</p>
                </div>
                <div className="flex gap-sm">
                    <button onClick={() => setIsCategoryModalOpen(true)} className="btn btn-secondary gap-sm">
                        <FolderPlus size={18} /><span>Add Category</span>
                    </button>
                    <button className="btn btn-primary gap-sm" onClick={openAddModal}>
                        <Plus size={18} /><span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Category Nav */}
            <div className="flex gap-sm mb-lg" style={{ overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
                {['All', 'Showing on POS', ...categories].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategoryNav(cat)}
                        className={`btn ${selectedCategoryNav === cat ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.5rem 1rem', borderRadius: '20px' }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="flex gap-md mb-md">
                <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <Search size={20} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)' }}>
                        <tr>
                            <th className="p-md text-muted font-medium">Product Name</th>
                            <th className="p-md text-muted font-medium">Category</th>
                            <th className="p-md text-muted font-medium">Type</th>
                            <th className="p-md text-muted font-medium">Price</th>
                            <th className="p-md text-muted font-medium">Stock</th>
                            <th className="p-md text-muted font-medium text-center">Show in POS</th>
                            <th className="p-md text-muted font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td className="p-md font-medium">{product.name}</td>
                                <td className="p-md">
                                    <select
                                        value={product.category}
                                        onChange={(e) => quickAssignCategory(product, e.target.value)}
                                        style={{
                                            padding: '0.35rem 2rem 0.35rem 0.85rem',
                                            borderRadius: '20px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            fontSize: 'inherit',
                                            color: 'var(--primary)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            appearance: 'none',
                                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 0.6rem center',
                                            backgroundSize: '1rem',
                                            outline: 'none',
                                            width: 'auto',
                                            minWidth: '100px'
                                        }}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </td>
                                <td className="p-md text-muted">{product.type}</td>
                                <td className="p-md font-medium">₱{Number(product.price).toFixed(2)}</td>
                                <td className="p-md">
                                    <span style={{ color: product.stock < 20 ? 'var(--error)' : 'var(--success)' }}>
                                        {product.stock} units
                                    </span>
                                </td>
                                <td className="p-md text-center">
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                        <label style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={product.showInPos !== false}
                                                onChange={() => toggleProductPosVisibility(product.id)}
                                                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                            />
                                        </label>
                                    </div>
                                </td>
                                <td className="p-md text-right">
                                    <div className="flex gap-sm justify-end">
                                        <button
                                            className="btn-icon"
                                            title="Edit product"
                                            onClick={() => openEditModal(product)}
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            title="Delete product"
                                            style={{ color: 'var(--error)' }}
                                            onClick={() => setDeleteTarget(product)}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr><td colSpan="7" className="p-md text-center text-muted">No products found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Add / Edit Product Modal ─── */}
            {isProductModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card modal-card" style={{ width: '420px', maxWidth: '90%', position: 'relative' }}>
                        <button
                            onClick={closeProductModal}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 className="h4" style={{ marginBottom: '1.5rem' }}>
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h3>
                        <form onSubmit={handleProductSubmit} className="flex-col gap-md">
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Product Name</label>
                                <input
                                    name="name" value={formData.name}
                                    onChange={handleInputChange}
                                    className="input" style={fieldStyle} required
                                />
                            </div>
                            <div className="flex gap-md">
                                <div className="flex-col gap-sm" style={{ flex: 1 }}>
                                    <label className="text-sm font-medium">Price (₱)</label>
                                    <input
                                        name="price" type="number" value={formData.price}
                                        onChange={handleInputChange}
                                        className="input" style={fieldStyle} required
                                    />
                                </div>
                                <div className="flex-col gap-sm" style={{ flex: 1 }}>
                                    <label className="text-sm font-medium">Stock</label>
                                    <input
                                        name="stock" type="number" value={formData.stock}
                                        onChange={handleInputChange}
                                        className="input" style={fieldStyle} required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-md">
                                <div className="flex-col gap-sm" style={{ flex: 1 }}>
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        name="category" value={formData.category}
                                        onChange={handleInputChange}
                                        className="input" style={fieldStyle}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-col gap-sm" style={{ flex: 1 }}>
                                    <label className="text-sm font-medium">Type</label>
                                    <select
                                        name="type" value={formData.type}
                                        onChange={handleInputChange}
                                        className="input" style={fieldStyle}
                                    >
                                        <option value="refill">Refill</option>
                                        <option value="item">Item</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-sm">
                                <input
                                    type="checkbox" name="showInPos" id="showInPos"
                                    checked={formData.showInPos}
                                    onChange={handleInputChange}
                                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                />
                                <label htmlFor="showInPos" className="text-sm font-medium" style={{ margin: 0, cursor: 'pointer' }}>
                                    Show in POS Terminal
                                </label>
                            </div>

                            <div className="flex gap-md justify-end" style={{ marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeProductModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Delete Confirm Modal ─── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card modal-card" style={{ width: '380px', maxWidth: '90%', textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Trash2 size={24} style={{ color: 'var(--error)' }} />
                        </div>
                        <h3 className="h4" style={{ marginBottom: '0.5rem' }}>Delete Product?</h3>
                        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
                        </p>
                        <div className="flex gap-md justify-center">
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button
                                className="btn"
                                style={{ background: 'var(--error)', color: 'white' }}
                                onClick={handleDeleteConfirm}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Add Category Modal ─── */}
            {isCategoryModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card modal-card" style={{ width: '350px', maxWidth: '90%' }}>
                        <h3 className="h4 mb-md" style={{ marginBottom: '1.5rem' }}>Add New Category</h3>
                        <form onSubmit={handleCategorySubmit} className="flex-col gap-md">
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Category Name</label>
                                <input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="input"
                                    placeholder="e.g., Accessories"
                                    style={fieldStyle}
                                    required autoFocus
                                />
                            </div>
                            <div className="flex gap-md justify-end" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(''); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
