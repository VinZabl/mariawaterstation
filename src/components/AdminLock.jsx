/* src/components/AdminLock.jsx */
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Lock, AlertCircle } from 'lucide-react';

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
            height: '100%', flexDirection: 'column', padding: 'var(--spacing-xl)'
        }} className="fade-in">
            <div className="card text-center" style={{ width: '400px', maxWidth: '100%' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--spacing-xl)'
                }}>
                    <Lock size={40} color="var(--text-main)" />
                </div>
                <h2 className="h3 mb-sm">Access Restricted</h2>
                <p className="text-muted mb-lg">Please enter the admin password to access this page.</p>

                <form onSubmit={handleSubmit} className="flex-col gap-md text-left">
                    <div>
                        <label className="text-sm font-bold text-muted mb-xs block uppercase">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            autoComplete="new-password"
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                fontSize: '1.1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-body)',
                                color: 'var(--text-main)'
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
