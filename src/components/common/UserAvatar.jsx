import React from 'react';

export const UserAvatar = ({ user, size = 'md', className = '' }) => {
    if (!user) return null;

    let avatarData = { text: '?', bg: '#e2e8f0', fg: '#64748b' }; // Default Slate-200/Slate-500

    // Parse Avatar
    // Case 1: user.avatar is a JSON string (New Custom Format)
    if (typeof user.avatar === 'string' && user.avatar.startsWith('{')) {
        try {
            const parsed = JSON.parse(user.avatar);
            avatarData = {
                text: parsed.text || '?',
                bg: parsed.bg || '#e2e8f0',
                fg: parsed.fg || '#64748b'
            };
        } catch (e) {
            avatarData.text = user.avatar.substring(0, 2).toUpperCase();
        }
    }
    // Case 2: user.avatar is simple text (Legacy)
    else if (user.avatar) {
        avatarData.text = user.avatar.toString().substring(0, 2).toUpperCase();
        // Determine Default Colors based on Role or Hash?
        // Admin: Blue, others: Slate/Gray to keep it simple or match existing styles
        if (user.role === 'admin') {
            avatarData.bg = '#eff6ff'; // blue-50
            avatarData.fg = '#2563eb'; // blue-600
        } else {
            avatarData.bg = '#f1f5f9'; // slate-100
            avatarData.fg = '#475569'; // slate-600
        }
    }
    // Case 3: No avatar, use Name
    else if (user.name) {
        avatarData.text = user.name.substring(0, 2).toUpperCase();
    }

    // Size Classes
    const sizeClasses = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm font-bold',
        lg: 'w-12 h-12 text-base font-bold',
        xl: 'w-24 h-24 text-3xl font-bold'
    };

    return (
        <div
            className={`rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-sm ${sizeClasses[size] || sizeClasses['md']} ${className}`}
            style={{ backgroundColor: avatarData.bg, color: avatarData.fg }}
            title={user.name}
        >
            {avatarData.text}
        </div>
    );
};
