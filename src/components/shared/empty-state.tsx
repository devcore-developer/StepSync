import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light-blue">
        <Icon className="h-7 w-7 text-brand-blue" />
      </div>
      <h3 className="text-base font-semibold text-brand-navy mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-5">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}