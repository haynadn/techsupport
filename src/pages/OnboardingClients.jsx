import React from 'react';
import { Users } from 'lucide-react';

export default function OnboardingClients() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-slate-200/60 pb-6">
                <div className="w-12 h-12 rounded-xl bg-sky-100/50 flex items-center justify-center text-sky-600">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Onboarding Klien</h1>
                    <p className="text-slate-500 text-sm">Kelola proses onboarding klien baru.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-500">
                <p>Fitur Onboarding Klien akan segera hadir.</p>
            </div>
        </div>
    );
}
