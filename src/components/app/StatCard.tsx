import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: string;
  deltaUp?: boolean;
  tone?: "primary" | "success" | "warning" | "destructive" | "accent";
  index?: number;
}

const toneBg: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent/10 text-accent",
};

export function StatCard({ label, value, icon: Icon, delta, deltaUp = true, tone = "primary", index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="card-float card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneBg[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              deltaUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}
