import React from 'react';
import { X } from 'lucide-react';

const COLORS = {
    red: 'bg-red-50 text-red-700 ring-red-600/10',
    orange: 'bg-orange-50 text-orange-700 ring-orange-600/10',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/10',
    lime: 'bg-lime-50 text-lime-700 ring-lime-600/10',
    green: 'bg-green-50 text-green-700 ring-green-600/10',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    teal: 'bg-teal-50 text-teal-700 ring-teal-600/10',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-600/10',
    sky: 'bg-sky-50 text-sky-700 ring-sky-600/10',
    blue: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/10',
    violet: 'bg-violet-50 text-violet-700 ring-violet-600/10',
    purple: 'bg-purple-50 text-purple-700 ring-purple-600/10',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/10',
    pink: 'bg-pink-50 text-pink-700 ring-pink-600/10',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    slate: 'bg-slate-50 text-slate-700 ring-slate-600/10',
};

export const Tag = ({ name, color = 'slate', onRemove }) => {
    const colorClass = COLORS[color] || COLORS.slate;

    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClass}`}>
            {name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 -mr-0.5 h-3.5 w-3.5 rounded-sm hover:bg-black/10 inline-flex items-center justify-center transition-colors"
                >
                    <X size={10} />
                    <span className="sr-only">Remove</span>
                </button>
            )}
        </span>
    );
};
