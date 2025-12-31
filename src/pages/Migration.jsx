import React, { useState, useEffect } from 'react';
import { formatDateDisplay, formatDateForInput as formatDateInput } from '../utils/dateFormatter';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, ExternalLink, Filter, Calendar as CalendarIcon, User, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export default function Migration() {
    const [migrations, setMigrations] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [agents, setAgents] = useState([]);
    const [slas, setSlas] = useState([]);

    const [filteredMigrations, setFilteredMigrations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [filters, setFilters] = useState({
        campus: '',
        type: '',
        condition: '',
        specialist: '',
        status: '',
        deadline: '',
        performance: ''
    });

    const [deletedItemIds, setDeletedItemIds] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        campus_id: '',
        items: [{
            sla_id: '',
            specialist_id: '',
            verifier_id: '',
            status: 'backlog',
            link_task: '',
            deadline: ''
        }]
    });

    const statusOptions = [
        'backlog', 'todo', 'in_progress', 'in_deployment',
        'checking_after', 'verifikasi', 'cancel', 'completed'
    ];

    const conditionOptions = Array.from({ length: 9 }, (_, i) => `Ke-${i + 1}`);

    const formatStatus = (status) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // formatDateForInput is now imported as formatDateInput from utils

    const formatDateTable = (dateString) => {
        return formatDateDisplay(dateString);
    };

    const getStatusColor = (status) => {
        const colors = {
            'backlog': 'bg-slate-100 text-slate-700 border-slate-200',
            'todo': 'bg-blue-50 text-blue-700 border-blue-200',
            'in_progress': 'bg-sky-50 text-sky-700 border-sky-200',
            'in_deployment': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'checking_after': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'verifikasi': 'bg-orange-50 text-orange-700 border-orange-200',
            'cancel': 'bg-rose-50 text-rose-700 border-rose-200',
            'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const fetchAllData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const results = await Promise.allSettled([
                fetch('/api/migrations', { headers }),
                fetch('/api/campuses', { headers }),
                fetch('/api/agents', { headers }),
                fetch('/api/slas', { headers })
            ]);

            const [mgrRes, campRes, agentRes, slaRes] = results;

            if (mgrRes.status === 'fulfilled' && mgrRes.value.ok) {
                const data = await mgrRes.value.json();
                setMigrations(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch migrations', mgrRes);
            }

            if (campRes.status === 'fulfilled' && campRes.value.ok) {
                const data = await campRes.value.json();
                setCampuses(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch campuses', campRes);
            }

            if (agentRes.status === 'fulfilled' && agentRes.value.ok) {
                const data = await agentRes.value.json();
                setAgents(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch agents', agentRes);
            }

            if (slaRes.status === 'fulfilled' && slaRes.value.ok) {
                const data = await slaRes.value.json();
                setSlas(Array.isArray(data) ? data.filter(s => s.category === 'Migrasi') : []);
            } else {
                console.error('Failed to fetch SLAs', slaRes);
            }

        } catch (error) {
            console.error("Error organizing data:", error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const calculatePerformance = (item) => {
        if (!item.deadline) return 'none';
        if (item.status !== 'completed' && item.status !== 'cancel') return 'none';

        const deadlineStr = formatDateInput(item.deadline);
        const completedStr = formatDateInput(item.completed_at);

        if (!completedStr) return 'none';
        if (completedStr === deadlineStr) return 'on_time';

        const dDeadline = new Date(deadlineStr);
        const dCompleted = new Date(completedStr);

        return dCompleted > dDeadline ? 'late' : 'fast';
    };

    useEffect(() => {
        const filtered = migrations.filter(item => {
            const perf = calculatePerformance(item);
            const itemDate = item.deadline ? formatDateInput(item.deadline) : '';

            // Filter Logic
            const matchCampus = item.campus_name?.toLowerCase().includes(filters.campus.toLowerCase());
            const matchType = filters.type === '' || String(item.sla_id) === String(filters.type);
            const matchCondition = filters.condition === '' || item.migration_condition === filters.condition;
            const matchSpecialist = filters.specialist === '' || String(item.specialist_id) === String(filters.specialist);
            const matchStatus = filters.status === '' || item.status === filters.status;
            const matchDeadline = filters.deadline === '' || itemDate === filters.deadline;
            const matchPerf = filters.performance === '' || perf === filters.performance;

            return matchCampus && matchType && matchCondition && matchSpecialist && matchStatus && matchDeadline && matchPerf;
        });
        setFilteredMigrations(filtered);
        setCurrentPage(1);
    }, [filters, migrations]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleOpenModal = (group = null) => {
        setDeletedItemIds([]);
        if (group) {
            setCurrentRecord(group);
            setFormData({
                campus_id: group.campus_id,
                items: group.items.map(item => ({
                    id: item.id,
                    sla_id: item.sla_id,
                    migration_condition: item.migration_condition || '',
                    specialist_id: item.specialist_id,
                    verifier_id: item.verifier_id,
                    status: item.status,
                    link_task: item.link_task,
                    deadline: item.deadline ? formatDateInput(item.deadline) : ''
                }))
            });
        } else {
            setCurrentRecord(null);
            setFormData({
                campus_id: '',
                items: [{
                    sla_id: '',
                    migration_condition: '',
                    specialist_id: '',
                    verifier_id: '',
                    status: 'backlog',
                    link_task: '',
                    deadline: ''
                }]
            });
        }
        setIsModalOpen(true);
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                sla_id: '',
                migration_condition: '',
                specialist_id: '',
                verifier_id: '',
                status: 'backlog',
                link_task: '',
                deadline: ''
            }]
        }));
    };

    const removeItem = (index) => {
        const item = formData.items[index];
        if (item.id) {
            setDeletedItemIds(prev => [...prev, item.id]);
        }
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index, field, value) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };

            // Auto-deadline logic
            const isSlaChange = field === 'sla_id' && newItems[index].status !== 'backlog';
            const isStatusChange = field === 'status' && value !== 'backlog';

            if ((isSlaChange || isStatusChange) && newItems[index].sla_id && !newItems[index].deadline) {
                const selectedSla = slas.find(s => s.id == newItems[index].sla_id);
                if (selectedSla) {
                    const today = new Date();
                    const duration = parseInt(selectedSla.duration);
                    if (selectedSla.unit === 'Hari') {
                        today.setDate(today.getDate() + duration);
                    } else if (selectedSla.unit === 'Jam') {
                        if (duration >= 24) today.setDate(today.getDate() + Math.floor(duration / 24));
                    }
                    newItems[index].deadline = formatDateInput(today);
                }
            }

            return { ...prev, items: newItems };
        });
    };

    const confirmDelete = (group) => {
        setRecordToDelete(group);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            // Delete ALL for campus
            const token = localStorage.getItem('token');
            await fetch(`/api/migrations/campus/${recordToDelete.campus_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAllData();
            showNotification('Satu paket migrasi kampus berhasil dihapus');
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Delete error', error);
            showNotification('Gagal menghapus data', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Process Deletions
            if (deletedItemIds.length > 0) {
                const token = localStorage.getItem('token');
                await Promise.all(deletedItemIds.map(id =>
                    fetch(`/api/migrations/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ));
            }

            // 2. Process Updates and Inserts
            const promises = formData.items.map(item => {
                const payload = {
                    campus_id: formData.campus_id,
                    ...item
                };

                if (item.id) {
                    // Update existing
                    return fetch(`/api/migrations/${item.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(payload)
                    });
                } else {
                    return null; // Collected later for batch insert
                }
            });

            // Execute Updates
            await Promise.all(promises.filter(p => p !== null));

            // Execute Inserts (New Items)
            const newItems = formData.items.filter(item => !item.id);
            if (newItems.length > 0) {
                await fetch('/api/migrations/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        campus_id: formData.campus_id,
                        items: newItems
                    })
                });
            }

            setIsModalOpen(false);
            fetchAllData();
            showNotification('Data berhasil disimpan');
        } catch (error) {
            console.error('Save error', error);
            showNotification('Gagal menyimpan data', 'error');
        }
    };

    // Calculate "Status Pengerjaan" (On Time / Late)
    // Calculate "Status Pengerjaan" (On Time / Late / Fast)
    const getWorkStatus = (migration) => {
        const perf = calculatePerformance(migration);

        if (perf === 'on_time') {
            return <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Tepat Waktu</span>;
        }

        if (perf === 'late') {
            const deadlineStr = formatDateInput(migration.deadline);
            const completedStr = formatDateInput(migration.completed_at);
            const dDeadline = new Date(deadlineStr);
            const dCompleted = new Date(completedStr);

            const diffTime = Math.abs(dCompleted - dDeadline);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return <span className="text-rose-600 font-medium flex items-center gap-1"><Clock size={14} /> Telat {diffDays} Hari</span>;
        }

        if (perf === 'fast') {
            return <span className="text-blue-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Cepat</span>;
        }

        return '-';
    };

    // Group migrations by campus
    const groupedMigrations = Object.values(filteredMigrations.reduce((acc, item) => {
        if (!acc[item.campus_id]) {
            acc[item.campus_id] = {
                campus_id: item.campus_id,
                campus_name: item.campus_name,
                items: []
            };
        }
        acc[item.campus_id].items.push(item);
        return acc;
    }, {}));

    // Pagination based on GROUPS (Campuses)
    const totalPages = Math.ceil(groupedMigrations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGroups = groupedMigrations.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-8 animate-fade-in">
            {notification && (
                <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
            )}

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Migrasi</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola dan pantau proses migrasi data kampus.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Buat Migrasi
                </button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 mb-6">
                {/* Search Campus */}
                <div className="relative group col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari Kampus..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={filters.campus}
                        onChange={e => setFilters({ ...filters, campus: e.target.value })}
                    />
                </div>

                {/* Type Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filters.type}
                        onChange={e => setFilters({ ...filters, type: e.target.value })}
                    >
                        <option value="">Semua Jenis</option>
                        {slas.map(s => <option key={s.id} value={s.id}>{s.type}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Condition Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <AlertTriangle className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filters.condition}
                        onChange={e => setFilters({ ...filters, condition: e.target.value })}
                    >
                        <option value="">Semua Kondisi</option>
                        {conditionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Specialist Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filters.specialist}
                        onChange={e => setFilters({ ...filters, specialist: e.target.value })}
                    >
                        <option value="">Semua Spesialis</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <CheckCircle className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Semua Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Deadline Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input
                        type="date"
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={filters.deadline}
                        onChange={e => setFilters({ ...filters, deadline: e.target.value })}
                    />
                </div>

                {/* Performance Filter */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200 appearance-none"
                        value={filters.performance}
                        onChange={e => setFilters({ ...filters, performance: e.target.value })}
                    >
                        <option value="">Semua Pengerjaan</option>
                        <option value="on_time">Tepat Waktu</option>
                        <option value="late">Telat</option>
                        <option value="fast">Cepat</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                    </div>
                </div>

                {/* Reset Button */}
                <div className="relative group sm:col-span-2 lg:col-span-1 flex">
                    <button
                        onClick={() => setFilters({
                            campus: '',
                            type: '',
                            condition: '',
                            specialist: '',
                            status: '',
                            deadline: '',
                            performance: ''
                        })}
                        className="w-full h-full px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                        Reset Filter
                    </button>
                </div>
            </div>

            <Table
                className="shadow-xl shadow-slate-200/40 border-slate-100"
                title="Daftar Migrasi"
                headers={['#', 'Kampus', 'Jenis Migrasi', 'Kondisi', 'Spesialis', 'Status', 'Link', 'Deadline', 'Verifikator', 'Pengerjaan', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, groupedMigrations.length)}</span> dari <span className="font-bold text-slate-800">{groupedMigrations.length}</span>
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
                {paginatedGroups.map((group, idx) => (
                    <TableRow key={group.campus_id}>
                        <TableCell className="text-slate-400 align-top pt-4">{startIndex + idx + 1}</TableCell>
                        <TableCell className="font-semibold text-slate-800 align-top pt-4">{group.campus_name}</TableCell>

                        {/* Types */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center px-4 justify-start ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 truncate max-w-[150px]" title={item.job_name}>
                                        {item.job_name}
                                    </span>
                                </div>
                            ))}
                        </TableCell>
                        {/* Conditions */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center px-4 justify-start text-xs text-slate-600 ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    {item.migration_condition || '-'}
                                </div>
                            ))}
                        </TableCell>
                        {/* Specialist */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center px-4 justify-start text-slate-600 text-sm ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    {item.specialist_name || '-'}
                                </div>
                            ))}
                        </TableCell>
                        {/* Status (Left) */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center px-4 justify-start ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </TableCell>
                        {/* Link (Left) */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center justify-start px-4 ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    {item.link_task ? (
                                        <a href={item.link_task} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline flex items-center gap-1 text-xs">
                                            <ExternalLink size={12} /> Link
                                        </a>
                                    ) : '-'}
                                </div>
                            ))}
                        </TableCell>
                        {/* Deadline (Left) */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center justify-start px-4 text-xs text-slate-500 ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    {formatDateTable(item.deadline)}
                                </div>
                            ))}
                        </TableCell>
                        {/* Verifier */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center px-4 justify-start text-slate-600 text-sm ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    {item.verifier_name || '-'}
                                </div>
                            ))}
                        </TableCell>
                        {/* Work Status */}
                        <TableCell className="align-top p-0 text-left">
                            {group.items.map((item, i) => (
                                <div key={item.id} className={`h-[50px] flex items-center px-4 justify-start text-xs ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    {getWorkStatus(item)}
                                </div>
                            ))}
                        </TableCell>
                        {/* Action - Group Level */}
                        <TableCell className="align-top p-0">
                            <div className="flex h-full min-h-[50px] items-center justify-center gap-1 px-4 py-4">
                                <button onClick={() => handleOpenModal(group)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded" title="Edit Paket"><Pencil size={14} /></button>
                                <button onClick={() => confirmDelete(group)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded" title="Hapus Paket"><Trash2 size={14} /></button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentRecord ? 'Edit Migrasi' : 'Buat Migrasi'}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kampus</label>
                        <select required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.campus_id} onChange={e => setFormData({ ...formData, campus_id: e.target.value })}>
                            <option value="">Pilih Kampus</option>
                            {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {formData.items.map((item, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4 relative group">
                                {formData.items.length > 1 && !currentRecord && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                        title="Hapus item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Migrasi</label>
                                        <select required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.sla_id} onChange={e => updateItem(index, 'sla_id', e.target.value)}>
                                            <option value="">Pilih Jenis Migrasi</option>
                                            {slas.map(s => <option key={s.id} value={s.id}>{s.type} ({s.duration} {s.unit})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Kondisi</label>
                                        <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.migration_condition} onChange={e => updateItem(index, 'migration_condition', e.target.value)}>
                                            <option value="">Pilih Kondisi</option>
                                            {conditionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                        <select required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.status} onChange={e => updateItem(index, 'status', e.target.value)}>
                                            {statusOptions.map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Spesialis</label>
                                        <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.specialist_id} onChange={e => updateItem(index, 'specialist_id', e.target.value)}>
                                            <option value="">Pilih Spesialis</option>
                                            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Verifikator</label>
                                        <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.verifier_id} onChange={e => updateItem(index, 'verifier_id', e.target.value)}>
                                            <option value="">Pilih Verifikator</option>
                                            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Link Task</label>
                                        <input type="url" placeholder="https://..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.link_task} onChange={e => updateItem(index, 'link_task', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                                        <input type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 bg-white" value={item.deadline} onChange={e => updateItem(index, 'deadline', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-sky-500 hover:text-sky-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Tambah Migrasi Lain
                    </button>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-medium hover:bg-sky-600 rounded-lg shadow-sm">Simpan</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus">
                <div className="space-y-4">
                    <p>Apakah Anda yakin ingin menghapus data ini?</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg">Hapus</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
