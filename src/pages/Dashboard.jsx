/* src/pages/Dashboard.jsx */
import React, { useMemo, useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { TrendingUp, Package, Users, DollarSign, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts';
import { exportChartPdf } from '../utils/pdfExport';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const PIE_COLORS = [
    '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#10b981', '#f97316', '#6366f1', '#84cc16',
];

// Custom dot that highlights today's entry
const CustomDot = ({ cx, cy, payload, today }) => {
    if (payload.day === today) {
        return (
            <g>
                <circle cx={cx} cy={cy} r={8} fill="var(--primary)" opacity={0.2} />
                <circle cx={cx} cy={cy} r={5} fill="var(--primary)" stroke="white" strokeWidth={2} />
            </g>
        );
    }
    return null;
};

// Custom X-axis tick that bolds/colors today
const CustomXAxisTick = ({ x, y, payload, today }) => {
    const isToday = payload.value === today;
    return (
        <g transform={`translate(${x},${y})`}>
            {isToday && (
                <rect x={-12} y={-4} width={24} height={20} rx={4} fill="var(--primary)" opacity={0.15} />
            )}
            <text
                x={0} y={0} dy={14}
                textAnchor="middle"
                fill={isToday ? 'var(--primary)' : 'var(--text-muted)'}
                fontWeight={isToday ? 700 : 400}
                fontSize={12}
            >
                {payload.value}
            </text>
        </g>
    );
};

// Pie chart custom label
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {(percent * 100).toFixed(0)}%
        </text>
    );
};

