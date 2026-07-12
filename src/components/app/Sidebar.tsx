import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Building2,
  Settings,
  LifeBuoy,
  ChevronsLeft,
  ChevronsRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/data";

const allItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, roles: ["admin", "asset_manager", "dept_head", "employee"] },
  { title: "Assets", url: "/app/assets", icon: Boxes, roles: ["admin", "asset_manager", "dept_head", "employee"] },
  { title: "Allocations", url: "/app/allocations", icon: ArrowLeftRight, roles: ["admin", "asset_manager"] },
  { title: "Bookings", url: "/app/bookings", icon: CalendarDays, roles: ["admin", "asset_manager", "dept_head", "employee"] },
  { title: "Maintenance", url: "/app/maintenance", icon: Wrench, roles: ["admin", "asset_manager", "employee"] },
  { title: "Audit", url: "/app/audit", icon: ClipboardCheck, roles: ["admin"] },
  { title: "Reports", url: "/app/reports", icon: BarChart3, roles: ["admin", "dept_head"] },
  { title: "Notifications", url: "/app/notifications", icon: Bell, roles: ["admin", "asset_manager", "dept_head", "employee"] },
  { title: "Organization", url: "/app/organization", icon: Building2, roles: ["admin"] },
  { title: "Settings", url: "/app/settings", icon: Settings, roles: ["admin", "asset_manager", "dept_head", "employee"] },
  { title: "Help", url: "/app/help", icon: LifeBuoy, roles: ["admin", "asset_manager", "dept_head", "employee"] },
];

export function Sidebar({
  role,
  collapsed,
  onToggle,
  onNavigate,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = allItems.filter((i) => i.roles.includes(role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass shadow-soft m-3 flex h-[calc(100dvh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-3xl"
    >
      <div className={cn("flex items-center gap-2.5 px-4 pt-5 pb-3", collapsed && "justify-center px-0")}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
          <Layers className="h-5 w-5" />
        </div>
        {!collapsed && <span className="text-lg font-bold tracking-tight">AssetFlow</span>}
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              onClick={onNavigate}
              aria-label={item.title}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl gradient-primary shadow-glow"
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="relative z-10 truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </motion.aside>
  );
}
