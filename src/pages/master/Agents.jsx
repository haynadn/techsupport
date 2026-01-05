import React, { useState, useEffect } from 'react';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function Agents() {
    const [agents, setAgents] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data states
    const [currentAgent, setCurrentAgent] = useState(null);
    const [agentToDelete, setAgentToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        role: 'Customer Service',
        status: 'active'
    });

    const fetchAgents = () => {
        const token = localStorage.getItem('token');
        fetch('/api/agents', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setAgents(data))
            .catch(err => console.error('Error fetching agents:', err));
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    // Filter Logic
    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? agent.role === roleFilter : true;
        return matchesSearch && matchesRole;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleOpenModal = (agent = null) => {
        if (agent) {
            setCurrentAgent(agent);
            setFormData({
                name: agent.name,
                email: agent.email,
                username: agent.username,
                password: '',
                phone: agent.phone,
                role: agent.role,
                status: agent.status
            });
        } else {
            setCurrentAgent(null);
            setFormData({
                name: '',
                email: '',
                username: '',
                password: '',
                phone: '',
                role: 'Customer Service',
                status: 'active'
            });
        }
        setIsModalOpen(true);
    };

    const confirmDelete = (agent) => {
        setAgentToDelete(agent);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!agentToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/agents/${agentToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchAgents();
            showNotification('Data agen berhasil dihapus');
            setIsDeleteModalOpen(false);
            setAgentToDelete(null);
        } catch (error) {
            console.error('Error deleting agent:', error);
            showNotification('Gagal menghapus data agen', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentAgent
                ? `/api/agents/${currentAgent.id}`
                : '/api/agents';

            const method = currentAgent ? 'PUT' : 'POST';

            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMsg = result.errors ? result.errors.map(e => e.msg).join(', ') : (result.message || 'Gagal menyimpan data');
                showNotification(errorMsg, 'error');
                return;
            }

            setIsModalOpen(false);
            fetchAgents();
            showNotification(currentAgent ? 'Data agen berhasil diperbarui' : 'Agen baru berhasil ditambahkan');
        } catch (error) {
            console.error('Error saving agent:', error);
            showNotification('Gagal menyambung ke server', 'error');
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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Agen</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola data agen, peran, dan status operasional mereka.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5 transform hover:-translate-y-0.5"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Tambah Agen
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-72 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Filter className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                    <select
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 appearance-none transition-all duration-200"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">Semua Peran</option>
                        <option value="Customer Service">Customer Service</option>
                        <option value="Migration Specialist">Migration Specialist</option>
                        <option value="Trainer">Trainer</option>
                        <option value="Leader">Leader</option>
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
                        <span className="font-bold text-slate-800 text-lg">Data Agen</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{filteredAgents.length} Total</span>
                    </div>
                }
                headers={['#', 'Nama Lengkap', 'Email', 'No. Telepon', 'Peran', 'Status', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredAgents.length)}</span> dari <span className="font-bold text-slate-800">{filteredAgents.length}</span>
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
                {paginatedAgents.map((agent, index) => (
                    <TableRow key={agent.id}>
                        <TableCell className="w-16 font-medium text-slate-400">
                            {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold uppercase ring-2 ring-white shadow-sm">
                                    {agent.name.slice(0, 2)}
                                </div>
                                <div className="font-semibold text-slate-800">{agent.name}</div>
                            </div>
                        </TableCell>
                        <TableCell className="text-slate-500">{agent.email}</TableCell>
                        <TableCell className="text-slate-500">{agent.phone}</TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${agent.role === 'Customer Service' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                agent.role === 'Migration Specialist' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    agent.role === 'Leader' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                        'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                {agent.role}
                            </span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                                <span className={`text-sm font-medium ${agent.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {agent.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => handleOpenModal(agent)}
                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                                    title="Edit Agen"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(agent)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                    title="Hapus Agen"
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
                title={currentAgent ? 'Edit Agen' : 'Tambah Agen Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.username || ''}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                required={!currentAgent}
                                placeholder={currentAgent ? "Biarkan kosong jika tidak diubah" : ""}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.password || ''}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="Customer Service">Customer Service</option>
                                <option value="Migration Specialist">Migration Specialist</option>
                                <option value="Trainer">Trainer</option>
                                <option value="Leader">Leader</option>
                            </select>
                        </div>
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
                        Apakah Anda yakin ingin menghapus agen <strong>{agentToDelete?.name}</strong>?
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
