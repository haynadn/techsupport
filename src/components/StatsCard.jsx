import React from 'react';
import { Card } from './ui/Card';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatsCard({ title, value, trend, trendValue, icon: Icon, color }) {
    const colorMap = {
        sky: 'bg-sky-50 text-sky-600',
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
    };

    const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-rose-600';
    const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

    return (
        <Card>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-slate-800">{value}</h3>
                </div>
                <div className={clsx("p-3 rounded-lg", colorMap[color] || colorMap.sky)}>
                    <Icon size={24} />
                </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
                <span className={clsx("flex items-center font-medium", trendColor)}>
                    <TrendIcon size={16} className="mr-1" />
                    {trendValue}
                </span>
                <span className="ml-2 text-slate-400">vs bulan lalu</span>
            </div>
        </Card>
    );
}
