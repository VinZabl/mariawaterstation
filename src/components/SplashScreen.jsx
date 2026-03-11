/* src/components/SplashScreen.jsx */
import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

    useEffect(() => {
        // Ease in: 800ms, hold: 900ms, ease out: 600ms
        const holdTimer = setTimeout(() => setPhase('out'), 1700);
        const doneTimer = setTimeout(() => onDone(), 2300);
        return () => { clearTimeout(holdTimer); clearTimeout(doneTimer); };
    }, [onDone]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: '#ffffff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.6s ease',
            opacity: phase === 'out' ? 0 : 1,
            pointerEvents: phase === 'out' ? 'none' : 'all',
        }}>
            {/* Subtle background glow */}
            <div style={{
                position: 'absolute',
                width: 400, height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }} />

            {/* Brand text */}
            <div style={{
                position: 'relative',
                textAlign: 'center',
                animation: 'splashIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}>
                <p style={{
                    margin: 0,
                    fontSize: '3rem',
                    fontWeight: 900,
                    letterSpacing: '0.18em',
                    color: '#0f172a',
                    fontFamily: "'Google Sans', 'Roboto', Inter, system-ui, sans-serif",
                }}>
                    MICIT
                    <span style={{ color: '#3b82f6' }}>.POS</span>
                </p>
                <p style={{
                    margin: '0.5rem 0 0',
                    fontSize: '0.75rem',
                    letterSpacing: '0.25em',
                    color: 'rgba(0,0,0,0.35)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 500,
                }}>
                    POINT OF SALE SYSTEM
                </p>
            </div>

            <style>{`
                @keyframes splashIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)  scale(1); }
                }
            `}</style>
        </div>
    );
}
