import React from 'react';

interface SettingsCardProps {
    children: React.ReactNode;
    className?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ children, className = '' }) => {
    return (
        <div
            className={`settings-card ${className}`}
            style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(var(--glass-blur))',
                WebkitBackdropFilter: 'blur(var(--glass-blur))',
                border: '1px solid var(--border-glass)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--glass-shadow)',
                transition: 'background 0.3s ease, transform 0.2s ease',
            }}
        >
            {children}
        </div>
    );
};
