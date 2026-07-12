import React, { useState, useEffect } from "react";
import { Employee, UserRole } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  LayoutDashboard, 
  FolderTree, 
  ArrowRightLeft, 
  CalendarRange, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  FileClock, 
  Settings, 
  Code,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Clock,
  ShieldCheck,
  Zap,
  Info,
  Sun,
  Moon,
  UserCircle2
} from "lucide-react";

interface MainLayoutProps {
  currentUser: Employee;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  theme: string;
  setTheme: (theme: string) => void;
}

export default function MainLayout({ 
  currentUser, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  children,
  theme,
  setTheme
}: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [emulatedRole, setEmulatedRole] = useState<UserRole>(currentUser.role);

  useEffect(() => {
    // Clock tick
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Refresh alerts
    setUnreadNotifications(AssetFlowStore.getNotifications().filter(n => !n.isRead));
  }, [activeTab]);

  // Hackathon Evaluator Quick Role-Swapper
  const handleRoleEmulation = (role: UserRole) => {
    setEmulatedRole(role);
    const updatedUser = { ...currentUser, role };
    AssetFlowStore.setCurrentUser(updatedUser);
    
    // Patch inside active employees list for data sync
    const employees = AssetFlowStore.getEmployees();
    const updatedEmployees = employees.map(e => e.id === currentUser.id ? { ...e, role } : e);
    AssetFlowStore.saveEmployees(updatedEmployees);

    AssetFlowStore.addActivityLog("Hackathon Emulator", `Emulated user role switched to ${role}`, "Security");
    AssetFlowStore.addNotification("Role Emulated", `Successfully shifted system view permissions to: ${role}.`, "success");
    
    // Refresh page state smoothly
    window.dispatchEvent(new Event("storage"));
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "directory", label: "Asset Directory", icon: FolderTree },
    { id: "allocations", label: "Custody Allocation", icon: ArrowRightLeft },
    { id: "bookings", label: "Shared Bookings", icon: CalendarRange },
    { id: "maintenance", label: "Maintenance Board", icon: Wrench },
    { id: "audits", label: "Asset Audits", icon: ClipboardCheck },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { id: "logs", label: "System Audit Logs", icon: FileClock },
    { id: "org-setup", label: "Organization Setup", icon: Settings, adminOnly: true },
    { id: "odoo", label: "Developer/Odoo Code", icon: Code }
  ];

  const handleNavClick = (id: string, adminOnly?: boolean) => {
    if (adminOnly && currentUser.role !== UserRole.ADMIN) {
      AssetFlowStore.addNotification(
        "Access Restricted",
        "Organization Setup is an Admin-only screen. Use the Quick Swapper at the top to become Admin.",
        "danger"
      );
      return;
    }
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F5FA] flex text-[#211F24] font-sans antialiased">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E5E4EA] shrink-0 fixed inset-y-0 left-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-[#E5E4EA] flex items-center space-x-2.5 bg-white">
          <img src="/assets/WhatsApp Image 2026-07-12 at 11.57.14 AM.jpeg" alt="AssetFlow logo" className="h-9 w-9 rounded-lg object-cover border border-[#E5E4EA]" />
          <div>
            <h1 className="font-extrabold text-[#714B67] leading-none tracking-tight text-sm">AssetFlow ERP</h1>
            <span className="text-[9px] font-mono font-bold tracking-widest text-[#00A09D] uppercase">Odoo Edition</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const locked = item.adminOnly && currentUser.role !== UserRole.ADMIN;

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id, item.adminOnly)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-l-lg rounded-r-none text-xs font-semibold tracking-wide transition-all cursor-pointer border-r-4 ${
                  active 
                    ? "bg-[#F1E9EE] text-[#714B67] border-[#714B67]" 
                    : "text-[#6B6675] hover:bg-[#F4F5FA]/80 hover:text-gray-900 border-transparent"
                } ${locked ? "opacity-60" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? "text-[#714B67]" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    currentUser.role === UserRole.ADMIN ? "bg-[#E1F5F4] text-[#00A09D]" : "bg-[#FBEAE6] text-[#C5432D]"
                  }`}>
                    {currentUser.role === UserRole.ADMIN ? "Admin" : "Locked"}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar User profile info */}
        <div className="p-4 border-t border-[#E5E4EA] bg-white space-y-3">
          <button onClick={() => setActiveTab("profile")} className="w-full rounded-xl border border-[#E5E4EA] bg-[#F4F5FA]/70 p-2.5 text-left transition-all hover:bg-[#F1E9EE] cursor-pointer">
            <div className="flex items-center space-x-3">
              {currentUser.profilePhoto ? (
                <img src={currentUser.profilePhoto} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#714B67]/20 to-[#00A09D]/20 border border-[#714B67]/10 flex items-center justify-center text-[#714B67] font-bold text-sm shadow-inner uppercase">
                  {currentUser.name.substring(0,2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</h4>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate uppercase font-bold">{currentUser.role.replace("_", " ")}</p>
                <p className="text-[10px] text-[#714B67] mt-0.5 font-semibold">Open profile</p>
              </div>
            </div>
          </button>
          <button
            id="btn-sidebar-signout"
            onClick={onLogout}
            className="w-full py-1.5 border border-[#E5E4EA] text-xs font-bold text-gray-500 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer flex items-center justify-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-[#E5E4EA] flex items-center justify-between px-4 z-40">
        <div className="flex items-center space-x-2.5">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 cursor-pointer">
            <Menu className="w-6 h-6 text-[#714B67]" />
          </button>
          <div className="w-7 h-7 rounded bg-[#714B67] flex items-center justify-center text-white font-extrabold text-xs">AF</div>
          <span className="font-extrabold text-[#714B67] text-xs">AssetFlow ERP</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Dark Mode Toggle */}
          <button
            id="theme-toggle-btn-mobile"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-400 cursor-pointer flex items-center justify-center"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>

          <button onClick={() => handleNavClick("logs")} className="relative p-2 text-gray-400 cursor-pointer">
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#C5432D] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fadeIn">
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl flex flex-col p-5 space-y-4 animate-slideIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-[#714B67] flex items-center justify-center text-white font-bold text-xs">AF</div>
                <span className="font-bold text-[#714B67] text-xs">AssetFlow ERP</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id, item.adminOnly)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold ${
                      active ? "bg-[#F1E9EE] text-[#714B67]" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={onLogout}
              className="w-full py-2.5 bg-[#C5432D] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        {/* HEADER TOOLBAR */}
        <header className="hidden lg:flex h-16 bg-white border-b border-[#E5E4EA] items-center justify-between px-8 sticky top-0 z-20">
          {/* Left: Quick Actions & Search */}
          <div className="flex items-center space-x-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources, tags, custodians..."
                className="w-full pl-9 pr-4 py-1.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] transition-all"
              />
            </div>

            {/* Quick module indicators */}
            <div className="flex space-x-1.5">
              <button 
                id="header-shortcut-alloc"
                onClick={() => setActiveTab("allocations")}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-[#6B6675] hover:bg-gray-100 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                + Deploy Custody
              </button>
              <button 
                id="header-shortcut-maint"
                onClick={() => setActiveTab("maintenance")}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-[#6B6675] hover:bg-gray-100 rounded text-[10px] font-bold cursor-pointer transition-colors"
              >
                + Raise Repair
              </button>
            </div>
          </div>

          {/* Right: Clock & Emulator Swapper */}
          <div className="flex items-center space-x-5">
            {/* System clock */}
            <div className="flex items-center space-x-1 text-xs text-[#6B6675] font-semibold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-[#00A09D]" />
              <span className="font-mono">{currentTime || "00:00:00"}</span>
            </div>

            {/* Hackathon Emulator Dropdown */}
            <div className="flex items-center space-x-2 bg-[#FBEEDF] border border-[#D9822B]/20 px-3 py-1.5 rounded-lg shadow-sm">
              <Zap className="w-3.5 h-3.5 text-[#D9822B] shrink-0" />
              <label className="text-[10px] font-black uppercase text-[#D9822B] tracking-wider shrink-0">Role Swapper:</label>
              <select
                id="emulator-role-swapper"
                value={currentUser.role}
                onChange={(e) => handleRoleEmulation(e.target.value as UserRole)}
                className="bg-white border border-[#D9822B]/25 rounded text-[10px] font-bold text-gray-800 py-0.5 px-2 outline-none cursor-pointer"
                title="Simulate different role flows instantly"
              >
                <option value={UserRole.ADMIN}>Admin (All Access)</option>
                <option value={UserRole.ASSET_MANAGER}>Asset Manager</option>
                <option value={UserRole.DEPARTMENT_HEAD}>Dept Head</option>
                <option value={UserRole.EMPLOYEE}>Employee (Read-Only)</option>
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Alert Bell */}
            <div className="relative">
              <button
                id="header-notification-bell"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#C5432D] rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification Popover */}
              {isNotificationOpen && (
                <div id="bell-dropdown-popover" className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E4EA] rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 bg-[#714B67] text-white flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider">Unread Alerts</span>
                    <button onClick={() => { setActiveTab("logs"); setIsNotificationOpen(false); }} className="text-[10px] hover:underline font-bold">View all</button>
                  </div>
                  <div className="divide-y divide-[#E5E4EA]/50 max-h-64 overflow-y-auto">
                    {unreadNotifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">All caught up! No unread notifications.</div>
                    ) : (
                      unreadNotifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-gray-50 cursor-pointer" onClick={() => { setActiveTab("logs"); setIsNotificationOpen(false); }}>
                          <h5 className="font-bold text-[11px] text-gray-900 leading-tight">{n.title}</h5>
                          <p className="text-[10px] text-[#6B6675] mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER VIEW WRAPPER */}
        <main className="flex-1 p-6 md:p-8 mt-16 lg:mt-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
