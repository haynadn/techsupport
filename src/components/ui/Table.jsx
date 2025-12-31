import React from 'react';
import { Card } from './Card';
import clsx from 'clsx';

export function Table({ headers, children, onAdd, title, footer, className }) {
    return (
        <Card noPadding className={clsx("overflow-hidden", className)}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{title}</h3>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Tambah Data
                    </button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            {headers.map((header, idx) => (
                                <th key={idx} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {children}
                    </tbody>
                </table>
            </div>
            {footer && (
                <div className="bg-white border-t border-slate-100 px-6 py-4">
                    {footer}
                </div>
            )}
        </Card>
    );
}

export function TableRow({ children }) {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            {children}
        </tr>
    );
}

export function TableCell({ children, className }) {
    return (
        <td className={`px-6 py-4 text-sm text-slate-600 ${className}`}>
            {children}
        </td>
    );
}
