/* src/pages/Dashboard.jsx */
import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { TrendingUp, Package, Users, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

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

export default function Dashboard() {
    const { sales, products, deliveries } = useStore();

    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const todayDay = isCurrentMonth ? today.getDate() : null;

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
        { label: 'Borrowed Jugs Out', value: borrowedJugs, icon: <Users size={24} />, color: 'var(--accent)' },
    ];

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

    return (
        <div className="fade-in">
            <h2 className="h3 mb-lg">Dashboard Overview</h2>

            {/* Metrics Grid */}
            <div className="grid-pos mb-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '2rem' }}>
                {cards.map((card, i) => (
                    <div key={i} className="card flex items-center gap-lg">
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '12px',
                            background: card.color, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', opacity: 0.9
                        }}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm text-muted">{card.label}</p>
                            <h3 className="h2" style={{ lineHeight: 1.2 }}>{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Sales Chart */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                {/* Chart Header with Month Navigation */}
                <div className="flex justify-between items-center mb-md">
                    <h3 className="h4" style={{ margin: 0 }}>Daily Sales</h3>
                    <div className="flex items-center gap-sm">
                        <button
                            onClick={goToPrevMonth}
                            className="btn-icon"
                            style={{ padding: '0.25rem' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span style={{ fontWeight: 600, minWidth: '130px', textAlign: 'center', fontSize: '0.95rem' }}>
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <button
                            onClick={goToNextMonth}
                            className="btn-icon"
                            style={{ padding: '0.25rem' }}
                            disabled={isCurrentMonth}
                        >
                            <ChevronRight size={20} style={{ opacity: isCurrentMonth ? 0.3 : 1 }} />
                        </button>
                    </div>
                </div>

                {/* Chart — fixed height, bottom margin for X-axis labels inside card */}
                <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={<CustomXAxisTick today={todayDay} />}
                                interval={0}
                                height={40}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                tickFormatter={(value) => `₱${value}`}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                                itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                                formatter={(value) => [`₱${value}`, 'Sales']}
                                labelFormatter={(label) => `Day ${label}${label === todayDay ? ' (Today)' : ''}`}
                            />
                            {todayDay && (
                                <ReferenceLine
                                    x={todayDay}
                                    stroke="var(--primary)"
                                    strokeDasharray="4 4"
                                    strokeOpacity={0.5}
                                />
                            )}
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="var(--primary)"
                                strokeWidth={3}
                                dot={<CustomDot today={todayDay} />}
                                activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex gap-lg">
                {/* Recent Transactions */}
                <div className="card" style={{ flex: 2 }}>
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
                                    <td className="p-sm font-bold">₱{sale.total}</td>
                                </tr>
                            ))}
                            {sales.length === 0 && <tr><td colSpan="4" className="text-center p-md text-muted">No transactions yet.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Low Stock Alert */}
                <div className="card" style={{ flex: 1 }}>
                    <h3 className="h4 mb-md">Low Stock Alert</h3>
                    <div className="flex-col gap-sm">
                        {products.filter(p => p.stock < 50).map(p => (
                            <div key={p.id} className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
                                <span className="font-medium text-sm">{p.name}</span>
                                <span style={{ color: 'var(--error)', fontWeight: 'bold' }}>{p.stock}</span>
                            </div>
                        ))}
                        {products.filter(p => p.stock < 50).length === 0 && <p className="text-sm text-muted">All stock levels healthy.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
