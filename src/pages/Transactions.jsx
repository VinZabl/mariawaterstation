import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, Receipt, Calendar, ArrowUpRight, Filter, X, FileDown } from 'lucide-react';
import { exportTransactionsPdf } from '../utils/pdfExport';

export default function Transactions() {
    const { sales, markJugReturned } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [exporting, setExporting] = useState(false);

    const handleExportPdf = async () => {
        setExporting(true);
        await exportTransactionsPdf(filteredSales);
        setExporting(false);
    };

    const filteredSales = sales.filter(sale =>
        sale.id.toString().includes(searchTerm) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-lg">
                <h2 className="h3">Transaction History</h2>
                <button
                    onClick={handleExportPdf}
                    disabled={exporting}
                    className="btn btn-secondary flex items-center gap-sm"
                >
                    <FileDown size={18} />
                    {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
            </div>

            <div className="flex gap-md mb-sm">
                <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <Search size={20} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button className="btn btn-secondary gap-sm">
                    <Filter size={18} />
                    Filter
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)' }}>
                            <tr>
                                <th className="p-md text-sm text-muted font-medium">Order ID</th>
                                <th className="p-md text-sm text-muted font-medium">Date & Time</th>
                                <th className="p-md text-sm text-muted font-medium">Customer</th>
                                <th className="p-md text-sm text-muted font-medium">Items</th>
                                <th className="p-md text-sm text-muted font-medium">Type</th>
                                <th className="p-md text-sm text-muted font-medium">Payment</th>
                                <th className="p-md text-sm text-muted font-medium">Jug Status</th>
                                <th className="p-md text-sm text-muted font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map((sale) => (
                                <tr
                                    key={sale.id}
                                    style={{ borderBottom: '1px solid var(--border-light)' }}
                                    className="hover-bg transition-colors cursor-pointer"
                                    onClick={() => setSelectedTransaction(sale)}
                                >
                                    <td className="p-md font-medium text-primary">#{sale.id}</td>
                                    <td className="p-md text-sm text-muted flex items-center gap-xs">
                                        <Calendar size={14} />
                                        {new Date(sale.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="p-md">{sale.customerName}</td>
                                    <td className="p-md text-sm text-muted">{sale.items.length} items</td>
                                    <td className="p-md">
                                        <span style={{
                                            padding: '0.15rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: sale.source === 'online' ? 'rgba(14,165,233,0.12)' : 'var(--bg-body)',
                                            color: sale.source === 'online' ? 'var(--primary)' : 'var(--text-muted)',
                                        }}>
                                            {sale.source === 'online' ? 'Online' : 'On-Site'}
                                        </span>
                                    </td>
                                    <td className="p-md">
                                        <span style={{
                                            padding: '0 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            background: 'var(--bg-body)',
                                            color: 'var(--text-main)'
                                        }}>
                                            {sale.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="p-md">
                                        {(() => {
                                            const label = sale.jugReturned ? 'Returned'
                                                : sale.jugStatus === 'owned' ? 'Owned'
                                                    : sale.jugStatus === 'borrowed' ? 'Borrowed'
                                                        : 'None';
                                            const isSuccess = sale.jugReturned || sale.jugStatus === 'owned';
                                            const bg = isSuccess ? 'rgba(16,185,129,0.15)' : sale.jugStatus === 'borrowed' ? 'rgba(245,158,11,0.15)' : 'var(--bg-body)';
                                            const color = isSuccess ? 'var(--success)' : sale.jugStatus === 'borrowed' ? 'var(--warning)' : 'var(--text-muted)';

                                            return (
                                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', background: bg, color, fontWeight: 600 }}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-md text-right font-bold">
                                        ₱{sale.total.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-xl text-center text-muted">
                                        <div className="flex-col items-center gap-sm">
                                            <Receipt size={40} style={{ opacity: 0.2 }} />
                                            <p>No transactions found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card modal-card fade-in" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex justify-between items-start mb-md">
                            <div>
                                <h2 className="h3 mb-xs">Order #{selectedTransaction.id}</h2>
                                <p className="text-muted text-sm flex items-center gap-xs">
                                    <Calendar size={14} />
                                    {new Date(selectedTransaction.date).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid-pos mb-md" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="p-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p className="text-xs text-muted font-bold mb-xs uppercase">Customer</p>
                                <p className="font-medium">{selectedTransaction.customerName}</p>
                            </div>
                            <div className="p-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <p className="text-xs text-muted font-bold mb-xs uppercase">Payment</p>
                                <p className="font-medium">{selectedTransaction.paymentMethod}</p>
                            </div>
                            <div className="p-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                                <p className="text-xs text-muted font-bold mb-xs uppercase">Order Type</p>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    background: selectedTransaction.source === 'online' ? 'rgba(14,165,233,0.12)' : 'var(--bg-body)',
                                    color: selectedTransaction.source === 'online' ? 'var(--primary)' : 'var(--text-muted)',
                                    border: selectedTransaction.source === 'online' ? '1px solid rgba(14,165,233,0.3)' : '1px solid var(--border-light)',
                                }}>
                                    {selectedTransaction.source === 'online' ? '🌐 Online Order' : '🏪 On-Site'}
                                </span>
                            </div>
                            <div className="p-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-muted font-bold mb-xs uppercase">Jug Status</p>
                                        <p className="font-medium" style={{
                                            color: selectedTransaction.jugReturned ? 'var(--success)'
                                                : selectedTransaction.jugStatus === 'borrowed' ? 'var(--warning)'
                                                    : selectedTransaction.jugStatus === 'owned' ? 'var(--success)'
                                                        : 'var(--text-muted)'
                                        }}>
                                            {selectedTransaction.jugReturned ? 'Returned'
                                                : selectedTransaction.jugStatus === 'borrowed' ? 'Borrowed Container'
                                                    : selectedTransaction.jugStatus === 'owned' ? 'Customer Owned'
                                                        : 'None'}
                                        </p>
                                        {selectedTransaction.jugReturnedAt && (
                                            <p className="text-xs text-muted mt-xs">
                                                On {new Date(selectedTransaction.jugReturnedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    {selectedTransaction.jugStatus === 'borrowed' && !selectedTransaction.jugReturned && (
                                        <button
                                            className="btn"
                                            onClick={async () => {
                                                await markJugReturned(selectedTransaction.id);
                                                // Update local modal state so it reflects immediately without closing
                                                setSelectedTransaction(prev => ({
                                                    ...prev,
                                                    jugReturned: true,
                                                    jugReturnedAt: new Date().toISOString()
                                                }));
                                            }}
                                            style={{
                                                background: 'var(--success)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.6rem 1.2rem',
                                                borderRadius: 'var(--radius-sm)',
                                                fontWeight: '600',
                                                boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
                                            }}
                                        >
                                            Mark as Returned
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>

                        <h3 className="h5 mb-sm">Order Items</h3>
                        <div className="mb-md" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-md)' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {selectedTransaction.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between mb-sm pb-sm" style={{ borderBottom: idx !== selectedTransaction.items.length - 1 ? '1px dashed var(--border-light)' : 'none' }}>
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-muted">{item.quantity}x @ ₱{item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right font-medium">
                                            ₱{(item.quantity * item.price).toFixed(2)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-between items-center p-md" style={{ borderTop: '2px solid var(--border-light)' }}>
                            <span className="font-bold">Total Amount</span>
                            <span className="h3 text-primary">₱{selectedTransaction.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
