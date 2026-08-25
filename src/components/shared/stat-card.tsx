import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: "blue" | "red" | "gold" | "navy";
  progress?: number;
  className?: string;
}

const iconColorMap = {
  blue: "bg-brand-light-blue text-brand-blue",
  red: "bg-brand-light-red text-brand-red",
  gold: "bg-brand-light-gold text-brand-gold",
  navy: "bg-brand-surface-alt text-brand-navy",
};

const progressColorMap = {
  blue: "bg-brand-blue",
  red: "bg-brand-red",
  gold: "bg-brand-gold",
  navy: "bg-brand-navy",
};

export default function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  progress,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconColorMap[iconColor]
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-brand-navy">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full rounded-full bg-brand-surface-alt overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              progressColorMap[iconColor]
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}