import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Boxes,
  CheckCircle2,
  ArrowLeftRight,
  Clock,
  Wrench,
  AlertTriangle,
  Trash2,
  Plus,
  ClipboardCheck,
  FileBarChart,
  BadgeCheck,
  CalendarDays,
  Undo2,
  QrCode,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { StatCard } from "@/components/app/StatCard";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusChip } from "@/components/app/StatusChip";
import { useAuth } from "@/lib/auth";
import {
  activity,
  allocationTrend,
  assets,
  bookingHeatmap,
  bookings,
  categoryDistribution,
  departments,
  maintenance,
  maintenanceTrend,
  roleLabels,
} from "@/lib/data";

export const Route = createFileRoute("/app/dashboard")({
  component: Dashboard,
});

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid var(--border)",
  background: "var(--card)",
  boxShadow: "var(--shadow-float)",
  fontSize: 12,
};

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`card-float p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 h-56">{children}</div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick ?? (() => toast.success(`${label} — opened`, { description: "Demo action triggered." }))}
      className="card-float card-hover flex flex-col items-center gap-2.5 p-4 text-center"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Good morning, ${user.name.split(" ")[0]}`}
        subtitle={`${roleLabels[user.role]} · ${user.department} — here's what's happening today.`}
        actions={
          user.role === "admin" || user.role === "asset_manager" ? (
            <button
              onClick={() => toast.success("New asset draft created")}
              className="btn-gradient inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Add Asset
            </button>
          ) : (
            <Link to="/app/bookings" className="btn-gradient inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" /> Quick Book
            </Link>
          )
        }
      />

      {user.role === "admin" && <AdminDashboard />}
      {user.role === "asset_manager" && <ManagerDashboard />}
      {user.role === "dept_head" && <DeptHeadDashboard />}
      {user.role === "employee" && <EmployeeDashboard />}
    </div>
  );
}

