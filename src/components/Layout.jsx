import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    MessageSquare,
    Settings,
    Menu,
    X,
    Ticket,
    GraduationCap,
    Calendar,
    ChevronDown,
    LogOut,
    Target,
    Printer,
    Rocket
} from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ to, icon: Icon, label, active, subItems }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasSubItems = subItems && subItems.length > 0;
    const location = useLocation();

    // Auto-expand if a child is active
    React.useEffect(() => {
        if (hasSubItems) {
            const isChildActive = subItems.some(item => location.pathname === item.to);
            if (isChildActive) setIsOpen(true);
        }
    }, [location.pathname, hasSubItems, subItems]);

    if (hasSubItems) {
        return (
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group text-[0.925rem] font-medium relative",
                        active || isOpen
                            ? "text-sky-600 bg-sky-50/80"
                            : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={19} className={clsx("transition-transform duration-300", (active || isOpen) ? "text-sky-600" : "text-slate-400 group-hover:text-sky-600")} />
                        <span>{label}</span>
                    </div>
                    <ChevronDown size={16} className={clsx("transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                </button>
                {isOpen && (
                    <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-1">
                        {subItems.map((child) => (
                            <Link
                                key={child.to}
                                to={child.to}
                                className={clsx(
                                    "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname === child.to
                                        ? "text-sky-600 bg-sky-50"
                                        : "text-slate-500 hover:text-sky-600 hover:bg-slate-50"
                                )}
                            >
                                {child.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            to={to}
            className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-[0.925rem] font-medium relative overflow-hidden",
                active
                    ? "text-sky-600 bg-sky-50/80 shadow-sm shadow-sky-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
            )}
        >
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-500 rounded-r-full" />
            )}
            <Icon size={19} className={clsx("transition-transform duration-300 group-hover:scale-110", active ? "text-sky-600" : "text-slate-400 group-hover:text-sky-600")} />
            <span className="relative z-10">{label}</span>
        </Link>
    );
};

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    const operationalItems = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/customer-service", icon: Ticket, label: "Customer Service" },
        {
            to: "/implementation", // Identifier for parent
            icon: Settings,
            label: "Implementasi",
            subItems: [
                { to: "/migration", label: "Migrasi" },
                { to: "/implementation/print", label: "Hasil Cetak" }
            ]
        },
        { to: "/onboarding-clients", icon: Rocket, label: "Onboarding Klien" },
        { to: "/training", icon: GraduationCap, label: "Training & Meeting" },
    ];

    const masterItems = [
        { to: "/master/agents", icon: Users, label: "Daftar Agen" },
        { to: "/master/campuses", icon: Building2, label: "Daftar Kampus" },
        { to: "/master/sla", icon: Target, label: "Service Level Agreement" },
        { to: "/master/sources", icon: MessageSquare, label: "Daftar Sumber" },
        { to: "/master/scopes", icon: Settings, label: "Ruang Lingkup" },
        { to: "/master/materials", icon: GraduationCap, label: "Materi Training" },
        { to: "/master/print-results", icon: Printer, label: "Hasil Cetak" }, // Added
        { to: "/master/holidays", icon: Calendar, label: "Hari Libur" },
    ];

    return (
        <div className="h-screen w-full bg-[#f8fafc] flex font-sans overflow-hidden selections:bg-sky-100 selection:text-sky-700">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-sm border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-out lg:relative lg:translate-x-0 flex flex-col",
                    !isSidebarOpen && "-translate-x-full lg:hidden"
                )}
            >
                <div className="h-20 flex items-center px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-200 ring-2 ring-white">
                            <span className="text-xl">TS</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-slate-800 tracking-tight leading-none">Tech<span className="text-sky-500">Support</span></span>
                            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase mt-0.5">Admin Panel</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
                    <div>
                        <div className="mb-3 px-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                            Operasional
                        </div>
                        <div className="space-y-1">
                            {operationalItems.map((item) => (
                                <SidebarItem
                                    key={item.to}
                                    to={item.to}
                                    label={item.label}
                                    icon={item.icon}
                                    active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
                                    subItems={item.subItems}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 px-4 text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                            Data Master
                        </div>
                        <div className="space-y-1">
                            {masterItems.map((item) => (
                                <SidebarItem
                                    key={item.to}
                                    to={item.to}
                                    label={item.label}
                                    icon={item.icon}
                                    active={location.pathname === item.to}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(JSON.parse(localStorage.getItem('user'))?.name || 'User')}&background=0284c7&color=fff`}
                            className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
                            alt="Profile"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-700 truncate group-hover:text-sky-600 transition-colors">
                                {JSON.parse(localStorage.getItem('user'))?.name || 'Guest User'}
                            </p>
                            <p className="text-slate-400 text-xs truncate">
                                {JSON.parse(localStorage.getItem('user'))?.role || 'Guest'}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Keluar"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] relative">
                {/* Topbar */}
                <header className="h-20 bg-[#f8fafc]/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 transition-all">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 lg:hidden transition-all border border-transparent hover:border-slate-200"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800 hidden sm:block opacity-0 lg:opacity-100 transition-opacity">
                            {/* Dynamic Title could go here */}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6 ml-auto">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-700">Selasa, 30 Desember 2025</span>
                            <span className="text-xs text-slate-500">Jakarta, Indonesia</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200 hidden md:block" />
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 relative">
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                                <MessageSquare size={18} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-[#f8fafc] px-4 lg:px-6 pb-6">
                    <div className="w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
