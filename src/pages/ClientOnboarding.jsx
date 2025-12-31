import React, { useState, useEffect } from 'react';
import { formatDateDisplay } from '../utils/dateFormatter';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Rocket, Calendar, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function ClientOnboarding() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchOnboardingData();
    }, []);

    const fetchOnboardingData = async () => {
        try {
            const res = await fetch('/api/onboarding');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Error fetching onboarding data", error);
        } finally {
            setLoading(false);
        }
    };

    // Using formatDateDisplay from utils
    const getStatusColor = (status) => {
        if (status.includes('Cepat')) return 'bg-emerald-100 text-emerald-700';
        if (status === 'Tepat Waktu') return 'bg-blue-100 text-blue-700';
        if (status.includes('Telat')) return 'bg-rose-100 text-rose-700';
        return 'bg-slate-100 text-slate-700';
    };

    // Pagination Logic
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Onboarding Klien</h1>
                    <p className="text-slate-500 mt-2 text-base">Pantau progres implementasi dan training kampus.</p>
                </div>
            </div>

            <Table
                className="shadow-xl shadow-slate-200/40 border-slate-100"
                title={
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-lg">Status Onboarding</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{data.length} Total</span>
                    </div>
                }
                headers={['#', 'Nama Kampus', 'Progres Implementasi', 'Tanggal Deployment', 'Progres Training', 'Tanggal Selesai Training', 'Waktu Onboarding']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, data.length)}</span> dari <span className="font-bold text-slate-800">{data.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg font-medium text-sm transition-all duration-200 ${currentPage === page
                                            ? 'bg-sky-500 text-white shadow-md shadow-sky-200 scale-105'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            >
                {paginatedData.map((item, index) => (
                    <TableRow key={item.id}>
                        <TableCell className="w-16 font-medium text-slate-400">
                            {startIndex + index + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">{item.name}</TableCell>
                        <TableCell>
                            <div className="w-full max-w-[140px]">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-600">{item.implProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${item.implProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                {formatDateDisplay(item.deployment_date)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="w-full max-w-[140px]">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-600">{item.trainProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${item.trainProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                            {item.train_finish_date ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    {formatDateDisplay(item.train_finish_date)}
                                </div>
                            ) : '-'}
                        </TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(item.onboardingStatus)}`}>
                                {item.onboardingStatus}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
                {data.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                            Belum ada data onboarding.
                        </TableCell>
                    </TableRow>
                )}
            </Table>
        </div>
    );
}
