import React, { useState, useEffect } from 'react';
import { formatDateDisplay, formatDateForInput } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, Filter, Calendar, MapPin, User, FileText, CheckCircle, XCircle, Clock, Building2, Download, Upload, ChevronDown, ChevronLeft, ChevronRight, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function Training() {
    const [tickets, setTickets] = useState([]);

    // Dropdown Data
    const [campuses, setCampuses] = useState([]);
    const [trainers, setTrainers] = useState([]); // from agents
    const [materials, setMaterials] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCampus, setFilterCampus] = useState('');
    const [filterMaterial, setFilterMaterial] = useState('');
    const [filterMinutesLink, setFilterMinutesLink] = useState(''); // New filter for minutes link

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data states
    const [currentTicket, setCurrentTicket] = useState(null);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        ticket_number: '', // Added ticket_number
        campus_id: '',
        agent_id: '', // Changed from trainer_id to match DB/API
        material_id: '',
        method: 'Online',
        status: 'backlog',
        date: '',
        notes: '',
        minutes_link: '' // Added minutes_link
    });

    const statusColors = {
        backlog: 'bg-slate-100 text-slate-700',
        todo: 'bg-blue-100 text-blue-700',
        inprogress: 'bg-amber-100 text-amber-700',
        done: 'bg-emerald-100 text-emerald-700',
        cancel: 'bg-rose-100 text-rose-700'
    };

    const methodOptions = ['Online', 'Offline dikantor', 'Offline diluar kantor'];
    const statusOptions = ['backlog', 'todo', 'inprogress', 'cancel', 'done'];

    // Fetch all required data
    const fetchAllData = () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Tickets
        fetch('/api/training-tickets', { headers })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTickets(data);
                } else {
                    console.error('Expected array for tickets, got:', data);
                    setTickets([]);
                }
            })
            .catch(err => {
                console.error('Error fetching tickets:', err);
                setTickets([]);
            });

        // Fetch Master Data for Dropdowns
        fetch('/api/campuses', { headers }).then(res => res.json()).then(setCampuses);
        fetch('/api/agents', { headers }).then(res => res.json()).then(setTrainers);
        fetch('/api/materials', { headers }).then(res => res.json()).then(setMaterials);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Filter Logic
    const filteredTickets = tickets.filter(ticket => {
        const ticketDate = ticket.date ? new Date(ticket.date).toISOString().split('T')[0] : '';

        // Search by multiple fields (Agent Name, Campus Name, Material Name)
        const matchesSearch = searchTerm === '' ||
            (ticket.agent_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (ticket.campus_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesDate = filterDate ? ticketDate === filterDate : true;
        const matchesStatus = filterStatus ? ticket.status === filterStatus : true;
        const matchesCampus = filterCampus ? ticket.campus_id == filterCampus : true;
        const matchesMaterial = filterMaterial ? ticket.material_id == filterMaterial : true;

        let matchesMinutesLink = true;
        if (filterMinutesLink === 'has_link') {
            matchesMinutesLink = ticket.minutes_link && ticket.minutes_link.trim() !== '';
        } else if (filterMinutesLink === 'no_link') {
            matchesMinutesLink = !ticket.minutes_link || ticket.minutes_link.trim() === '';
        }

        return matchesSearch && matchesDate && matchesStatus && matchesCampus && matchesMaterial && matchesMinutesLink;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDate, filterStatus, filterCampus, filterMaterial, filterMinutesLink]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Download Template
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                'Campus Code': 'KMP1001',
                'Trainer Email': 'budi.santoso@example.com',
                'Material Name': 'Panduan SIAKAD',
                'Method': 'Online',
                'Status': 'todo',
                'Date': '2025-12-30',
                'Minutes Link': 'https://example.com/minutes'
            }
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Template_Impor_Ticket_Training.xlsx');
    };

    // Export to Excel
    const handleExport = () => {
        const dataToExport = filteredTickets.map(t => ({
            'Tanggal': formatDateDisplay(t.date),
            'Kampus': t.campus_name,
            'Trainer': t.agent_name,
            'Materi': t.material_name,
            'Metode': t.method,
            'Status': t.status,
            'Link Berita Acara': t.minutes_link || '-'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
        XLSX.writeFile(wb, 'Daftar_Ticket_Training.xlsx');
        showNotification('Data ticket berhasil diekspor');
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

            const formattedData = data.map(row => {
                const campus = campuses.find(c => c.code === row['Campus Code'] || c.name === row['Kampus']);
                const trainer = trainers.find(t => t.email === row['Trainer Email'] || t.name === row['Trainer']);
                const material = materials.find(m => m.name === row['Material Name'] || m.name === row['Materi']);

                return {
                    campus_id: campus?.id,
                    agent_id: trainer?.id,
                    material_id: material?.id,
                    method: row['Method'] || 'Online',
                    status: row['Status'] || 'backlog',
                    date: row['Date'],
                    minutes_link: row['Minutes Link'] || ''
                };
            }).filter(d => d.campus_id && d.agent_id && d.material_id);

            if (formattedData.length > 0) {
                const token = localStorage.getItem('token');
                fetch('/api/training-tickets/bulk', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formattedData)
                })
                    .then(res => res.json())
                    .then(result => {
                        fetchAllData();
                        showNotification(`Berhasil mengimpor ${result.count} ticket`);
                    })
                    .catch(err => {
                        console.error('Import error:', err);
                        showNotification('Gagal mengimpor data', 'error');
                    });
            } else {
                showNotification('Tidak ada data valid yang ditemukan (Cek Kampus/Trainer/Materi)', 'error');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = null;
    };


    const handleOpenModal = (ticket = null) => {
        if (ticket) {
            setCurrentTicket(ticket);
            setFormData({
                ticket_number: ticket.ticket_number || '', // Include ticket_number
                campus_id: ticket.campus_id,
                agent_id: ticket.agent_id,
                material_id: ticket.material_id,
                method: ticket.method,
                status: ticket.status,
                date: ticket.date ? new Date(ticket.date).toISOString().split('T')[0] : '',
                notes: ticket.notes || '',
                minutes_link: ticket.minutes_link || ''
            });
        } else {
            setCurrentTicket(null);
            setFormData({
                ticket_number: `TKT-${Date.now()}`, // Generate simple ticket number
                campus_id: '',
                agent_id: '',
                material_id: '',
                method: 'Online',
                status: 'backlog',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                minutes_link: ''
            });
        }
        setIsModalOpen(true);
    };

    const confirmDelete = (ticket) => {
        setTicketToDelete(ticket);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!ticketToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/training-tickets/${ticketToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAllData();
            showNotification('Ticket berhasil dihapus');
            setIsDeleteModalOpen(false);
            setTicketToDelete(null);
        } catch (error) {
            console.error('Error deleting ticket:', error);
            showNotification('Gagal menghapus ticket', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentTicket
                ? `/api/training-tickets/${currentTicket.id}`
                : '/api/training-tickets';

            const method = currentTicket ? 'PUT' : 'POST';

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
            fetchAllData();
            showNotification(currentTicket ? 'Ticket berhasil diperbarui' : 'Ticket baru berhasil dibuat');
        } catch (error) {
            console.error('Error saving ticket:', error);
            showNotification('Gagal menyimpan ticket', 'error');
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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Training & Meeting</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola jadwal training dan meeting kampus.</p>
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
                        Buat Ticket
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
                {/* Search */}
                <div className="relative group col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari Trainer/Kampus..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Date Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input
                        type="date"
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Campus Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filterCampus}
                        onChange={(e) => setFilterCampus(e.target.value)}
                    >
                        <option value="">Semua Kampus</option>
                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Material Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filterMaterial}
                        onChange={(e) => setFilterMaterial(e.target.value)}
                    >
                        <option value="">Semua Materi</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Minutes Link Filter */}
                <div className="relative group lg:col-span-5">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filterMinutesLink}
                        onChange={(e) => setFilterMinutesLink(e.target.value)}
                    >
                        <option value="">Semua Berita Acara</option>
                        <option value="has_link">Sudah ada Link</option>
                        <option value="no_link">Belum ada Link</option>
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
                        <span className="font-bold text-slate-800 text-lg">Daftar Ticket</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{filteredTickets.length} Total</span>
                    </div>
                }
                headers={['#', 'ID', 'Tanggal', 'Kampus', 'Trainer', 'Materi', 'Metode', 'Status', 'Berita Acara', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredTickets.length)}</span> dari <span className="font-bold text-slate-800">{filteredTickets.length}</span>
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
                {paginatedTickets.map((ticket, index) => (
                    <TableRow key={ticket.id}>
                        <TableCell className="w-12 font-medium text-slate-400">
                            {startIndex + index + 1}
                        </TableCell>
                        <TableCell className="w-16 font-bold text-slate-500">#{ticket.id}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-800">{formatDateDisplay(ticket.date)}</span>
                                {ticket.date_closed && (ticket.status === 'done' || ticket.status === 'cancel') && (
                                    <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                        <CheckCircle size={10} /> Closed: {formatDateDisplay(ticket.date_closed)}
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-slate-400" />
                                <span className="font-medium text-slate-700">{ticket.campus_name || '-'}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-slate-400" />
                                <span className="text-slate-700">{ticket.agent_name || '-'}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                <span className="text-slate-600 text-sm max-w-[200px] truncate" title={ticket.material_name}>{ticket.material_name || '-'}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                {ticket.method}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[ticket.status] || 'bg-slate-100 text-slate-600'}`}>
                                {ticket.status}
                            </span>
                        </TableCell>
                        <TableCell>
                            {ticket.minutes_link ? (
                                <a
                                    href={ticket.minutes_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-colors font-medium text-sm"
                                >
                                    <ExternalLink size={14} />
                                    Link
                                </a>
                            ) : (
                                <span className="text-slate-400 italic text-sm">Belum ada berita acara</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => handleOpenModal(ticket)}
                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                                    title="Edit Ticket"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(ticket)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                    title="Hapus Ticket"
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
                title={currentTicket ? 'Edit Ticket Training' : 'Buat Ticket Training Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kegiatan</label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kampus</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.campus_id}
                            onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                        >
                            <option value="">Pilih Kampus...</option>
                            {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trainer (Agen)</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.agent_id}
                            onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                        >
                            <option value="">Pilih Trainer...</option>
                            {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Materi Training</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.material_id}
                            onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                        >
                            <option value="">Pilih Materi...</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Metode</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.method}
                            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                        >
                            {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {currentTicket && ( // Check if editing
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Link Berita Acara <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon size={16} className="text-slate-400" />
                                </div>
                                <input
                                    type="url"
                                    required // Mandatory on edit
                                    placeholder="https://..."
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    value={formData.minutes_link}
                                    onChange={(e) => setFormData({ ...formData, minutes_link: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Masukkan link Google Drive, Docs, atau penyimpanan lainnya.
                            </p>
                        </div>
                    )}

                    {!currentTicket && ( // Optional or hidden on create? User said "when edit... required". I'll show it as optional or just hide it on create to keep it simple, or show optional. 
                        // Let's show it as optional on Create, or just include it.
                        // "ketika edit data tampil field Link Berita Acara dan wajib diisi" -> implies it might NOT appear on create, or appear but not required.
                        // I will ADD it to create as well but not required, or maybe hide it? 
                        // Usually minutes come later. I'll include it but not required on create.
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Link Berita Acara (Opsional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon size={16} className="text-slate-400" />
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    value={formData.minutes_link}
                                    onChange={(e) => setFormData({ ...formData, minutes_link: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

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
                        Apakah Anda yakin ingin menghapus ticket #<strong>{ticketToDelete?.id}</strong>?
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
                            Hapus Ticket
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
