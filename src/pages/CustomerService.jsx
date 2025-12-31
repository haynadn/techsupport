import React, { useState, useEffect } from 'react';
import { formatDateTimeDisplay, formatDateTimeForInput, formatDateForInput } from '../utils/dateFormatter';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { Pencil, Trash2, Plus, Search, Filter, Calendar as CalendarIcon, User, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronDown, MessageSquare, AlertCircle, Link as LinkIcon, ExternalLink, Target } from 'lucide-react';
import clsx from 'clsx';

export default function CustomerService() {
    const [tickets, setTickets] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [sources, setSources] = useState([]);
    const [agents, setAgents] = useState([]);
    const [scopes, setScopes] = useState([]);

    // Filter & Pagination
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const [filters, setFilters] = useState({
        campus: '',
        status: '',
        date: '',
        scope: '',
        answer_agent_id: ''
    });

    // Modal & Data State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentTicket, setCurrentTicket] = useState(null);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    // Auth User
    const [currentUser, setCurrentUser] = useState(null);

    const [formData, setFormData] = useState({
        campus_id: '',
        campus_pic: '',
        source_id: '',
        question: '',
        scope: '',
        answer_agent_id: '',
        solved_agent_id: '',
        created_at: '',
        response_at: '',
        status: 'todo',
        bug_link: '',
        working_hours: '',
        frt: 0,
        solved_at: ''
    });

    const statusOptions = ['todo', 'in_progress', 'bug', 'flip', 'finnet', 'completed'];

    useEffect(() => {
        // Get logged in user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
        }
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const results = await Promise.allSettled([
                fetch('/api/customer-service'),
                fetch('/api/campuses'),
                fetch('/api/sources'),
                fetch('/api/agents'),
                fetch('/api/scopes')
            ]);

            const [ticketRes, campusRes, sourceRes, agentRes, scopeRes] = results;

            if (ticketRes.status === 'fulfilled' && ticketRes.value.ok) {
                const data = await ticketRes.value.json();
                setTickets(data);
            } else {
                console.error("Fetch tickets failed", ticketRes);
                // showNotification('Gagal memuat tiket', 'error');
            }

            if (campusRes.status === 'fulfilled' && campusRes.value.ok) setCampuses(await campusRes.value.json());
            if (sourceRes.status === 'fulfilled' && sourceRes.value.ok) setSources(await sourceRes.value.json());
            if (agentRes.status === 'fulfilled' && agentRes.value.ok) setAgents(await agentRes.value.json());
            if (scopeRes.status === 'fulfilled' && scopeRes.value.ok) setScopes(await scopeRes.value.json());

        } catch (error) {
            console.error("Error fetching data:", error);
            // showNotification('Error system: ' + error.message, 'error');
        }
    };

    // Filter Logic
    useEffect(() => {
        const filtered = tickets.filter(item => {
            const matchCampus = !filters.campus || (item.campus_name && item.campus_name.toLowerCase().includes(filters.campus.toLowerCase()));
            const matchStatus = !filters.status || item.status === filters.status;
            const matchDate = !filters.date || (item.created_at && item.created_at.startsWith(filters.date));
            const matchScope = !filters.scope || (item.scope && item.scope === filters.scope);
            const matchAgent = !filters.answer_agent_id || (item.answer_agent_id && String(item.answer_agent_id) === String(filters.answer_agent_id));
            return matchCampus && matchStatus && matchDate && matchScope && matchAgent;
        });
        setFilteredTickets(filtered);
        setCurrentPage(1);
    }, [filters, tickets]);

    // Pagination
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Convert ISO datetime to yyyy-mm-ddTHH:mm format for datetime-local input
    const toLocalISOString = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Split datetime into date and time parts
    const splitDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return { date: '', time: '' };
        const [date, time] = dateTimeStr.split('T');
        return { date: date || '', time: time || '' };
    };

    // Combine date and time into ISO datetime
    const combineDateTime = (date, time) => {
        if (!date || !time) return '';
        return `${date}T${time}`;
    };

    // Auto-format time input as user types (HH:mm)
    const formatTimeInput = (value) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '');

        // Auto-format based on length
        if (digits.length === 0) return '';
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
        return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    };

    // Auto-format date input as user types (dd-mm-yyyy)
    const formatDateInputDisplay = (value) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '');

        // Auto-format based on length
        if (digits.length === 0) return '';
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
        if (digits.length <= 8) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
        return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
    };

    // Convert dd-mm-yyyy to yyyy-mm-dd for backend
    const convertDateToISO = (ddmmyyyy) => {
        if (!ddmmyyyy || ddmmyyyy.length < 10) return '';
        const parts = ddmmyyyy.split('-');
        if (parts.length !== 3) return '';
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    };

    // Convert yyyy-mm-dd to dd-mm-yyyy for display
    const convertDateToDisplay = (yyyymmdd) => {
        if (!yyyymmdd) return '';
        const parts = yyyymmdd.split('-');
        if (parts.length !== 3) return '';
        const [year, month, day] = parts;
        return `${day}-${month}-${year}`;
    };

    const handleOpenModal = (ticket = null) => {
        if (ticket) {
            setCurrentTicket(ticket);
            setFormData({
                campus_id: ticket.campus_id,
                campus_pic: ticket.campus_pic || '',
                source_id: ticket.source_id,
                question: ticket.question || '',
                scope: ticket.scope || '',
                answer_agent_id: ticket.answer_agent_id,
                solved_agent_id: ticket.solved_agent_id || '',
                created_at: toLocalISOString(ticket.created_at),
                response_at: toLocalISOString(ticket.response_at),
                status: ticket.status || 'todo',
                bug_link: ticket.bug_link || '',
                working_hours: ticket.working_hours || '',
                frt: ticket.frt || 0,
                solved_at: toLocalISOString(ticket.solved_at)
            });
        } else {
            setCurrentTicket(null);
            // Find current user's agent ID if possible
            const defaultAgent = agents.find(a => a.name === currentUser?.name || a.email === currentUser?.email);

            setFormData({
                campus_id: '',
                campus_pic: '',
                source_id: '',
                question: '',
                scope: '',
                answer_agent_id: defaultAgent ? defaultAgent.id : '',
                solved_agent_id: '',
                created_at: toLocalISOString(new Date()),
                response_at: '',
                status: 'todo',
                bug_link: '',
                working_hours: '',
                frt: 0
            });
        }
        setIsModalOpen(true);
    };

    const calculateFRT = (start, end) => {
        if (!start || !end) return 0;
        const diffMs = new Date(end) - new Date(start);
        return Math.floor(diffMs / 60000); // minutes
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev };

            // Handle separate date/time inputs
            if (field.endsWith('_date') || field.endsWith('_time')) {
                const baseField = field.replace(/_date$|_time$/, '');
                const currentDateTime = splitDateTime(prev[baseField]);

                if (field.endsWith('_date')) {
                    // Auto-format and convert date input
                    const formattedDate = formatDateInputDisplay(value);
                    currentDateTime.date = convertDateToISO(formattedDate);
                } else {
                    // Auto-format time input
                    currentDateTime.time = formatTimeInput(value);
                }

                newData[baseField] = combineDateTime(currentDateTime.date, currentDateTime.time);
            } else {
                newData[field] = value;
            }

            // Auto-calculate FRT if times change
            if (field.includes('created_at') || field.includes('response_at')) {
                const start = field.includes('created_at') ? newData.created_at : prev.created_at;
                const end = field.includes('response_at') ? newData.response_at : prev.response_at;
                newData.frt = calculateFRT(start, end);
            }

            // Auto-set solved_at based on status
            if (field === 'status') {
                const solvedStatuses = ['flip', 'finnet', 'bug', 'completed'];
                if (solvedStatuses.includes(value)) {
                    if (!newData.solved_at) newData.solved_at = toLocalISOString(new Date());
                } else {
                    newData.solved_at = '';
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate bug_link if status is 'bug'
        if (formData.status === 'bug' && !formData.bug_link) {
            showNotification('Link Bug wajib diisi untuk status BUG', 'error');
            return;
        }

        try {
            // Prepare data for backend
            const dataToSend = { ...formData };

            // Format dates for MySQL (convert ISO to MySQL datetime format)
            if (dataToSend.created_at) dataToSend.created_at = dataToSend.created_at.replace('T', ' ') + ':00';
            if (dataToSend.response_at) dataToSend.response_at = dataToSend.response_at.replace('T', ' ') + ':00';
            if (dataToSend.solved_at) dataToSend.solved_at = dataToSend.solved_at.replace('T', ' ') + ':00';

            // Sanitize optional fields
            if (!dataToSend.source_id) dataToSend.source_id = null;
            if (!dataToSend.solved_agent_id) dataToSend.solved_agent_id = null;
            if (!dataToSend.campus_pic) dataToSend.campus_pic = null;
            if (!dataToSend.working_hours) dataToSend.working_hours = null;

            // Ensure numbers
            dataToSend.campus_id = parseInt(dataToSend.campus_id) || null;
            dataToSend.frt = parseInt(dataToSend.frt) || 0;

            const url = currentTicket
                ? `/api/customer-service/${currentTicket.id}`
                : '/api/customer-service';
            const method = currentTicket ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (res.ok) {
                showNotification(currentTicket ? 'Tiket diperbarui' : 'Tiket dibuat');
                if (currentTicket) {
                    setIsModalOpen(false); // Close if editing
                } else {
                    // Reset form if creating new (Keep modal open)
                    const defaultAgent = agents.find(a => a.name === currentUser?.name || a.email === currentUser?.email);
                    setFormData({
                        campus_id: '',
                        campus_pic: '',
                        source_id: '',
                        question: '',
                        scope: '',
                        answer_agent_id: defaultAgent ? defaultAgent.id : '',
                        solved_agent_id: '',
                        created_at: toLocalISOString(new Date()),
                        response_at: '',
                        status: 'todo',
                        bug_link: '',
                        working_hours: '',
                        frt: 0,
                        solved_at: ''
                    });
                }
                fetchAllData();
            } else {
                showNotification('Gagal menyimpan tiket', 'error');
            }
        } catch (error) {
            console.error(error);
            showNotification('Terjadi kesalahan sistem', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await fetch(`/api/customer-service/${ticketToDelete.id}`, { method: 'DELETE' });
            showNotification('Tiket dihapus');
            setIsDeleteModalOpen(false);
            fetchAllData();
        } catch (error) {
            showNotification('Gagal menghapus', 'error');
        }
    };

    // Using formatDateTimeDisplay from utils

    const getWorkingHoursStatus = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const day = d.getDay();
        const hour = d.getHours();

        let isWorkingHour = false;
        if (day >= 1 && day <= 5) { // Mon-Fri
            if (hour >= 8 && hour < 20) isWorkingHour = true;
        } else if (day === 6) { // Sat
            if (hour >= 8 && hour < 17) isWorkingHour = true;
        }

        return isWorkingHour ? 'Dalam Jam Kerja' : 'Diluar Jam Kerja';
    };

    const getSolvedStatus = (ticket) => {
        const solvedStatuses = ['flip', 'finnet', 'bug', 'completed'];
        if (!solvedStatuses.includes(ticket.status) || !ticket.solved_at) return '-';

        const created = new Date(ticket.created_at);
        const solved = new Date(ticket.solved_at);

        // Reset time to midnight for day comparison
        created.setHours(0, 0, 0, 0);
        solved.setHours(0, 0, 0, 0);

        const diffTime = solved - created;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'Tepat Waktu';
        return `Telat ${diffDays} hari`;
    };

    const getStatusColor = (status) => {
        const colors = {
            'todo': 'bg-slate-100 text-slate-700',
            'in_progress': 'bg-blue-100 text-blue-700',
            'bug': 'bg-rose-100 text-rose-700',
            'flip': 'bg-orange-100 text-orange-700',
            'finnet': 'bg-violet-100 text-violet-700',
            'completed': 'bg-emerald-100 text-emerald-700'
        };
        return colors[status] || 'bg-slate-100';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Service</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola tiket support dan customer service.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Buat Tiket
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 mb-6 font-medium text-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    {/* Search Campus */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari Kampus..."
                            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                            value={filters.campus}
                            onChange={e => setFilters({ ...filters, campus: e.target.value })}
                        />
                    </div>

                    {/* Scope Filter */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Target className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none"
                            value={filters.scope}
                            onChange={e => setFilters({ ...filters, scope: e.target.value })}
                        >
                            <option value="">Semua Ruang Lingkup</option>
                            {scopes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} />
                    </div>

                    {/* Agent Filter */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none"
                            value={filters.answer_agent_id}
                            onChange={e => setFilters({ ...filters, answer_agent_id: e.target.value })}
                        >
                            <option value="">Semua Agen Penjawab</option>
                            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} />
                    </div>

                    {/* Status Filter */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <CheckCircle className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none"
                            value={filters.status}
                            onChange={e => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">Semua Status</option>
                            {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400" size={16} />
                    </div>

                    {/* Date Filter */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <CalendarIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                            value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <Table
                className="shadow-xl shadow-slate-200/40 border-slate-100"
                title="Daftar Tiket"
                headers={['#', 'Kampus', 'PIC', 'Ruang Lingkup', 'Pertanyaan', 'Agen Penjawab', 'Agen Solved', 'Waktu Masuk', 'Waktu Respon', 'FRT (Menit)', 'Jam Kerja', 'Selesai', 'Link Bug', 'Status', '']}
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
                        <TableCell className="text-slate-400">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium text-slate-800">{ticket.campus_name}</TableCell>
                        <TableCell>{ticket.campus_pic || '-'}</TableCell>
                        <TableCell>{ticket.scope || '-'}</TableCell>
                        <TableCell>
                            <div className="max-w-xs truncate" title={ticket.question}>{ticket.question}</div>
                        </TableCell>
                        <TableCell>{ticket.answer_agent_name || '-'}</TableCell>
                        <TableCell>{ticket.solved_agent_name || '-'}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDateTimeDisplay(ticket.created_at)}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDateTimeDisplay(ticket.response_at)}</TableCell>
                        <TableCell>
                            {ticket.response_at ? (
                                <span className={clsx("font-medium", ticket.frt <= 10 ? "text-emerald-600" : "text-rose-600")}>
                                    {ticket.frt <= 10 ? `Cepat ${ticket.frt} menit` : `Telat ${ticket.frt - 10} menit`}
                                </span>
                            ) : '-'}
                        </TableCell>
                        <TableCell>
                            <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold", getWorkingHoursStatus(ticket.created_at) === 'Dalam Jam Kerja' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700")}>
                                {getWorkingHoursStatus(ticket.created_at)}
                            </span>
                        </TableCell>
                        <TableCell>
                            {/* Selesai Column */}
                            <span className={clsx("font-medium", getSolvedStatus(ticket) === 'Tepat Waktu' ? 'text-emerald-600' : getSolvedStatus(ticket) !== '-' ? 'text-rose-600' : '')}>
                                {getSolvedStatus(ticket)}
                            </span>
                        </TableCell>
                        <TableCell>
                            {ticket.bug_link ? (
                                <a href={ticket.bug_link} target="_blank" className="text-rose-500 hover:text-rose-600 flex items-center justify-center">
                                    <ExternalLink size={18} />
                                </a>
                            ) : '-'}
                        </TableCell>
                        <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-2 items-center">
                                <button onClick={() => handleOpenModal(ticket)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={18} /></button>
                                <button onClick={() => { setTicketToDelete(ticket); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </Table>

            {/* Modal Form */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentTicket ? 'Edit Tiket' : 'Buat Tiket Baru'} maxWidth="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kampus</label>
                            <select required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.campus_id} onChange={e => handleInputChange('campus_id', e.target.value)}>
                                <option value="">Pilih Kampus</option>
                                {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">PIC Kampus</label>
                            <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.campus_pic} onChange={e => handleInputChange('campus_pic', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sumber</label>
                            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.source_id} onChange={e => handleInputChange('source_id', e.target.value)}>
                                <option value="">Pilih Sumber</option>
                                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ruang Lingkup</label>
                            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.scope} onChange={e => handleInputChange('scope', e.target.value)}>
                                <option value="">Pilih Ruang Lingkup</option>
                                {scopes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pertanyaan</label>
                        <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 h-24" value={formData.question} onChange={e => handleInputChange('question', e.target.value)}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Agen Penjawab</label>
                            <select disabled className="w-full px-3 py-2 border rounded-lg bg-slate-100" value={formData.answer_agent_id} onChange={e => handleInputChange('answer_agent_id', e.target.value)}>
                                <option value="">Auto-filled</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Agen Solved</label>
                            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.solved_agent_id} onChange={e => handleInputChange('solved_agent_id', e.target.value)}>
                                <option value="">Pilih Agen</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Pesan Masuk</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    maxLength="10"
                                    placeholder="Contoh: 31122024 atau 31-12-2024"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                                    value={convertDateToDisplay(splitDateTime(formData.created_at).date)}
                                    onChange={e => handleInputChange('created_at_date', e.target.value)}
                                />
                                <input
                                    type="text"
                                    maxLength="5"
                                    placeholder="Contoh: 0730 atau 07:30"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                                    value={splitDateTime(formData.created_at).time}
                                    onChange={e => handleInputChange('created_at_time', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Respon</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    maxLength="10"
                                    placeholder="Contoh: 31122024 atau 31-12-2024"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                                    value={convertDateToDisplay(splitDateTime(formData.response_at).date)}
                                    onChange={e => handleInputChange('response_at_date', e.target.value)}
                                />
                                <input
                                    type="text"
                                    maxLength="5"
                                    placeholder="Contoh: 0730 atau 07:30"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                                    value={splitDateTime(formData.response_at).time}
                                    onChange={e => handleInputChange('response_at_time', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500" value={formData.status} onChange={e => handleInputChange('status', e.target.value)}>
                                {statusOptions.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link Bug {formData.status === 'bug' && <span className="text-rose-500">*</span>}</label>
                            <input type="url" placeholder="https://..." className={clsx("w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500", formData.status === 'bug' && !formData.bug_link ? "border-rose-300 ring-1 ring-rose-200" : "")} value={formData.bug_link} onChange={e => handleInputChange('bug_link', e.target.value)} />
                        </div>
                    </div>



                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-sky-500 text-white font-medium hover:bg-sky-600 rounded-lg shadow-sm">Simpan</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus">
                <div className="space-y-4">
                    <p>Apakah Anda yakin ingin menghapus tiket ini?</p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white font-medium hover:bg-rose-700 rounded-lg">Hapus</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