function AdminDashboard() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
        <StatCard label="Total Assets" value="1,128" icon={Boxes} delta="+4.2%" index={0} />
        <StatCard label="Available" value="412" icon={CheckCircle2} tone="success" delta="+2.1%" index={1} />
        <StatCard label="Allocated" value="486" icon={ArrowLeftRight} tone="accent" delta="+6.4%" index={2} />
        <StatCard label="Reserved" value="74" icon={Clock} tone="primary" index={3} />
        <StatCard label="Maintenance" value="38" icon={Wrench} tone="warning" delta="-8%" deltaUp={false} index={4} />
        <StatCard label="Lost" value="6" icon={AlertTriangle} tone="destructive" index={5} />
        <StatCard label="Disposed" value="60" icon={Trash2} tone="destructive" index={6} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        <QuickAction icon={Plus} label="Add Asset" />
        <QuickAction icon={ClipboardCheck} label="Create Audit" />
        <QuickAction icon={BadgeCheck} label="Approve Requests" />
        <QuickAction icon={FileBarChart} label="Reports" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Allocation Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={allocationTrend}>
              <defs>
                <linearGradient id="gradAlloc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="allocated" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gradAlloc)" />
              <Area type="monotone" dataKey="returned" stroke="var(--chart-2)" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Asset Categories">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                {categoryDistribution.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance Trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintenanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="requests" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="resolved" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">Booking Heatmap</h3>
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-[2.5rem_1fr] items-center gap-2">
              <span />
              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground">
                {["8a", "10a", "12p", "2p", "4p", "6p", "8p"].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
            </div>
            {bookingHeatmap.map((row) => (
              <div key={row.day} className="grid grid-cols-[2.5rem_1fr] items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{row.day}</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {row.values.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.02 * i }}
                      className="h-7 rounded-md"
                      style={{ background: `color-mix(in oklab, var(--primary) ${v * 9}%, var(--muted))` }}
                      title={`${row.day} — ${v} bookings`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <ActivityTimeline />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">Department Distribution</h3>
          <div className="mt-4 space-y-3.5">
            {departments.map((d) => (
              <div key={d.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.assets} assets</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.assets / 340) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function ManagerDashboard() {
  const pending = maintenance.filter((m) => ["Pending", "Approved", "Assigned"].includes(m.status));
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Assets In Stock" value="412" icon={Boxes} tone="success" delta="+12" index={0} />
        <StatCard label="Transfers In Progress" value="9" icon={ArrowLeftRight} tone="accent" index={1} />
        <StatCard label="Allocation Queue" value="14" icon={Clock} tone="primary" delta="+3" index={2} />
        <StatCard label="Pending Maintenance" value={String(pending.length)} icon={Wrench} tone="warning" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">Upcoming Returns</h3>
          <div className="mt-3 space-y-2">
            {assets.filter((a) => a.holder && a.status === "Allocated").slice(0, 4).map((a) => (
              <Link
                key={a.id}
                to="/app/assets/$assetId"
                params={{ assetId: a.id }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.holder} · {a.tag}</p>
                </div>
                <StatusChip status={a.status} />
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">Pending Maintenance</h3>
          <div className="mt-3 space-y-2">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.asset}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.issue}</p>
                </div>
                <StatusChip status={m.priority} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <ChartCard title="Inventory Summary — Allocation Trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={allocationTrend}>
            <defs>
              <linearGradient id="gradMgr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="allocated" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#gradMgr)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
}

function DeptHeadDashboard() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Department Assets" value="212" icon={Boxes} index={0} />
        <StatCard label="Pending Approvals" value="5" icon={BadgeCheck} tone="warning" index={1} />
        <StatCard label="Active Bookings" value="11" icon={CalendarDays} tone="accent" index={2} />
        <StatCard label="Utilization" value="91%" icon={FileBarChart} tone="success" delta="+3.2%" index={3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Department Utilization">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departments} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={86} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="utilization" fill="var(--chart-1)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">Upcoming Department Bookings</h3>
          <div className="mt-3 space-y-2">
            {bookings.filter((b) => b.status !== "Cancelled").slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.asset}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.user} · {b.purpose}</p>
                </div>
                <StatusChip status={b.status} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function EmployeeDashboard() {
  const mine = assets.filter((a) => a.holder === "Jordan Lee");
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Assigned Assets" value={String(mine.length)} icon={Boxes} index={0} />
        <StatCard label="Upcoming Bookings" value="2" icon={CalendarDays} tone="accent" index={1} />
        <StatCard label="Open Requests" value="1" icon={Wrench} tone="warning" index={2} />
        <StatCard label="Notifications" value="3" icon={AlertTriangle} tone="primary" index={3} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={CalendarDays} label="Quick Book" />
        <QuickAction icon={Undo2} label="Return Asset" />
        <QuickAction icon={Wrench} label="Report Issue" />
        <QuickAction icon={QrCode} label="Scan QR" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">My Assets</h3>
          <div className="mt-3 space-y-2">
            {mine.map((a) => (
              <Link
                key={a.id}
                to="/app/assets/$assetId"
                params={{ assetId: a.id }}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.tag} · {a.location}</p>
                </div>
                <StatusChip status={a.status} />
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
          <h3 className="text-sm font-semibold">My Bookings</h3>
          <div className="mt-3 space-y-2">
            {bookings.filter((b) => b.user === "Jordan Lee").map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.asset}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.purpose}</p>
                </div>
                <StatusChip status={b.status} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function ActivityTimeline() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-float p-5">
      <h3 className="text-sm font-semibold">Recent Activity</h3>
      <div className="mt-4 space-y-0">
        {activity.slice(0, 5).map((ev, i) => (
          <div key={ev.id} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < 4 && <span className="absolute top-6 left-[9px] h-full w-px bg-border" />}
            <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10">
              <span className="h-2 w-2 rounded-full bg-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{ev.user}</span>{" "}
                <span className="text-muted-foreground">{ev.action}</span>{" "}
                <span className="font-medium">{ev.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{ev.time} · {ev.role}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
