/* src/pages/Settings.jsx */
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Shield, Check, Lock } from 'lucide-react';

export default function Settings() {
    const { updateAdminPassword } = useStore();
    const [newPassword, setNewPassword] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!newPassword) return;

        const success = await updateAdminPassword(newPassword);
        if (success) {
            setSuccessMsg('Password updated successfully!');
            setNewPassword('');
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    return (
        <div className="fade-in max-w-2xl">
            <h2 className="h2 flex items-center gap-sm mb-lg">
                <Shield size={28} className="text-primary" /> Settings & Security
            </h2>

            <div className="card">
                <div className="mb-md">
                    <h3 className="h4 flex items-center gap-xs mb-xs">
                        <Lock size={18} /> Admin Password
                    </h3>
                    <p className="text-muted text-sm">Change the password required to access Inventory, Deliveries, Customers, and Settings.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="flex-col gap-md">
                    <div>
                        <label className="text-sm font-bold text-muted mb-xs block uppercase">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password..."
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    {successMsg && (
                        <div className="flex items-center gap-xs p-sm text-sm" style={{ color: 'var(--success)', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)' }}>
                            <Check size={16} /> {successMsg}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
}
