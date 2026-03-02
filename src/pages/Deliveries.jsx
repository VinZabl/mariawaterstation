/* src/pages/Deliveries.jsx */
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Truck, MapPin, User, Package, Plus, ChevronRight, Phone, CheckCircle, Clock, Edit, Trash2, Check, X, Calendar } from 'lucide-react';

export default function Deliveries() {
    const { deliveries, riders, registerRider, updateRider, deleteRider, customers, updateDeliveryStatus } = useStore();

    const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' | 'riders'
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [riderToDelete, setRiderToDelete] = useState(null);
    const [selectedRider, setSelectedRider] = useState(null);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    // Form State for New Rider
    const [formData, setFormData] = useState({
        name: '',
        contact: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegisterRider = (e) => {
        e.preventDefault();
        if (!formData.name) return;
        registerRider(formData);
        setIsRegisterModalOpen(false);
        setFormData({ name: '', contact: '' });
    };

    const [editFormData, setEditFormData] = useState({ id: null, name: '', contact: '', status: 'Active' });

    const openEditModal = (rider) => {
        setEditFormData({ id: rider.id, name: rider.name, contact: rider.contact, status: rider.status });
        setIsEditModalOpen(true);
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditRider = (e) => {
        e.preventDefault();
        if (!editFormData.name) return;
        updateRider(editFormData.id, editFormData);
        // Also update local selected rider so UI refreshes immediately
        if (selectedRider && selectedRider.id === editFormData.id) {
            setSelectedRider(editFormData);
        }
        setIsEditModalOpen(false);
    };

    const openDeleteModal = (rider) => {
        setRiderToDelete(rider);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteRider = () => {
        if (riderToDelete) {
            deleteRider(riderToDelete.id);
            if (selectedRider && selectedRider.id === riderToDelete.id) {
                setSelectedRider(null);
            }
        }
        setIsDeleteModalOpen(false);
        setRiderToDelete(null);
    };

    // Helper to get a rider's active assignments
    const getRiderAssignments = (riderName) => {
        return deliveries.filter(d => d.rider === riderName);
    };

    // Helper to check if a delivery is for a registered customer
    const getRegisteredCustomerDetails = (customerName) => {
        return customers.find(c => c.name === customerName);
    };

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="flex justify-between items-center mb-md">
                <div>
                    <h2 className="h3">Delivery & Rider Management</h2>
                    <p className="text-muted">Track active routes and manage personnel</p>
                </div>
                {activeTab === 'riders' && (
                    <button className="btn btn-primary gap-sm" onClick={() => setIsRegisterModalOpen(true)}>
                        <Plus size={18} />
                        <span>Add Rider</span>
                    </button>
                )}
            </div>

            {/* Custom Tabs */}
            <div className="flex gap-sm mb-lg" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button
                    className={`btn ${activeTab === 'deliveries' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.5rem 1rem', borderRadius: '20px' }}
                    onClick={() => setActiveTab('deliveries')}
                >
                    Active Deliveries ({deliveries.filter(d => d.status === 'Pending').length})
                </button>
                <button
                    className={`btn ${activeTab === 'riders' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', padding: '0.5rem 1rem', borderRadius: '20px' }}
                    onClick={() => { setActiveTab('riders'); setSelectedRider(null); }}
                >
                    Rider Directory ({riders.length})
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'deliveries' && (
                    <div className="flex-col gap-md">
                        {deliveries.length === 0 ? (
                            <div className="card text-center p-xl text-muted">
                                <Truck size={48} className="mb-md" style={{ opacity: 0.2, margin: '0 auto' }} />
                                <p>No active deliveries found.</p>
                            </div>
                        ) : (
                            deliveries.map(delivery => (
                                <div
                                    key={delivery.id}
                                    className="card flex justify-between hover-bg transition-colors"
                                    style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => setSelectedDelivery(delivery)}
                                >
                                    <div className="flex gap-lg items-center" style={{ padding: '0.75rem 1.25rem' }}>
                                        <div className="flex items-center justify-center" style={{ width: '40px', height: '40px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)' }}>
                                            <Truck size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-xs">Order #{delivery.orderId}</h4>
                                            <p className="text-sm text-muted flex items-center gap-xs">
                                                <User size={14} /> {delivery.customerName}
                                            </p>
                                            <p className="text-sm text-muted flex items-center gap-xs">
                                                <MapPin size={14} /> {delivery.address}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-stretch text-right">
                                        <div className="flex-col justify-center" style={{ padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: '140px', alignItems: 'center' }}>
                                            <span style={{
                                                width: '95px',
                                                height: '26px',
                                                borderRadius: '20px',
                                                background: delivery.status === 'Pending' ? 'var(--warning)' :
                                                    delivery.status === 'Canceled' ? 'var(--error)' : 'var(--success)',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '0.25rem',
                                                transform: delivery.status === 'Canceled' ? 'translateX(2px)' : 'none'
                                            }}>
                                                {delivery.status}
                                            </span>
                                            <p className="text-sm text-muted">Rider: <strong>{delivery.rider}</strong></p>
                                        </div>
                                        {delivery.status === 'Pending' && (
                                            <div className="flex">
                                                <button
                                                    className="flex items-center justify-center cursor-pointer"
                                                    style={{ color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', width: '64px', border: 'none', borderLeft: '1px solid var(--border-light)', transition: 'all 0.2s' }}
                                                    onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(delivery.id, 'Delivered'); }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}
                                                    title="Mark as Delivered"
                                                >
                                                    <Check size={28} />
                                                </button>
                                                <button
                                                    className="flex items-center justify-center cursor-pointer"
                                                    style={{ color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', width: '64px', border: 'none', transition: 'all 0.2s' }}
                                                    onClick={(e) => { e.stopPropagation(); updateDeliveryStatus(delivery.id, 'Canceled'); }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    title="Cancel Delivery"
                                                >
                                                    <X size={28} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'riders' && !selectedRider && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {riders.length === 0 ? (
                            <div className="p-xl text-center flex-col items-center gap-md">
                                <User size={48} className="text-light" />
                                <div>
                                    <h3 className="h4 text-muted mb-xs">No Registered Riders</h3>
                                    <p className="text-sm text-light">Click register to add a new delivery personnel.</p>
                                </div>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)' }}>
                                    <tr>
                                        <th className="p-md text-sm text-muted font-medium">Rider Name</th>
                                        <th className="p-md text-sm text-muted font-medium">Contact</th>
                                        <th className="p-md text-sm text-muted font-medium">Status</th>
                                        <th className="p-md text-sm text-muted font-medium">Current Load</th>
                                        <th className="p-md text-sm text-muted font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riders.map(rider => {
                                        const assignments = getRiderAssignments(rider.name);
                                        const pendingCount = assignments.filter(d => d.status === 'Pending').length;

                                        return (
                                            <tr
                                                key={rider.id}
                                                onClick={() => setSelectedRider(rider)}
                                                style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td className="p-md font-medium flex items-center gap-sm">
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                        {rider.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {rider.name}
                                                </td>
                                                <td className="p-md text-sm text-muted">{rider.contact || 'N/A'}</td>
                                                <td className="p-md">
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        background: rider.status === 'Active' ? 'var(--success)' : 'var(--bg-body)',
                                                        color: rider.status === 'Active' ? 'white' : 'var(--text-muted)'
                                                    }}>
                                                        {rider.status}
                                                    </span>
                                                </td>
                                                <td className="p-md font-medium">
                                                    {pendingCount > 0 ? (
                                                        <span style={{ color: 'var(--warning)' }}>{pendingCount} Pending Routes</span>
                                                    ) : (
                                                        <span className="text-muted">No Load</span>
                                                    )}
                                                </td>
                                                <td className="p-md">
                                                    <div className="flex gap-sm">
                                                        <button
                                                            className="btn-icon"
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(rider); }}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn-icon"
                                                            style={{ color: 'var(--error)' }}
                                                            onClick={(e) => { e.stopPropagation(); openDeleteModal(rider); }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'riders' && selectedRider && (
                    <div className="flex-col gap-md fade-in">
                        <button className="btn btn-secondary gap-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSelectedRider(null)}>
                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Riders
                        </button>

                        <div className="card flex justify-between items-center">
                            <div>
                                <h2 className="h3 flex items-center gap-sm mb-xs">
                                    <Truck className="text-primary" /> {selectedRider.name}'s Routes
                                    <span style={{
                                        marginLeft: '0.5rem',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.7rem',
                                        background: selectedRider.status === 'Active' ? 'var(--success)' : 'var(--bg-body)',
                                        color: selectedRider.status === 'Active' ? 'white' : 'var(--text-muted)'
                                    }}>
                                        {selectedRider.status}
                                    </span>
                                </h2>
                                <p className="text-muted flex items-center gap-xs"><Phone size={14} /> {selectedRider.contact}</p>
                            </div>
                            <div className="flex items-center gap-lg">
                                <div className="text-right">
                                    <h3 className="h2 text-primary">{getRiderAssignments(selectedRider.name).filter(d => d.status === 'Pending').length}</h3>
                                    <p className="text-sm text-muted">Pending Orders</p>
                                </div>
                                <button className="btn btn-secondary" onClick={() => openEditModal(selectedRider)}>Edit Rider</button>
                            </div>
                        </div>

                        <h4 className="font-medium mt-sm">Assigned Deliveries</h4>
                        {getRiderAssignments(selectedRider.name).length === 0 ? (
                            <div className="card text-center p-xl text-muted">
                                <CheckCircle size={48} className="mb-md text-success" style={{ opacity: 0.5, margin: '0 auto' }} />
                                <p>No active routes assigned to this rider.</p>
                            </div>
                        ) : (
                            getRiderAssignments(selectedRider.name).map(route => {
                                const regCustomer = getRegisteredCustomerDetails(route.customerName);

                                return (
                                    <div key={route.id} className="card" style={{ borderLeft: route.status === 'Pending' ? '4px solid var(--warning)' : '4px solid var(--success)' }}>
                                        <div className="flex justify-between mb-sm">
                                            <div className="flex items-center gap-sm">
                                                <span className="font-bold text-lg">Order #{route.orderId}</span>
                                                {regCustomer && (
                                                    <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                        Registered Client
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ color: route.status === 'Pending' ? 'var(--warning)' : 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                {route.status}
                                            </span>
                                        </div>

                                        <div className="grid-pos" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="flex-col gap-xs">
                                                <p className="text-sm text-muted flex items-start gap-sm">
                                                    <User size={16} style={{ marginTop: '2px' }} />
                                                    <span>
                                                        <strong>{route.customerName}</strong><br />
                                                        {regCustomer && <span className="text-xs">{regCustomer.mobile}</span>}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-muted flex items-start gap-sm">
                                                    <MapPin size={16} style={{ marginTop: '2px' }} />
                                                    <span>{route.address}</span>
                                                </p>
                                                <p className="text-sm text-muted flex items-start gap-sm">
                                                    <Package size={16} />
                                                    <span>{route.items.reduce((s, i) => s + i.quantity, 0)} Items to Deliver</span>
                                                </p>
                                            </div>

                                            {/* Order Line Items Summary */}
                                            <div style={{ background: 'var(--bg-body)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                                <p className="text-xs font-bold text-muted mb-xs uppercase">Cargo Items</p>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                                                    {route.items.map(item => (
                                                        <li key={item.id} className="flex justify-between mb-xs pb-xs" style={{ borderBottom: '1px dashed var(--border-light)' }}>
                                                            <span>{item.quantity}x {item.name}</span>
                                                            <span className="text-muted">₱{(item.price * item.quantity).toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="flex justify-between mt-sm pt-xs" style={{ borderTop: '2px solid var(--border-light)' }}>
                                                    <span className="font-bold text-sm">Total Amount:</span>
                                                    <span className="font-bold text-primary">
                                                        ₱{route.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Register Rider Modal */}
            {isRegisterModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 className="h4 mb-md" style={{ marginBottom: '1.5rem' }}>Register New Rider</h3>
                        <form onSubmit={handleRegisterRider} className="flex-col gap-md">
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input p-sm"
                                    placeholder="e.g., Mike Express"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                    required
                                />
                            </div>
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Contact Number</label>
                                <input
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleInputChange}
                                    className="input p-sm"
                                    placeholder="e.g., 0912 345 6789"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                />
                            </div>

                            <div className="flex gap-md justify-end" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Rider</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Rider Modal */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 className="h4 mb-md" style={{ marginBottom: '1.5rem' }}>Edit Rider Profile</h3>
                        <form onSubmit={handleEditRider} className="flex-col gap-md">
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
                                <input
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditInputChange}
                                    className="input p-sm"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                    required
                                />
                            </div>
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Contact Number</label>
                                <input
                                    name="contact"
                                    value={editFormData.contact}
                                    onChange={handleEditInputChange}
                                    className="input p-sm"
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                />
                            </div>
                            <div className="flex-col gap-sm">
                                <label className="text-sm font-medium">Employment Status</label>
                                <select
                                    name="status"
                                    value={editFormData.status}
                                    onChange={handleEditInputChange}
                                    style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex gap-md justify-end" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card text-center" style={{ width: '400px', maxWidth: '90%' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--error)' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 className="h4 mb-sm">Delete Rider?</h3>
                        <p className="text-muted mb-lg">Are you sure you want to permanently delete the profile for <strong>{riderToDelete?.name}</strong>? This action cannot be undone.</p>

                        {riderToDelete && getRiderAssignments(riderToDelete.name).length > 0 && (
                            <div className="mb-lg p-sm" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
                                    Warning: This rider currently has {getRiderAssignments(riderToDelete.name).length} assigned routes! Reassign them before deleting.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-md justify-center">
                            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ background: 'var(--error)' }} onClick={confirmDeleteRider}>Yes, Delete Rider</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delivery Detail Modal */}
            {selectedDelivery && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card fade-in" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-start mb-md">
                            <div>
                                <h2 className="h3 mb-xs">Order #{selectedDelivery.orderId}</h2>
                                <p className="text-muted text-sm flex items-center gap-xs">
                                    <MapPin size={14} />
                                    {selectedDelivery.address}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDelivery(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', lineHeight: 1 }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid-pos mb-md" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="p-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p className="text-xs text-muted font-bold mb-xs uppercase">Customer</p>
                                <p className="font-medium">{selectedDelivery.customerName}</p>
                            </div>
                            <div className="p-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p className="text-xs text-muted font-bold mb-xs uppercase">Rider</p>
                                <p className="font-medium">{selectedDelivery.rider}</p>
                            </div>
                        </div>

                        <h3 className="h5 mb-sm">Order Items</h3>
                        <div className="mb-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-md)' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {selectedDelivery.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between mb-sm pb-sm" style={{ borderBottom: idx !== selectedDelivery.items.length - 1 ? '1px dashed var(--border-light)' : 'none', alignItems: 'center' }}>
                                        <p className="font-medium">{item.name}</p>
                                        <div className="flex items-center gap-sm">
                                            <span style={{ background: 'rgba(14,165,233,0.12)', color: 'var(--primary)', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                                                {item.quantity}x
                                            </span>
                                            <span className="font-bold" style={{ color: 'var(--primary)' }}>
                                                ₱{(item.quantity * item.price).toFixed(2)}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-between items-center p-md" style={{ borderTop: '2px solid var(--border-light)' }}>
                            <span className="font-bold">Total Amount</span>
                            <span className="h3" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                ₱{selectedDelivery.items.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
