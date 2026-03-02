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
    ReceiptText
} from 'lucide-react';

export default function Sidebar() {
    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { to: '/pos', icon: <ShoppingCart size={20} />, label: 'Point of Sale' },
        { to: '/inventory', icon: <Package size={20} />, label: 'Inventory' },
        { to: '/deliveries', icon: <Truck size={20} />, label: 'Deliveries' },
        { to: '/customers', icon: <Users size={20} />, label: 'Customers' },
        { to: '/transactions', icon: <ReceiptText size={20} />, label: 'Transactions' },
    ];

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `sidebar-link flex items-center gap-md ${isActive ? 'active-nav' : ''}`
                        }
                    >
                        {item.icon}
                        <span className="sidebar-link-text">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink
                    to="/settings"
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
