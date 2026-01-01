import React, { useState, useEffect } from 'react';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { Pencil, Trash2, Plus, AlertTriangle, Search, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function Materials() {
    const [materials, setMaterials] = useState([]);

    // Filter & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Data states
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        name: ''
    });

    const fetchMaterials = () => {
        const token = localStorage.getItem('token');
        fetch('/api/materials', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setMaterials(data))
            .catch(err => console.error('Error fetching materials:', err));
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    // Filter Logic
    const filteredMaterials = materials.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedMaterials = filteredMaterials.slice(startIndex, startIndex + itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const handleOpenModal = (material = null) => {
        if (material) {
            setCurrentMaterial(material);
            setFormData({ name: material.name });
        } else {
            setCurrentMaterial(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const confirmDelete = (material) => {
        setMaterialToDelete(material);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!materialToDelete) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/materials/${materialToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchMaterials();
            showNotification('Data materi training berhasil dihapus');
            setIsDeleteModalOpen(false);
            setMaterialToDelete(null);
        } catch (error) {
            console.error('Error deleting material:', error);
            showNotification('Gagal menghapus data materi training', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = currentMaterial
                ? `/api/materials/${currentMaterial.id}`
                : '/api/materials';

            const method = currentMaterial ? 'PUT' : 'POST';

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
            fetchMaterials();
            showNotification(currentMaterial ? 'Data materi training berhasil diperbarui' : 'Materi training baru berhasil ditambahkan');
        } catch (error) {
            console.error('Error saving material:', error);
            showNotification('Gagal menyimpan data materi training', 'error');
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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Materi Training</h1>
                    <p className="text-slate-500 mt-2 text-base">Kelola data materi untuk sesi training.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2.5 transform hover:-translate-y-0.5"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Tambah Materi
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
                        placeholder="Cari materi training..."
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Table
                className="shadow-xl shadow-slate-200/40 border-slate-100"
                title={
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-lg">Data Materi</span>
                        <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{filteredMaterials.length} Total</span>
                    </div>
                }
                headers={['#', 'Nama Materi', '']}
                footer={totalPages > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredMaterials.length)}</span> dari <span className="font-bold text-slate-800">{filteredMaterials.length}</span>
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
                {paginatedMaterials.map((material, index) => (
                    <TableRow key={material.id}>
                        <TableCell className="w-16 font-medium text-slate-400">
                            {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shadow-sm border border-sky-100">
                                    <BookOpen size={18} />
                                </div>
                                <div className="font-semibold text-slate-800">{material.name}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1 justify-end">
                                <button
                                    onClick={() => handleOpenModal(material)}
                                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200"
                                    title="Edit Materi"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(material)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                                    title="Hapus Materi"
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
                title={currentMaterial ? 'Edit Materi Training' : 'Tambah Materi Training Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Materi Training</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Penggunaan Siakad, Manajemen PDDIKTI"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        Apakah Anda yakin ingin menghapus materi <strong>{materialToDelete?.name}</strong>?
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
