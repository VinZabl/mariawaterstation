/* src/components/Sidebar.jsx */
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Truck,
    Users,
    Settings,
    ReceiptText,
    Store
} from 'lucide-react';

export default function Sidebar() {
    const navItems = [
        { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/admin/pos', icon: <ShoppingCart size={20} />, label: 'Point of Sale' },
        { to: '/admin/transactions', icon: <ReceiptText size={20} />, label: 'Transactions' },
        { to: '/admin/inventory', icon: <Package size={20} />, label: 'Inventory' },
        { to: '/admin/deliveries', icon: <Truck size={20} />, label: 'Deliveries' },
        { to: '/admin/customers', icon: <Users size={20} />, label: 'Customers' },
        { to: '/admin/menu', icon: <Store size={20} />, label: 'Menu Manager' },
    ];

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/admin'}
                        className={({ isActive }) =>
                            `sidebar-link flex items-center gap-md ${isActive ? 'active-nav' : ''}`
                        }
                    >
                        {item.icon}
                        <span className="sidebar-link-text">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) =>
                        `sidebar-btn flex items-center gap-md btn-icon ${isActive ? 'active-nav text-primary' : ''}`
                    }
                    style={{ textDecoration: 'none' }}
                >
                    <Settings size={20} />
                    <span className="sidebar-link-text">Settings</span>
                </NavLink>
            </div>
        </aside>
    );
}
