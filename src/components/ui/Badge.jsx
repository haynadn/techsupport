import React from 'react';
import clsx from 'clsx';

export function Badge({ children, color = 'slate' }) {
    const colors = {
        slate: 'bg-slate-100 text-slate-600',
        sky: 'bg-sky-100 text-sky-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        rose: 'bg-rose-100 text-rose-700',
    };

    return (
        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium", colors[color] || colors.slate)}>
            {children}
        </span>
    );
}
