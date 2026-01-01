import React, { useState, useEffect } from 'react';
import { formatDateDisplay } from '../../utils/dateFormatter';
import * as XLSX from 'xlsx';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, ChevronLeft, ChevronRight, Calendar, Filter, Download, Upload, ChevronDown } from 'lucide-react';

export default function Holidays() {
    const [holidays, setHolidays] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data states
    const [currentHoliday, setCurrentHoliday] = useState(null);
    const [holidayToDelete, setHolidayToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        date: ''
    });

    const months = [
        { value: '01', label: 'Januari' },
        { value: '02', label: 'Februari' },
        { value: '03', label: 'Maret' },
        { value: '04', label: 'April' },
        { value: '05', label: 'Mei' },
        { value: '06', label: 'Juni' },
        { value: '07', label: 'Juli' },
        { value: '08', label: 'Agustus' },
        { value: '09', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    const fetchHolidays = () => {
        const token = localStorage.getItem('token');
        fetch('/api/holidays', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setHolidays(data))
            .catch(err => console.error('Error fetching holidays:', err));
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    // Filter Logic
    const filteredHolidays = holidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        const month = (holidayDate.getMonth() + 1).toString().padStart(2, '0');
        const year = holidayDate.getFullYear().toString();

        const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = selectedMonth ? month === selectedMonth : true;
        const matchesYear = selectedYear ? year === selectedYear : true;

        return matchesSearch && matchesMonth && matchesYear;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHolidays = filteredHolidays.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedMonth, selectedYear]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Download Template
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Tanggal': '2025-12-25',
                'Keterangan': 'Hari Raya Natal'
            }
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Impor_Hari_Libur.xlsx');
    };

    // Export to Excel
    const handleExport = () => {
        const dataToExport = filteredHolidays.map(holiday => ({
            'Tanggal': holiday.date,
            'Keterangan': holiday.name
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, 'Hari_Libur');
        XLSX.writeFile(wb, 'Daftar_Hari_Libur.xlsx');
        showNotification('Data hari libur berhasil diekspor');
    };

    // Import from Excel
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const formattedData = data.map(row => ({
                date: row['Tanggal'], // Ensure format is YYYY-MM-DD in Excel or handle parsing
                name: row['Keterangan']
            }));

            if (formattedData.length > 0) {
                const token = localStorage.getItem('token');
                fetch('/api/holidays/bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formattedData)
                })
                    .then(res => res.json())
                    .then(result => {
                        fetchHolidays();
                        showNotification(`Berhasil mengimpor ${result.count} hari libur`);
                    })
                    .catch(err => {
                        console.error('Import error:', err);
                        showNotification('Gagal mengimpor data', 'error');
                    });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };

    const handleOpenModal = (holiday = null) => {
        if (holiday) {
            setCurrentHoliday(holiday);
            const dateObj = new Date(holiday.date);
            const formattedDate = dateObj.toISOString().split('T')[0];
            setFormData({ name: holiday.name, date: formattedDate });
        } else {
            setCurrentHoliday(null);
            setFormData({ name: '', date: '' });
        }
        setIsModalOpen(true);
    };

    const confirmDelete = (holiday) => {
        setHolidayToDelete(holiday);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!holidayToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/holidays/${holidayToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchHolidays();
            showNotification('Data hari libur berhasil dihapus');
            setIsDeleteModalOpen(false);
            setHolidayToDelete(null);
        } catch (error) {
            console.error('Error deleting holiday:', error);
            showNotification('Gagal menghapus data hari libur', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentHoliday
                ? `/api/holidays/${currentHoliday.id}`
                : '/api/holidays';

            const method = currentHoliday ? 'PUT' : 'POST';

            const token = localStorage.getItem('token');
            await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            setIsModalOpen(false);
            fetchHolidays();
            showNotification(currentHoliday ? 'Data hari libur berhasil diperbarui' : 'Hari libur baru berhasil ditambahkan');
        } catch (error) {
            console.error('Error saving holiday:', error);
            showNotification('Gagal menyimpan data hari libur', 'error');
        }
    };

    // Using formatDateDisplay from utils

    return (
        <div className="space-y-8 animate-fade-in">
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hari Libur</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola daftar hari libur nasional.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
                        title="Download Template"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Template</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
                        title="Export Excel"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <label className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                        <Upload size={18} />
                        <span className="hidden sm:inline">Import</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                    </label>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5 transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Tambah
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama hari libur..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full sm:w-48 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="">Semua Bulan</option>
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                <div className="w-full sm:w-32 relative group">
                    <select
                        className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="">Semua Tahun</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>
            </div>

            <Table
                className="shadow-xl shadow-slate-200/40 border-slate-100"
                title={
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-lg">Daftar Hari Libur</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{filteredHolidays.length} Total</span>
                    </div>
                }
                headers={['#', 'Tanggal', 'Nama Hari Libur', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredHolidays.length)}</span> dari <span className="font-bold text-slate-800">{filteredHolidays.length}</span>
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
                {paginatedHolidays.map((holiday, index) => (
                    <TableRow key={holiday.id}>
                        <TableCell className="w-16 font-medium text-slate-400">
                            {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm border border-sky-100">
                                    <Calendar size={18} />
                                </div>
                                <div className="font-medium text-slate-700">{formatDateDisplay(holiday.date)}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-semibold text-slate-800">{holiday.name}</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => handleOpenModal(holiday)}
                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                                    title="Edit Hari Libur"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(holiday)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                    title="Hapus Hari Libur"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            {/* Input/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Hari Libur</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Tahun Baru Masehi"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-sky-500 text-white font-medium hover:bg-sky-600 rounded-lg shadow-sm shadow-sky-200 transition-colors"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Konfirmasi Hapus"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-rose-50 text-rose-700 rounded-xl">
                        <AlertTriangle className="shrink-0" />
                        <p className="text-sm font-medium">Tindakan ini tidak dapat dibatalkan.</p>
                    </div>
                    <p className="text-slate-600">
                        Apakah Anda yakin ingin menghapus hari libur <strong>{holidayToDelete?.name}</strong>?
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-200 transition-colors"
                        >
                            Hapus Permanen
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
