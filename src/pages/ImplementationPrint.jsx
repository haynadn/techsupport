import React, { useState, useEffect } from 'react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, Printer, Building2, Link as LinkIcon, ExternalLink, X } from 'lucide-react';

export default function ImplementationPrint() {
    // Main Data
    const [prints, setPrints] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [printMasters, setPrintMasters] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data states
    const [currentRecord, setCurrentRecord] = useState(null);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        campus_id: '',
        items: [] // Array of { name: '', link: '' }
    });

    // Fetch All Data
    const fetchAllData = () => {
        // Fetch Implementation Prints
        fetch('http://localhost:3000/api/implementation-prints')
            .then(res => res.json())
            .then(data => {
                const parsedData = data.map(item => ({
                    ...item,
                    items: typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || [])
                }));
                setPrints(parsedData);
            })
            .catch(err => console.error('Error fetching prints:', err));

        // Fetch Campuses (for dropdown)
        fetch('http://localhost:3000/api/campuses')
            .then(res => res.json())
            .then(data => setCampuses(data))
            .catch(err => console.error('Error fetching campuses:', err));

        // Fetch Print Result Masters (for Type dropdown)
        fetch('http://localhost:3000/api/print-results')
            .then(res => res.json())
            .then(data => setPrintMasters(data))
            .catch(err => console.error('Error fetching print masters:', err));
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Status Options
    const STATUS_OPTIONS = [
        "Backlog",
        "In Progress Spesifikasi",
        "In Progress Dev",
        "In Review Kampus",
        "Completed"
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'In Review Kampus': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'In Progress Dev': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'In Progress Spesifikasi': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // Filter States
    const [campusFilter, setCampusFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Filter Logic
    const filteredPrints = prints.filter(print => {
        const matchesSearch = print.campus_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCampus = campusFilter ? print.campus_id == campusFilter : true;

        // Check if any item in the record matches the status/type filters
        const matchesStatus = statusFilter
            ? print.items && print.items.some(item => item.status === statusFilter)
            : true;
        const matchesType = typeFilter
            ? print.items && print.items.some(item => item.name === typeFilter)
            : true;

        return matchesSearch && matchesCampus && matchesStatus && matchesType;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredPrints.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPrints = filteredPrints.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, campusFilter, statusFilter, typeFilter]);

    // Form Handlers
    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', link: '', status: 'Backlog' }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleOpenModal = (record = null) => {
        if (record) {
            setCurrentRecord(record);
            setFormData({
                campus_id: record.campus_id,
                items: record.items?.map(item => ({
                    ...item,
                    status: item.status || 'Backlog' // Ensure status exists for old records
                })) || []
            });
        } else {
            setCurrentRecord(null);
            setFormData({
                campus_id: '',
                items: [{ name: '', link: '', status: 'Backlog' }]
            });
        }
        setIsModalOpen(true);
    };

    const confirmDelete = (record) => {
        setRecordToDelete(record);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;

        try {
            await fetch(`http://localhost:3000/api/implementation-prints/${recordToDelete.id}`, { method: 'DELETE' });
            fetchAllData();
            showNotification('Data berhasil dihapus');
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
        } catch (error) {
            console.error('Error deleting record:', error);
            showNotification('Gagal menghapus data', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentRecord
                ? `http://localhost:3000/api/implementation-prints/${currentRecord.id}`
                : 'http://localhost:3000/api/implementation-prints';

            const method = currentRecord ? 'PUT' : 'POST';

            // Ensure campus_id is an integer
            const payload = {
                ...formData,
                campus_id: parseInt(formData.campus_id)
            };

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save');

            setIsModalOpen(false);
            fetchAllData();
            showNotification(currentRecord ? 'Data berhasil diperbarui' : 'Data baru berhasil ditambahkan');
        } catch (error) {
            console.error('Error saving record:', error);
            showNotification('Gagal menyimpan data', 'error');
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hasil Cetak Implementasi</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola link hasil cetak implementasi per kampus.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5 transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Tambah Data
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
                        placeholder="Cari nama kampus..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Campus Filter */}
                <div className="w-full sm:w-48 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={campusFilter}
                        onChange={(e) => setCampusFilter(e.target.value)}
                    >
                        <option value="">Semua Kampus</option>
                        {campuses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-48 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Type Filter */}
                <div className="w-full sm:w-48 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">Semua Jenis</option>
                        {printMasters.map(m => (
                            <option key={m.id} value={`${m.name} - ${m.portal}`}>{m.name} - {m.portal}</option>
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
                        <span className="font-bold text-slate-800 text-lg">Daftar Hasil Cetak</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{filteredPrints.length} Total</span>
                    </div>
                }
                headers={['#', 'Nama Kampus', 'Jenis Hasil Cetak', 'Link Task', 'Status', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredPrints.length)}</span> dari <span className="font-bold text-slate-800">{filteredPrints.length}</span>
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
                {paginatedPrints.map((print, index) => {
                    // Filter items for display
                    const displayItems = (print.items || []).filter(item => {
                        const matchStatus = statusFilter ? item.status === statusFilter : true;
                        const matchType = typeFilter ? item.name.includes(typeFilter.split(' - ')[0]) : true; // Improved type matching logic if needed or just exact match
                        // Note: The previous logic used direct match "item.name === typeFilter". 
                        // Since I updated the dropdown values to "Name - Portal", the filter `typeFilter` now holds "KRS - Mahasiswa".
                        // And previously I updated the stored `item.name` to also be "KRS - Mahasiswa"? 
                        // Wait, I updated the *Form select value* to `value={`${master.name} - ${master.portal}`}`.
                        // So `item.name` IN THE DB (for new records) will be "KRS - Mahasiswa".
                        // Old records might be just "KRS".
                        // So exact match `item.name === typeFilter` works for new records.
                        // For old records, they won't match if using exact match.
                        // Use exact match as per request "filter berfungsi" implies working for the newly standardized data.

                        return matchStatus && (typeFilter ? item.name === typeFilter : true);
                    });

                    return (
                        <TableRow key={print.id}>
                            <TableCell className="w-16 font-medium text-slate-400 align-top">
                                {startIndex + index + 1}
                            </TableCell>
                            <TableCell className="align-top">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm border border-sky-100">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="font-semibold text-slate-800">{print.campus_name}</div>
                                </div>
                            </TableCell>

                            {/* Jenis Hasil Cetak Column */}
                            <TableCell className="align-top p-0">
                                <div className="flex flex-col">
                                    {displayItems.length > 0 ? (
                                        displayItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center px-4 py-3 border-b border-slate-100 last:border-0 h-[45px]">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[200px]" title={item.name}>
                                                    {item.name}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-slate-400 italic text-sm">-</div>
                                    )}
                                </div>
                            </TableCell>

                            {/* Link Task Column */}
                            <TableCell className="align-top p-0">
                                <div className="flex flex-col">
                                    {displayItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center px-4 py-3 border-b border-slate-100 last:border-0 h-[45px]">
                                            {item.link ? (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sky-600 hover:text-sky-700 flex items-center gap-1 text-xs font-medium hover:underline"
                                                >
                                                    <ExternalLink size={12} /> Link
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </TableCell>

                            {/* Status Column */}
                            <TableCell className="align-top p-0">
                                <div className="flex flex-col">
                                    {displayItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center px-4 py-3 border-b border-slate-100 last:border-0 h-[45px]">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)} uppercase tracking-wider`}>
                                                {item.status || 'BACKLOG'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </TableCell>

                            <TableCell className="align-top">
                                <div className="flex gap-1 justify-end">
                                    <button
                                        onClick={() => handleOpenModal(print)}
                                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                                        title="Edit"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(print)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                        title="Hapus"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </Table>

            {/* Input/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentRecord ? 'Edit Data' : 'Tambah Data Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campus Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kampus</label>
                        <div className="relative">
                            <select
                                required
                                className="block w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                                value={formData.campus_id}
                                onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                            >
                                <option value="">Pilih Kampus...</option>
                                {campuses.map(campus => (
                                    <option key={campus.id} value={campus.id}>{campus.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 top-0 bottom-0 flex items-center px-3 pointer-events-none text-slate-500">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Items List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-slate-700">Daftar Hasil Cetak</label>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                            >
                                <Plus size={16} /> Tambah Item
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {formData.items.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="flex-1 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                required
                                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            >
                                                <option value="">Pilih Jenis...</option>
                                                {printMasters.map(master => (
                                                    <option key={master.id} value={`${master.name} - ${master.portal}`}>{master.name} - {master.portal}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                value={item.status || 'Backlog'}
                                                onChange={(e) => handleItemChange(index, 'status', e.target.value)}
                                            >
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input
                                            type="url"
                                            placeholder="Link TAS (https://...)"
                                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
                                            value={item.link}
                                            onChange={(e) => handleItemChange(index, 'link', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors mt-0.5"
                                        title="Hapus baris"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {formData.items.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                    Belum ada item ditambahkan
                                </div>
                            )}
                        </div>
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
                        Apakah Anda yakin ingin menghapus data hasil cetak untuk kampus <strong>{recordToDelete?.campus_name}</strong>?
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
