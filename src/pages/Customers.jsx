/* src/pages/Customers.jsx */
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User, ShoppingBag, Plus, MapPin, Phone, Calendar, ArrowLeft } from 'lucide-react';

export default function Customers() {
    const { customers, sales, registerCustomer } = useStore();

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        address: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = (e) => {
        e.preventDefault();
        if (!formData.name) return;

        registerCustomer(formData);
        setIsRegisterModalOpen(false);
        setFormData({ name: '', mobile: '', address: '' });
    };

    // Derived customer metrics
    const getCustomerMetrics = (customerName) => {
        const customerSales = sales.filter(s => s.customerName === customerName);
        const totalSpent = customerSales.reduce((sum, s) => sum + s.total, 0);
        const lastOrder = customerSales.length > 0 ? customerSales[0].date : null;

        // Calculate outstanding borrowed jars by excluding returned ones
        const borrowedJars = customerSales.filter(s => s.jugStatus === 'borrowed' && !s.jugReturned).length;

        return {
            totalOrders: customerSales.length,
            totalSpent,
            lastOrder,
            borrowedJars,
            history: customerSales
        };
    };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* If a customer is selected, show their detail view, otherwise show the directory list */}
            {selectedCustomer ? (
                <div className="flex-col gap-md" style={{ flex: 1 }}>
                    <button className="btn btn-secondary gap-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSelectedCustomer(null)}>
                        <ArrowLeft size={18} /> Back to Directory
                    </button>

                    <div className="card mb-md flex justify-between items-start">
                        <div>
                            <h2 className="h2 flex items-center gap-sm mb-sm"><User size={28} className="text-primary" /> {selectedCustomer.name}</h2>
                            <p className="text-muted flex items-center gap-sm mb-xs"><MapPin size={16} /> {selectedCustomer.address || 'No address provided'}</p>
                            <p className="text-muted flex items-center gap-sm"><Phone size={16} /> {selectedCustomer.mobile || 'No mobile provided'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted mb-xs">Registered On</p>
                            <p className="font-medium flex items-center justify-end gap-xs"><Calendar size={16} /> {new Date(selectedCustomer.registeredDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid-pos mb-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="card flex-col items-center justify-center p-md">
                            <p className="text-muted text-sm mb-xs">Total Spent</p>
                            <h3 className="h2 text-primary">₱{getCustomerMetrics(selectedCustomer.name).totalSpent.toFixed(2)}</h3>
                        </div>
                        <div className="card flex-col items-center justify-center p-md">
                            <p className="text-muted text-sm mb-xs">Total Orders</p>
                            <h3 className="h2 text-success">{getCustomerMetrics(selectedCustomer.name).totalOrders}</h3>
                        </div>
                        <div className="card flex-col items-center justify-center p-md" style={{ border: getCustomerMetrics(selectedCustomer.name).borrowedJars > 0 ? '2px solid var(--warning)' : 'none' }}>
                            <p className="text-muted text-sm mb-xs">Borrowed Jars</p>
                            <h3 className="h2" style={{ color: getCustomerMetrics(selectedCustomer.name).borrowedJars > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
                                {getCustomerMetrics(selectedCustomer.name).borrowedJars}
                            </h3>
                        </div>
                    </div>

                    <h3 className="h4 mb-sm">Order History</h3>
                    <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
                        {getCustomerMetrics(selectedCustomer.name).history.length === 0 ? (
                            <p className="text-muted text-center p-md">No orders found.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <th className="p-sm text-sm text-muted">Order ID</th>
                                        <th className="p-sm text-sm text-muted">Date</th>
                                        <th className="p-sm text-sm text-muted">Items</th>
                                        <th className="p-sm text-sm text-muted">Container</th>
                                        <th className="p-sm text-sm text-muted">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getCustomerMetrics(selectedCustomer.name).history.map(order => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td className="p-sm text-muted">#{order.id.toString().slice(-4)}</td>
                                            <td className="p-sm">{new Date(order.date).toLocaleDateString()}</td>
                                            <td className="p-sm text-sm">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</td>
                                            <td className="p-sm">
                                                {(() => {
                                                    const label = order.jugReturned ? 'Returned'
                                                        : order.jugStatus === 'owned' ? 'Owned'
                                                            : order.jugStatus === 'borrowed' ? 'Borrowed'
                                                                : 'None';
                                                    const isSuccess = order.jugReturned || order.jugStatus === 'owned';
                                                    const bg = isSuccess ? 'rgba(16,185,129,0.15)' : order.jugStatus === 'borrowed' ? 'rgba(245,158,11,0.15)' : 'var(--bg-body)';
                                                    const color = isSuccess ? 'var(--success)' : order.jugStatus === 'borrowed' ? 'var(--warning)' : 'var(--text-muted)';

                                                    return (
                                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', background: bg, color, fontWeight: 600 }}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-sm font-bold text-primary">₱{order.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-md">
                        <div>
                            <h2 className="h3">Customer Directory</h2>
                            <p className="text-muted">Manage registered clients and view histories</p>
                        </div>
                        <button className="btn btn-primary gap-sm" onClick={() => setIsRegisterModalOpen(true)}>
                            <Plus size={18} />
                            <span>Register Customer</span>
                        </button>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {customers.length === 0 ? (
                            <div className="p-xl text-center flex-col items-center gap-md">
                                <User size={48} className="text-light" />
                                <div>
                                    <h3 className="h4 text-muted mb-xs">No Registered Customers</h3>
                                    <p className="text-sm text-light">Click register to add a new client profile.</p>
                                </div>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)' }}>
                                    <tr>
                                        <th className="p-md text-sm text-muted font-medium">Customer Name</th>
                                        <th className="p-md text-sm text-muted font-medium">Contact</th>
                                        <th className="p-md text-sm text-muted font-medium">Total Orders</th>
                                        <th className="p-md text-sm text-muted font-medium">Borrowed Jars</th>
                                        <th className="p-md text-sm text-muted font-medium">Total Spent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map(c => {
                                        const metrics = getCustomerMetrics(c.name);
                                        return (
                                            <tr
                                                key={c.id}
                                                onClick={() => setSelectedCustomer(c)}
                                                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td className="p-md font-medium flex items-center gap-sm">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                        {c.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {c.name}
                                                </td>
                                                <td className="p-md text-sm text-muted">{c.mobile || 'N/A'}</td>
                                                <td className="p-md">{metrics.totalOrders}</td>
                                                <td className="p-md">
                                                    <span style={{ color: metrics.borrowedJars > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                                        {metrics.borrowedJars > 0 ? `${metrics.borrowedJars} Jars` : 'None'}
                                                    </span>
                                                </td>
                                                <td className="p-md font-medium">₱{metrics.totalSpent.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {/* Registration Modal Overlay */}
            {isRegisterModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 className="h4 mb-md" style={{ marginBottom: '1.5rem' }}>Register New Customer</h3>
                        <form onSubmit={handleRegister} className="flex-col gap-md">
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input p-sm"
                                    placeholder="e.g., Jane Doe"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                    required
                                />
                            </div>
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <input
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    className="input p-sm"
                                    placeholder="e.g., 0912 345 6789"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                />
                            </div>
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Delivery Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="input p-sm"
                                    placeholder="Full street address..."
                                    rows="3"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', resize: 'vertical' }}
                                />
                            </div>

                            <div className="flex gap-md justify-end" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Complete Registration</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
