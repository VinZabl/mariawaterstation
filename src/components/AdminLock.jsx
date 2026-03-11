/* src/components/AdminLock.jsx */
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Lock, AlertCircle, Smartphone } from 'lucide-react';

export default function AdminLock({ children }) {
    const { isAdminAuthenticated, loginAdmin } = useStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await loginAdmin(password);
        if (!success) {
            setError('Incorrect admin password');
        }
    };

    if (isAdminAuthenticated) {
        return children;
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', minHeight: '75vh', flexDirection: 'column',
        }} className="fade-in">
            {/* Landscape Overlay for Portrait View (Even on Login) */}
            <div id="landscape-requirement">
                <div className="rotate-icon">
                    <Smartphone size={64} strokeWidth={1} />
                </div>
                <h2 className="h3" style={{ fontWeight: 800 }}>Please Rotate Your Device</h2>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>This app works best in landscape orientation.</p>
            </div>
            <div className="card text-center" style={{ width: '400px', maxWidth: '100%' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 40px'
                }}>
                    <Lock size={40} color="var(--text-main)" />
                </div>
                <h2 className="h3 mb-sm">Access Restricted</h2>
                <p className="text-muted mb-lg">Please enter the admin password to access this sensitive section.</p>

                <form onSubmit={handleSubmit} autoComplete="off" className="flex-col gap-md text-left">
                    {/* Dummy inputs to completely defeat Chrome/Safari autofill */}
                    <input type="text" name="fake_user" style={{ position: 'absolute', top: -9999, left: -9999 }} tabIndex={-1} aria-hidden="true" />
                    <input type="password" name="fake_pass" style={{ position: 'absolute', top: -9999, left: -9999 }} tabIndex={-1} aria-hidden="true" />

                    <div>
                        <label className="text-sm font-bold text-muted mb-xs block uppercase">Password</label>
                        <input
                            type="password"
                            id="admin_secure_key"
                            name="admin_secure_key"
                            placeholder="Enter password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            autoComplete="off"
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                fontSize: '1.1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-main)',
                                outline: 'none'
                            }}
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-xs p-sm text-sm" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }}>
                        Unlock
                    </button>
                </form>
            </div>
        </div>
    );
}
