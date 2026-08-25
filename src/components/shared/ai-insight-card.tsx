import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightCardProps {
  title?: string;
  description: string;
  action?: string;
  onAction?: () => void;
}

export default function AIInsightCard({
  title = "توصية ذكية",
  description,
  action,
  onAction,
}: AIInsightCardProps) {
  return (
    <div className="rounded-xl border border-brand-gold/20 bg-brand-light-gold p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-brand-gold" />
        <span className="text-xs font-semibold text-brand-gold uppercase tracking-wide">
          {title}
        </span>
      </div>
      <p className="text-sm text-brand-navy leading-relaxed mb-4">
        {description}
      </p>
      {action && (
        <Button
          size="sm"
          className="bg-brand-gold text-brand-navy hover:bg-brand-gold/90 font-semibold"
          onClick={onAction}
        >
          {action}
        </Button>
      )}
    </div>
  );
}