export default function Dashboard() {
    const { sales, products, deliveries } = useStore();

    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [exportingChart, setExportingChart] = useState(false);
    const [exportingPie, setExportingPie] = useState(false);
    const [exportingBar, setExportingBar] = useState(false);
    const chartRef = useRef(null);
    const pieRef = useRef(null);
    const barRef = useRef(null);

    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const todayDay = isCurrentMonth ? today.getDate() : null;

    const handleExportChart = async () => {
        if (!chartRef.current) return;
        setExportingChart(true);
        await exportChartPdf(chartRef.current, `Sales Trend - ${MONTH_NAMES[viewMonth]} ${viewYear}`, chartData);
        setExportingChart(false);
    };

    const handleExportPie = async () => {
        if (!pieRef.current) return;
        setExportingPie(true);
        await exportChartPdf(pieRef.current, `Sales by Item`, itemSalesData);
        setExportingPie(false);
    };

    const handleExportBar = async () => {
        if (!barRef.current) return;
        setExportingBar(true);
        await exportChartPdf(barRef.current, `Top 5 Low Stock`, lowStockData);
        setExportingBar(false);
    };

    const goToPrevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const goToNextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = sales.length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'Pending').length;
    const borrowedJugs = sales.filter(s => s.jugStatus === 'borrowed').length;

    const cards = [
        { label: 'Total Sales', value: `₱${totalSales.toLocaleString()}`, icon: <DollarSign size={24} />, color: 'var(--primary)' },
        { label: 'Total Orders', value: totalOrders, icon: <TrendingUp size={24} />, color: 'var(--success)' },
        { label: 'Pending Deliveries', value: pendingDeliveries, icon: <Package size={24} />, color: 'var(--warning)' },
    ];

    // ── Daily sales line chart data ──
    const chartData = useMemo(() => {
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const data = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, sales: 0 }));
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            if (saleDate.getMonth() === viewMonth && saleDate.getFullYear() === viewYear) {
                data[saleDate.getDate() - 1].sales += sale.total;
            }
        });
        return data;
    }, [sales, viewMonth, viewYear]);

    // ── Pie chart: qty sold per item ──
    const itemSalesData = useMemo(() => {
        const totals = {};
        sales.forEach(sale => {
            (sale.items || []).forEach(item => {
                totals[item.name] = (totals[item.name] || 0) + (item.qty || 1);
            });
        });
        return Object.entries(totals)
            .map(([name, qty]) => ({ name, value: qty }))
            .sort((a, b) => b.value - a.value);
    }, [sales]);

    // ── Bar chart: top 5 lowest stock ──
    const lowStockData = useMemo(() => {
        const globalMax = Math.max(...products.map(p => p.stock), 1);
        return [...products]
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
            .map(p => ({
                name: p.name,
                stock: p.stock,
                pct: Math.round((p.stock / globalMax) * 100),
            }));
    }, [products]);

    const maxStock = lowStockData.length ? Math.max(...lowStockData.map(p => p.stock), 1) : 1;

    return (
        <div className="fade-in">
            <h2 className="h3 mb-lg">Dashboard Overview</h2>

            {/* Metrics Grid */}
            <div className="grid-pos mb-xl" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                {cards.map((card, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                        <div style={{
                            width: '54px', height: '54px', borderRadius: '14px',
                            background: card.color, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', flexShrink: 0,
                            boxShadow: `0 8px 16px -4px ${card.color}40`
                        }}>
                            {React.cloneElement(card.icon, { size: 28 })}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <p className="text-muted font-medium" style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'nowrap' }}>{card.label}</p>
                            <h3 className="h2" style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline' }}>{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Sales Line Chart */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="flex justify-between items-center mb-md">
                    <h3 className="h4" style={{ margin: 0 }}>Daily Sales</h3>
                    <div className="flex items-center gap-sm">
                        <button onClick={handleExportChart} disabled={exportingChart}
                            className="btn btn-secondary flex items-center gap-xs"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                            <FileDown size={14} />
                            {exportingChart ? 'Exporting…' : 'Export PDF'}
                        </button>
                        <button onClick={goToPrevMonth} className="btn-icon" style={{ padding: '0.25rem' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <span style={{ fontWeight: 600, minWidth: '130px', textAlign: 'center', fontSize: '0.95rem' }}>
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <button onClick={goToNextMonth} className="btn-icon" style={{ padding: '0.25rem' }} disabled={isCurrentMonth}>
                            <ChevronRight size={20} style={{ opacity: isCurrentMonth ? 0.3 : 1 }} />
                        </button>
                    </div>
                </div>
                <div ref={chartRef} style={{ height: '240px', background: 'white' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false}
                                tick={<CustomXAxisTick today={todayDay} />} interval={0} height={40} />
                            <YAxis axisLine={false} tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                tickFormatter={(v) => `₱${v}`} dx={-10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}
                                itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                                formatter={(v) => [`₱${v}`, 'Sales']}
                                labelFormatter={(l) => `Day ${l}${l === todayDay ? ' (Today)' : ''}`}
                            />
                            {todayDay && <ReferenceLine x={todayDay} stroke="var(--primary)" strokeDasharray="4 4" strokeOpacity={0.5} />}
                            <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3}
                                dot={<CustomDot today={todayDay} />}
                                activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom row: Pie + Low Stock Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* ── Sales by Item Pie Chart ── */}
                {/* ── Sales by Item Pie Chart ── */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-md">
                        <h3 className="h4" style={{ margin: 0 }}>Sales by Item</h3>
                        <button onClick={handleExportPie} disabled={exportingPie}
                            className="btn btn-secondary flex items-center gap-xs"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                            <FileDown size={14} />
                            {exportingPie ? 'Exporting…' : 'Export PDF'}
                        </button>
                    </div>
                    {itemSalesData.length === 0 ? (
                        <p className="text-sm text-muted">No sales data yet.</p>
                    ) : (
                        <div ref={pieRef} style={{ background: 'white' }}>
                            <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={itemSalesData}
                                    cx="50%" cy="45%"
                                    outerRadius={90}
                                    dataKey="value"
                                    labelLine={false}
                                    label={PieLabel}
                                >
                                    {itemSalesData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [`${v} sold`, n]} />
                                <Legend
                                    formatter={(value) => <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* ── Top 5 Low Stock Bar Chart ── */}
                {/* ── Top 5 Low Stock Bar Chart ── */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-md">
                        <h3 className="h4" style={{ margin: 0 }}>Top 5 Low Stock</h3>
                        <button onClick={handleExportBar} disabled={exportingBar}
                            className="btn btn-secondary flex items-center gap-xs"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                            <FileDown size={14} />
                            {exportingBar ? 'Exporting…' : 'Export PDF'}
                        </button>
                    </div>
                    {lowStockData.length === 0 ? (
                        <p className="text-sm text-muted">No products found.</p>
                    ) : (
                        <div ref={barRef} style={{ background: 'white' }}>
                            <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={lowStockData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                                <XAxis type="number" axisLine={false} tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                                    domain={[0, maxStock + 5]} />
                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fill: 'var(--text-main)', fontSize: 12, fontWeight: 600 }}
                                    width={100} />
                                <Tooltip
                                    formatter={(v, n, props) => [`${v} units (${props.payload.pct}%)`, 'In Stock']}
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}
                                />
                                <Bar dataKey="stock" radius={[0, 6, 6, 0]}>
                                    {lowStockData.map((entry, i) => (
                                        <Cell key={i} fill={entry.stock <= 20 ? '#ef4444' : entry.stock <= 50 ? '#f59e0b' : '#0ea5e9'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <h3 className="h4 mb-md">Recent Transactions</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <th className="p-sm text-sm text-muted">ID</th>
                            <th className="p-sm text-sm text-muted">Customer</th>
                            <th className="p-sm text-sm text-muted">Type</th>
                            <th className="p-sm text-sm text-muted">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.slice(0, 5).map(sale => (
                            <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td className="p-sm text-muted">#{sale.id.toString().slice(-4)}</td>
                                <td className="p-sm font-medium">{sale.customerName}</td>
                                <td className="p-sm text-sm">
                                    {(() => {
                                        const label = sale.jugReturned ? 'Returned'
                                            : sale.jugStatus === 'owned' ? 'Owned'
                                                : sale.jugStatus === 'borrowed' ? 'Borrowed' : 'None';
                                        const isSuccess = sale.jugReturned || sale.jugStatus === 'owned';
                                        const bg = isSuccess ? 'rgba(16,185,129,0.15)' : sale.jugStatus === 'borrowed' ? 'rgba(245,158,11,0.15)' : 'var(--bg-body)';
                                        const color = isSuccess ? 'var(--success)' : sale.jugStatus === 'borrowed' ? 'var(--warning)' : 'var(--text-muted)';
                                        return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', background: bg, color, fontWeight: 600 }}>{label}</span>;
                                    })()}
                                </td>
                                <td className="p-sm font-bold">₱{sale.total}</td>
                            </tr>
                        ))}
                        {sales.length === 0 && <tr><td colSpan="4" className="text-center p-md text-muted">No transactions yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
