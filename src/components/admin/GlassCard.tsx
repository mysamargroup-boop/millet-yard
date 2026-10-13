import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export default function GlassCard({ children, className, hover = true }: GlassCardProps) {
    return (
        <div className={cn(
            "glass-card rounded-xl p-4",
            hover && "cursor-pointer group",
            className
        )}>
            {children}
        </div>
    );
}

// Stats Card variant
interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: ReactNode;
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon }: StatsCardProps) {
    const changeColors = {
        positive: 'text-green-500',
        negative: 'text-red-500',
        neutral: 'text-muted-foreground'
    };

    return (
        <div className="glass-card rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {icon && (
                    <div className="w-10 h-10 rounded-lg bg-[#137fec]/10 flex items-center justify-center text-[#137fec]">
                        {icon}
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            {change && (
                <p className={cn("text-sm", changeColors[changeType])}>
                    {change}
                </p>
            )}
        </div>
    );
}

// Quick Action Button
interface QuickActionProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
}

export function QuickAction({ icon, label, onClick }: QuickActionProps) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 text-left transition-colors group"
        >
            <div className="w-8 h-8 rounded-full bg-muted/50 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#137fec]/20 group-hover:text-[#137fec] transition-colors">
                {icon}
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground">{label}</span>
        </button>
    );
}

// Progress Card
interface ProgressCardProps {
    title: string;
    current: number;
    total: number;
    label?: string;
}

export function ProgressCard({ title, current, total, label }: ProgressCardProps) {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
                <span className="text-xs font-bold text-foreground">{percentage}%</span>
            </div>
            <div className="w-full bg-muted/30 dark:bg-white/10 rounded-full h-2 mb-2">
                <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {label && (
                <p className="text-[10px] text-muted-foreground">{label}</p>
            )}
        </div>
    );
}
