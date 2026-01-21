import React from 'react';

export const Badge = ({ children, type = 'default' }) => {
    const styles = {
        default: "bg-slate-100 text-slate-600",
        success: "bg-green-100 text-green-700",
        warning: "bg-yellow-100 text-yellow-700",
        danger: "bg-red-100 text-red-700",
        error: "bg-red-100 text-red-700",
        primary: "bg-blue-100 text-blue-700",
        info: "bg-blue-100 text-blue-700",
    };
    return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[type] || styles.default}`}>
            {children}
        </span>
    );
};
