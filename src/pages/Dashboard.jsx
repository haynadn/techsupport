import React, { useEffect, useState } from 'react';
import { StatsCard } from '../components/StatsCard';
import { Card } from '../components/ui/Card';
import { Ticket, Search, CheckCircle, Clock, Settings, ArrowDown, ArrowUp } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(json => {
                console.log('Dashboard API Response:', json);
                console.log('FRT Trend Data:', json.frtTrend);
                console.log('FRT Change Data:', json.frtChange);
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error("Dashboard fetch error", err);
                setLoading(false);
            });
    }, []);

    if (loading || !data) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Memuat data dashboard...</div>;
    }

    const { stats, trend, composition, frtTrend, frtChange } = data;

    // Colors
    const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];
    const ONBOARDING_COLORS = ['#10b981', '#3b82f6', '#f43f5e']; // Cepat (Green), Tepat (Blue), Telat (Red)

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
                    <p className="text-slate-500">Statistik operasional terkini.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Tiket"
                    value={stats.total}
                    trend="neutral"
                    trendValue="Total"
                    icon={Ticket}
                    color="indigo"
                />
                <StatsCard
                    title="Tiket Aktif"
                    value={stats.active}
                    trend="down"
                    trendValue="Pending"
                    icon={Clock}
                    color="amber"
                />
                <StatsCard
                    title="Tiket Selesai"
                    value={stats.completed}
                    trend="up"
                    trendValue="Done"
                    icon={CheckCircle}
                    color="emerald"
                />
                <StatsCard
                    title="Tiket Baru Hari Ini"
                    value={stats.new_today}
                    trend="up"
                    trendValue="New"
                    icon={Search}
                    color="sky"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <Card className="lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Aktivitas Tiket (7 Hari Terakhir)</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="colorTiket" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="tiket" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTiket)" name="Total Tiket" />
                                <Area type="monotone" dataKey="selesai" stroke="#10b981" strokeWidth={3} fillOpacity={0} fill="transparent" name="Selesai" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* CS Status Chart */}
                <Card>
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Status Tiket CS</h2>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={composition.cs}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {composition.cs.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Migration Status */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-violet-100 p-2 rounded-lg text-violet-600"><Settings size={20} /></div>
                        <h2 className="text-lg font-bold text-slate-800">Status Migrasi</h2>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={composition.migration} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* FRT Monthly Trend */}
                {frtTrend && frtTrend.length > 0 && (
                    <Card className="lg:col-span-2 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">FRT Bulanan (Rata-rata)</h3>
                                <p className="text-sm text-slate-500">First Response Time dalam menit</p>
                            </div>
                            {frtChange && (
                                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm ${frtChange.direction === 'down'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                    }`}>
                                    {frtChange.direction === 'down' ? (
                                        <ArrowDown size={16} />
                                    ) : (
                                        <ArrowUp size={16} />
                                    )}
                                    <span>{frtChange.percentage}%</span>
                                </div>
                            )}
                        </div>
                        {frtChange && (
                            <p className={`text-sm mb-4 ${frtChange.direction === 'down' ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                {frtChange.direction === 'down'
                                    ? `Lebih cepat dari bulan lalu (${frtChange.previous} → ${frtChange.current} menit)`
                                    : `Lebih lambat dari bulan lalu (${frtChange.previous} → ${frtChange.current} menit)`
                                }
                            </p>
                        )}
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={frtTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} label={{ value: 'Menit', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    formatter={(value, name) => {
                                        if (name === 'avg_frt') return [`${value} menit`, 'Rata-rata FRT'];
                                        return [value, name];
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avg_frt"
                                    stroke="#0ea5e9"
                                    strokeWidth={3}
                                    dot={{ fill: '#0ea5e9', r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                )}
            </div>
        </div>
    );
}
