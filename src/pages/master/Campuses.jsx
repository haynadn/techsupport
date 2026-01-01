import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, Building2, Check, Download, Upload } from 'lucide-react';

export default function Campuses() {
    const [campuses, setCampuses] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [appFilter, setAppFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data states
    const [currentCampus, setCurrentCampus] = useState(null);
    const [campusToDelete, setCampusToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        applications: [], // Changed from phone to array of apps
        status: 'active',
        deployment_date: ''
    });

    const AVAILABLE_APPLICATIONS = [
        "Siakad 4.0",
        "Civitas LMS",
        "E-Library",
        "E-Office",
        "Open Feeder",
        "Neo Feeder",
        "Open API"
    ];

    const fetchCampuses = () => {
        fetch('/api/campuses')
            .then(res => res.json())
            .then(data => {
                // Parse applications JSON string coming from DB
                const parsedData = data.map(campus => ({
                    ...campus,
                    applications: typeof campus.applications === 'string'
                        ? JSON.parse(campus.applications || '[]')
                        : campus.applications || []
                }));
                setCampuses(parsedData);
            })
            .catch(err => console.error('Error fetching campuses:', err));
    };

    useEffect(() => {
        fetchCampuses();
    }, []);

    // Download Template
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Kode': 'K-001',
                'Nama Kampus': 'Universitas Contoh',
                'Alamat': 'Jl. Raya No. 123, Jakarta',
                'Aplikasi': 'Siakad 4.0, E-Library',
                'Status': 'Aktif'
            }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Impor_Kampus.xlsx');
    };

    // Export to Excel
    const handleExport = () => {
        const dataToExport = campuses.map(campus => ({
            'Kode': campus.code,
            'Nama Kampus': campus.name,
            'Alamat': campus.address,
            'Aplikasi': campus.applications.join(', '),
            'Status': campus.status === 'active' ? 'Aktif' : 'Non-Aktif'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, 'Daftar Kampus');
        XLSX.writeFile(wb, 'Daftar_Kampus.xlsx');
        showNotification('Data kampus berhasil diekspor ke Excel');
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

            // Structure data for bulk insert
            const formattedData = data.map(row => ({
                code: row['Kode'] || row['kode'] || '',
                name: row['Nama Kampus'] || row['nama'] || '',
                address: row['Alamat'] || row['alamat'] || '',
                applications: row['Aplikasi'] ? row['Aplikasi'].split(',').map(s => s.trim()) : [],
                status: (row['Status'] === 'Aktif' || row['status'] === 'active') ? 'active' : 'inactive'
            }));

            if (formattedData.length > 0) {
                fetch('/api/campuses/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formattedData)
                })
                    .then(res => res.json())
                    .then(result => {
                        fetchCampuses();
                        showNotification(`Berhasil mengimpor ${result.count} data kampus`);
                    })
                    .catch(err => {
                        console.error('Import error:', err);
                        showNotification('Gagal mengimpor data', 'error');
                    });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null; // Reset file input
    };

    // Filter Logic
    const filteredCampuses = campuses.filter(campus => {
        const matchesSearch = campus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campus.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campus.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? campus.status === statusFilter : true;
        const matchesApp = appFilter ? campus.applications && campus.applications.includes(appFilter) : true;
        return matchesSearch && matchesStatus && matchesApp;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredCampuses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCampuses = filteredCampuses.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, appFilter]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleOpenModal = (campus = null) => {
        if (campus) {
            setCurrentCampus(campus);
            setFormData({
                code: campus.code,
                name: campus.name,
                address: campus.address,
                applications: campus.applications || [],
                status: campus.status,
                deployment_date: campus.deployment_date ? new Date(campus.deployment_date).toISOString().split('T')[0] : ''
            });
        } else {
            setCurrentCampus(null);
            setFormData({
                code: '',
                name: '',
                address: '',
                applications: [],
                status: 'active',
                deployment_date: ''
            });
        }
        setIsModalOpen(true);
    };

    const toggleApplication = (app) => {
        setFormData(prev => {
            const exists = prev.applications.includes(app);
            if (exists) {
                return { ...prev, applications: prev.applications.filter(a => a !== app) };
            } else {
                return { ...prev, applications: [...prev.applications, app] };
            }
        });
    };

    const confirmDelete = (campus) => {
        setCampusToDelete(campus);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!campusToDelete) return;

        try {
            await fetch(`/api/campuses/${campusToDelete.id}`, { method: 'DELETE' });
            fetchCampuses();
            showNotification('Data kampus berhasil dihapus');
            setIsDeleteModalOpen(false);
            setCampusToDelete(null);
        } catch (error) {
            console.error('Error deleting campus:', error);
            showNotification('Gagal menghapus data kampus', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentCampus
                ? `/api/campuses/${currentCampus.id}`
                : '/api/campuses';

            const method = currentCampus ? 'PUT' : 'POST';

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            setIsModalOpen(false);
            fetchCampuses();
            showNotification(currentCampus ? 'Data kampus berhasil diperbarui' : 'Kampus baru berhasil ditambahkan');
        } catch (error) {
            console.error('Error saving campus:', error);
            showNotification('Gagal menyimpan data kampus', 'error');
        }
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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Kampus</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola data lokasi kampus, aplikasi terdaftar, serta ekspor & impor data.</p>
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
                        Tambah Kampus
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
                        placeholder="Cari nama, kode, atau alamat..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-64 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={appFilter}
                        onChange={(e) => setAppFilter(e.target.value)}
                    >
                        <option value="">Semua Aplikasi</option>
                        {AVAILABLE_APPLICATIONS.map(app => (
                            <option key={app} value={app}>{app}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                <div className="w-full sm:w-48 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Non-Aktif</option>
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
                        <span className="font-bold text-slate-800 text-lg">Data Kampus</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{filteredCampuses.length} Total</span>
                    </div>
                }
                headers={['#', 'Kode', 'Nama Kampus', 'Alamat', 'Aplikasi', 'Status', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredCampuses.length)}</span> dari <span className="font-bold text-slate-800">{filteredCampuses.length}</span>
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
                {paginatedCampuses.map((campus, index) => (
                    <TableRow key={campus.id}>
                        <TableCell className="w-16 font-medium text-slate-400">
                            {startIndex + index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-slate-500 text-sm">
                            {campus.code}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm border border-sky-100">
                                    <Building2 size={18} />
                                </div>
                                <div className="font-semibold text-slate-800">{campus.name}</div>
                            </div>
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-xs truncate" title={campus.address}>
                            {campus.address}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {campus.applications && campus.applications.length > 0 ? (
                                    campus.applications.slice(0, 3).map((app, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded textxs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {app}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-slate-400 italic text-xs">Tidak ada aplikasi</span>
                                )}
                                {campus.applications && campus.applications.length > 3 && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-400 border border-slate-100">
                                        +{campus.applications.length - 3}
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${campus.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                                <span className={`text-sm font-medium ${campus.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {campus.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => handleOpenModal(campus)}
                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                                    title="Edit Kampus"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(campus)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                    title="Hapus Kampus"
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
                title={currentCampus ? 'Edit Kampus' : 'Tambah Kampus Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kode</label>
                            <input
                                type="text"
                                required
                                placeholder="CTH: K-01"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kampus</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    {/* Multi-select Applications */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Aplikasi Terdaftar</label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {AVAILABLE_APPLICATIONS.map((app) => (
                                <button
                                    key={app}
                                    type="button"
                                    onClick={() => toggleApplication(app)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${formData.applications.includes(app)
                                        ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <span>{app}</span>
                                    {formData.applications.includes(app) && (
                                        <Check size={16} className="text-sky-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5 px-1">
                            Pilih aplikasi yang digunakan oleh kampus ini.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Non-Aktif</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Deployment</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.deployment_date}
                                onChange={(e) => setFormData({ ...formData, deployment_date: e.target.value })}
                            />
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
                        Apakah Anda yakin ingin menghapus kampus <strong>{campusToDelete?.name}</strong>?
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
