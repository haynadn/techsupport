import React from 'react';
import clsx from 'clsx';

export function Card({ children, className, noPadding = false }) {
    return (
        <div className={clsx("bg-white rounded-2xl border border-slate-200/60 shadow-sm", className)}>
            <div className={clsx(!noPadding && "p-6")}>
                {children}
            </div>
        </div>
    );
}
