/* src/components/Layout.jsx */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useStore } from '../context/StoreContext';
import { Lock } from 'lucide-react';

export default function Layout() {
    const { isAdminAuthenticated, logoutAdmin } = useStore();

    return (
        <div className="main-layout">
            <Sidebar />
            <main className="content-area">
                <header className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xl)' }}>
                    <div>
                        <h1 className="h3">Welcome Back</h1>
                        <p className="text-muted text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-md">
                        {isAdminAuthenticated && (
                            <button
                                className="btn btn-sm btn-outline flex items-center gap-xs"
                                onClick={logoutAdmin}
                                title="Lock Admin Session"
                            >
                                <Lock size={14} /> Lock Session
                            </button>
                        )}
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            A
                        </div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
}
