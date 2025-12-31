import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

export function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto close after 3 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    return createPortal(
        <div className="fixed top-4 right-4 z-[110] flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100 animate-slide-in">
            {type === 'success' ? (
                <CheckCircle className="text-emerald-500" size={20} />
            ) : (
                <XCircle className="text-rose-500" size={20} />
            )}
            <div>
                <h4 className={clsx("font-medium text-sm", type === 'success' ? "text-emerald-900" : "text-rose-900")}>
                    {type === 'success' ? 'Berhasil' : 'Gagal'}
                </h4>
                <p className="text-slate-500 text-xs">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                <X size={16} />
            </button>
        </div>,
        document.body
    );
}
