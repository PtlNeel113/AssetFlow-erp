import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Search, User as UserIcon, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import { initials, notifications, roleLabels } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Topbar({
  onOpenSearch,
  onOpenMobileNav,
}: {
  onOpenSearch: () => void;
  onOpenMobileNav: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = notifications.filter((n) => !n.read).length;

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1));

  return (
    <header className="glass shadow-soft sticky top-3 z-30 mx-3 mt-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:mx-0 sm:px-4 lg:mt-3">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-sm sm:flex">
        <span className="text-muted-foreground">AssetFlow</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className={cn(i === crumbs.length - 1 ? "font-semibold" : "text-muted-foreground")}>
              {c}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        onClick={onOpenSearch}
        className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card/70 px-3 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:shadow-glow sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search anything…</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Notifications"
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card/70 text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full gradient-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 rounded-2xl p-2 shadow-float">
          <p className="px-3 py-2 text-sm font-semibold">Notifications</p>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {notifications.slice(0, 5).map((n) => (
              <Link
                key={n.id}
                to="/app/notifications"
                className="block rounded-xl px-3 py-2 transition-colors hover:bg-secondary"
              >
                <p className="flex items-center gap-2 text-sm font-medium">
                  {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate">{n.title}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>
              </Link>
            ))}
          </div>
          <Link
            to="/app/notifications"
            className="mt-1 block rounded-xl px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-secondary"
          >
            View all
          </Link>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Profile menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-primary-foreground shadow-glow"
            style={{ background: user?.avatarColor ?? "#6C63FF" }}
          >
            {user ? initials(user.name) : <UserIcon className="h-4 w-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-float">
          <DropdownMenuLabel>
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs font-normal text-muted-foreground">
              {user ? roleLabels[user.role] : ""} · {user?.department}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
            <UserIcon className="h-4 w-4" /> Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                <LogOut className="h-4 w-4" /> Log out
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of AssetFlow?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your session will end and you'll be returned to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full"
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                >
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
