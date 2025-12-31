import React from 'react';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';

export default function Tickets() {
    const tickets = [
        { id: 'TIK-001', subject: 'Login Gagal', requester: 'Ahmad (Kampus A)', agent: 'Budi Santoso', status: 'open', priority: 'high', date: '30 Des 2025' },
        { id: 'TIK-002', subject: 'Printer Rusak', requester: 'Siti (Kampus B)', agent: 'Unassigned', status: 'pending', priority: 'medium', date: '29 Des 2025' },
        { id: 'TIK-003', subject: 'Reset Password', requester: 'Dedi (Kampus C)', agent: 'Budi Santoso', status: 'resolved', priority: 'low', date: '28 Des 2025' },
    ];

    const statusColors = {
        open: 'sky',
        pending: 'amber',
        resolved: 'emerald',
        closed: 'slate',
    };

    const priorityColors = {
        high: 'rose',
        medium: 'amber',
        low: 'slate',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tiket Customer Service</h1>
                    <p className="text-slate-500">Daftar tiket masuk dari customer service.</p>
                </div>
                <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-sky-200">
                    + Buat Tiket Baru
                </button>
            </div>

            <Table
                title="Tiket Masuk"
                headers={['ID Tiket', 'Subjek', 'Pemohon', 'Agen', 'Prioritas', 'Status', 'Tanggal']}
            >
                {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                        <TableCell>
                            <span className="font-mono font-medium text-slate-500">{ticket.id}</span>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium text-slate-900">{ticket.subject}</div>
                        </TableCell>
                        <TableCell>{ticket.requester}</TableCell>
                        <TableCell>
                            <span className={ticket.agent === 'Unassigned' ? 'text-slate-400 italic' : ''}>
                                {ticket.agent}
                            </span>
                        </TableCell>
                        <TableCell>
                            <Badge color={priorityColors[ticket.priority]}>
                                {ticket.priority.toUpperCase()}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge color={statusColors[ticket.status]}>
                                {ticket.status.toUpperCase()}
                            </Badge>
                        </TableCell>
                        <TableCell>{ticket.date}</TableCell>
                    </TableRow>
                ))}
            </Table>
        </div>
    );
}
