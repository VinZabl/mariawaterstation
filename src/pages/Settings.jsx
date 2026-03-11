/* src/pages/Settings.jsx */
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Shield, Check, Lock, Type, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FONT_SIZES = [
    { key: 'small',   label: 'Small',   px: '16px' },
    { key: 'default', label: 'Default', px: '18px' },
    { key: 'large',   label: 'Large',   px: '20px' },
];

function applyFontSize(key) {
    document.documentElement.setAttribute('data-font-size', key);
    localStorage.setItem('admin_font_size', key); // keep as instant cache
}

export default function Settings() {
    const { updateAdminPassword, showToast } = useStore();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fontSize, setFontSize] = useState(
        () => localStorage.getItem('admin_font_size') || 'default'
    );

    // Load font size from DB on mount
    useEffect(() => {
        supabase.from('app_settings').select('font_size').eq('id', 1).single()
            .then(({ data }) => {
                if (data?.font_size) {
                    setFontSize(data.font_size);
                    applyFontSize(data.font_size);
                }
            });
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMsg('');

        if (!newPassword) return;
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        const success = await updateAdminPassword(newPassword);
        if (success) {
            showToast('Admin password updated!');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleFontSize = async (key) => {
        setFontSize(key);
        applyFontSize(key);
        await supabase.from('app_settings').update({ font_size: key }).eq('id', 1);
        showToast(`Font size set to ${key}.`);
    };

    return (
        <div className="fade-in" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={26} className="text-primary" /> Settings &amp; Security
            </h2>

            {/* ── Font Size ── */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>
                    <Type size={18} className="text-primary" /> Font Size
                </h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
                    Adjust the text size across the admin panel. Synced across all devices.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {FONT_SIZES.map(({ key, label, px }) => (
                        <button
                            key={key}
                            onClick={() => handleFontSize(key)}
                            style={{
                                flex: 1, padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)',
                                border: `2px solid ${fontSize === key ? 'var(--primary)' : 'var(--border-light)'}`,
                                background: fontSize === key ? 'rgba(14,165,233,0.08)' : 'white',
                                color: fontSize === key ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                            }}
                        >
                            <div style={{ fontSize: px, fontWeight: 700, lineHeight: 1 }}>A</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>{label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Admin Password ── */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700 }}>
                    <Lock size={18} className="text-primary" /> Admin Password
                </h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
                    Change the password required to access the admin panel.
                </p>
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            New Password
                        </label>
                        <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
                            {/* Hidden dummy field to trap autofill */}
                            <input type="text" style={{ position: 'absolute', top: -9999, left: -9999 }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password..."
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="input"
                                style={{ width: '100%', paddingRight: '2.5rem', background: 'var(--bg-surface)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Confirm Password
                        </label>
                        <div style={{ position: 'relative', width: '100%', maxWidth: 260 }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password..."
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="input"
                                style={{ width: '100%', paddingRight: '2.5rem', background: 'var(--bg-surface)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {passwordError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem', fontSize: '0.875rem', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                            <AlertCircle size={16} /> {passwordError}
                        </div>
                    )}

                    {passwordMsg && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem', fontSize: '0.875rem', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)' }}>
                            <Check size={16} /> {passwordMsg}
                        </div>
                    )}
                    <div>
                        <button type="submit" className="btn btn-primary">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
