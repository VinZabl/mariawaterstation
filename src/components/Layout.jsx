import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminLock from './AdminLock';
import { useStore } from '../context/StoreContext';
import { Lock, Smartphone, RefreshCw, CheckCircle, X } from 'lucide-react';

export default function Layout() {
    const { isAdminAuthenticated, logoutAdmin, toast, toastExiting, dismissToast } = useStore();

    useEffect(() => {
        const lockOrientation = async () => {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('landscape').catch(() => {
                        // Ignore errors (e.g., on desktop or if not supported)
                    });
                }
            } catch (err) {
                // Silently fail
            }
        };
        lockOrientation();
    }, []);

    return (
        <div className="main-layout">
            {/* Global Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'var(--success)', color: 'white',
                    padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    animation: toastExiting
                        ? 'slideOutRight 0.35s ease forwards'
                        : 'slideInRight 0.3s ease',
                    maxWidth: '320px', fontWeight: 500, fontSize: '0.95rem'
                }}>
                    <CheckCircle size={20} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{toast}</span>
                    <button onClick={dismissToast} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', lineHeight: 1 }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Landscape Overlay for Portrait View */}
            <div id="landscape-requirement">
                <div className="rotate-icon">
                    <Smartphone size={64} strokeWidth={1} />
                </div>
                <h2 className="h3" style={{ fontWeight: 800 }}>Please Rotate Your Device</h2>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>This management panel works best in landscape orientation.</p>
            </div>

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
                                title="Lock Sensitive Sections"
                            >
                                <Lock size={14} /> Lock Session
                            </button>
                        )}
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
}
