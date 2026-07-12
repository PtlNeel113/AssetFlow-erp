import React, { useState, useEffect } from "react";
import { Employee, AssetStatus, Asset, ResourceBooking, MaintenanceRequest, Notification } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  PlusCircle, 
  Calendar, 
  Wrench, 
  AlertTriangle, 
  CheckSquare, 
  Laptop, 
  BookOpen, 
  ArrowRightLeft, 
  Clock, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";

interface DashboardProps {
  currentUser: Employee;
  onNavigate: (screen: string) => void;
}

export default function Dashboard({ currentUser, onNavigate }: DashboardProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [overdueCount, setOverdueCount] = useState(3);
  const [conflictResolved, setConflictResolved] = useState(false);

  useEffect(() => {
    // Sync lists from localStorage
    setAssets(AssetFlowStore.getAssets());
    setBookings(AssetFlowStore.getBookings());
    setMaintenances(AssetFlowStore.getMaintenance());
    setNotifications(AssetFlowStore.getNotifications());
  }, []);

  // Compute live KPIs
  const availableCount = assets.filter(a => a.status === AssetStatus.AVAILABLE).length;
  const allocatedCount = assets.filter(a => a.status === AssetStatus.ALLOCATED).length;
  const maintenanceToday = maintenances.filter(m => m.stage !== "Resolved").length;
  const activeBookings = bookings.filter(b => b.status === "Upcoming" || b.status === "Ongoing").length;
  const pendingTransfers = AssetFlowStore.getTransfers().filter(t => t.status === "Requested").length;
  const lostOverdueCount = assets.filter(a => a.status === AssetStatus.LOST).length;

  const handleMarkAsRead = (id: string) => {
    const list = AssetFlowStore.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
    AssetFlowStore.saveNotifications(updated);
    setNotifications(updated);
  };

  const handleTriggerTransfer = () => {
    // Simulate resolving conflict by creating a transfer request
    const transfers = AssetFlowStore.getTransfers();
    const conflictAsset = assets.find(a => a.tag === "AF-0114");
    if (conflictAsset) {
      const newTransfer = {
        id: "tr-" + Date.now(),
        assetId: conflictAsset.id,
        assetTag: conflictAsset.tag,
        assetName: conflictAsset.name,
        fromEmployeeId: conflictAsset.holderId || "emp-2",
        fromEmployeeName: conflictAsset.holderName || "Priya Sharma",
        toEmployeeId: currentUser.id,
        toEmployeeName: currentUser.name,
        requestDate: new Date().toISOString().split("T")[0],
        status: "Requested" as const
      };
      AssetFlowStore.saveTransfers([...transfers, newTransfer]);
      AssetFlowStore.addActivityLog(currentUser.name, `Sent transfer request for ${conflictAsset.tag}`, "Transfer");
      AssetFlowStore.addNotification(
        "Transfer requested",
        `${currentUser.name} has requested the transfer of ${conflictAsset.tag} (${conflictAsset.name}).`,
        "info"
      );
      setConflictResolved(true);
    }
  };

  // Format notification badge color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "danger": return "bg-[#FBEAE6] text-[#C5432D] border-[#C5432D]/10";
      case "warning": return "bg-[#FBEEDF] text-[#D9822B] border-[#D9822B]/10";
      case "success": return "bg-[#E1F5F4] text-[#00A09D] border-[#00A09D]/10";
      default: return "bg-[#E7F1FA] text-[#3B82C4] border-[#3B82C4]/10";
    }
  };

  // Render uniform badge
  const renderStatusBadge = (status: AssetStatus) => {
    let dotColor = "bg-[#6B6675]";
    let bgColor = "bg-[#F4F5FA]";
    let textColor = "text-[#6B6675]";

    if (status === AssetStatus.AVAILABLE) {
      dotColor = "bg-[#00A09D]";
      bgColor = "bg-[#E1F5F4]";
      textColor = "text-[#00A09D]";
    } else if (status === AssetStatus.ALLOCATED) {
      dotColor = "bg-[#3B82C4]";
      bgColor = "bg-[#E7F1FA]";
      textColor = "text-[#3B82C4]";
    } else if (status === AssetStatus.RESERVED) {
      dotColor = "bg-[#D89614]";
      bgColor = "bg-[#FCF1DA]";
      textColor = "text-[#D89614]";
    } else if (status === AssetStatus.UNDER_MAINTENANCE) {
      dotColor = "bg-[#D9822B]";
      bgColor = "bg-[#FBEEDF]";
      textColor = "text-[#D9822B]";
    } else if (status === AssetStatus.LOST) {
      dotColor = "bg-[#C5432D]";
      bgColor = "bg-[#FBEAE6]";
      textColor = "text-[#C5432D]";
    } else if (status === AssetStatus.RETIRED_DISPOSED) {
      dotColor = "bg-[#6B6675]";
      bgColor = "bg-[#E5E4EA]/60";
      textColor = "text-[#6B6675]";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border border-transparent`}>
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotColor}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Greeting Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Good morning, {currentUser.name}</h2>
          <p className="text-xs text-[#6B6675] mt-1">Here is a summary of your organization's assets and resources for today.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            id="dash-action-register"
            onClick={() => onNavigate("directory")}
            className="inline-flex items-center px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow cursor-pointer transition-all space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register asset</span>
          </button>
          <button
            id="dash-action-book"
            onClick={() => onNavigate("bookings")}
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-[#F1E9EE] text-[#714B67] border border-[#714B67]/25 text-xs font-semibold rounded-lg cursor-pointer transition-all space-x-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Book resource</span>
          </button>
          <button
            id="dash-action-maintenance"
            onClick={() => onNavigate("maintenance")}
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-[#FBEEDF] text-[#D9822B] border border-[#D9822B]/25 text-xs font-semibold rounded-lg cursor-pointer transition-all space-x-1.5"
          >
            <Wrench className="w-4 h-4" />
            <span>Raise request</span>
          </button>
        </div>
      </div>

      {/* Red banner for overdue items */}
      <div 
        id="overdue-returns-banner" 
        onClick={() => onNavigate("allocations")}
        className="p-4 bg-[#FBEAE6] hover:bg-[#FBEAE6]/90 border border-[#C5432D]/15 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#C5432D] text-white flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#C5432D] uppercase tracking-wider">Attention Required</h4>
            <p className="text-xs text-[#C5432D]/90 font-medium mt-0.5">3 overdue returns and {lostOverdueCount} overdue booking need attention — view details</p>
          </div>
        </div>
        <div className="flex items-center text-[#C5432D] text-xs font-semibold group-hover:translate-x-1 transition-transform">
          <span>View all</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Available */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#00A09D]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Available</span>
            <div className="w-8 h-8 rounded-lg bg-[#E1F5F4] text-[#00A09D] flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-2xl font-bold text-[#00A09D] tracking-tight">{availableCount}</span>
            <span className="text-[10px] text-[#6B6675] font-medium mt-1">Ready to deploy</span>
          </div>
        </div>

        {/* Allocated */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#3B82C4]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Allocated</span>
            <div className="w-8 h-8 rounded-lg bg-[#E7F1FA] text-[#3B82C4] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-2xl font-bold text-[#3B82C4] tracking-tight">{allocatedCount}</span>
            <span className="text-[10px] text-[#6B6675] font-medium mt-1">Active deployments</span>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#D9822B]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">In Repair</span>
            <div className="w-8 h-8 rounded-lg bg-[#FBEEDF] text-[#D9822B] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-2xl font-bold text-[#D9822B] tracking-tight">{maintenanceToday}</span>
            <span className="text-[10px] text-[#6B6675] font-medium mt-1">Active maintenance</span>
          </div>
        </div>

        {/* Active Bookings */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#D89614]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-[#FCF1DA] text-[#D89614] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-2xl font-bold text-[#D89614] tracking-tight">{activeBookings}</span>
            <span className="text-[10px] text-[#6B6675] font-medium mt-1">Scheduled assets</span>
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#714B67]/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Transfers</span>
            <div className="w-8 h-8 rounded-lg bg-[#F1E9EE] text-[#714B67] flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-2xl font-bold text-[#714B67] tracking-tight">{pendingTransfers}</span>
            <span className="text-[10px] text-[#6B6675] font-medium mt-1">Approvals requested</span>
          </div>
        </div>

        {/* Upcoming Returns */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#3B82C4]/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Overdue Items</span>
            <div className="w-8 h-8 rounded-lg bg-[#FBEAE6] text-[#C5432D] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="block text-2xl font-bold text-[#C5432D] tracking-tight">{lostOverdueCount}</span>
            <span className="text-[10px] text-[#6B6675] font-medium mt-1">Requiring check-in</span>
          </div>
        </div>
      </div>

      {/* Overlap Conflict Simulator Card */}
      <div className="bg-white border border-[#E5E4EA] rounded-xl p-5">
        <h3 className="text-xs font-bold text-[#6B6675] uppercase tracking-wider mb-3">Conflict Prevention Simulator (Odoo Safeguard)</h3>
        {conflictResolved ? (
          <div className="p-4 bg-[#E1F5F4] border border-[#00A09D]/20 rounded-xl flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#00A09D] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[#00A09D] font-bold">Transfer request successfully sent!</p>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Asset AF-0114 remains securely allocated to Priya Sharma. Action logged in Odoo chatter logs. View requested transfers in the "Allocation & Transfer" tab.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#FBEAE6] border border-[#C5432D]/15 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-[#C5432D] font-bold">Allocation blocked: AF-0114 is currently held by Priya Sharma.</p>
              <p className="text-[11px] text-[#6B6675] mt-0.5">AssetFlow locks double-allocations at the ERP core level. You can request a transfer instead.</p>
            </div>
            <button
              onClick={handleTriggerTransfer}
              className="sm:shrink-0 inline-flex items-center px-3 py-1.5 bg-[#C5432D] text-white hover:bg-[#C5432D]/90 text-xs font-semibold rounded-lg cursor-pointer transition-all space-x-1"
            >
              <span>Send transfer request instead</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Two-Column Activity & Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Recent Assets Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5E4EA] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E4EA] mb-4">
              <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Recent asset activity</h3>
              <button onClick={() => onNavigate("directory")} className="text-[11px] text-[#714B67] hover:underline font-semibold flex items-center">
                <span>View directory</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4EA]">
                    <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Asset Tag</th>
                    <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Asset Name</th>
                    <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Current Holder</th>
                    <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                  {assets.slice(0, 5).map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#F4F5FA]/50 transition-colors">
                      <td className="py-3 font-mono font-bold text-[#714B67]">{asset.tag}</td>
                      <td className="py-3 font-medium text-gray-900">{asset.name}</td>
                      <td className="py-3">{asset.holderName || "—"}</td>
                      <td className="py-3">{renderStatusBadge(asset.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Notification Feed */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E4EA] mb-4">
              <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Notifications</h3>
              <button onClick={() => onNavigate("logs")} className="text-[11px] text-[#714B67] hover:underline font-semibold">
                View all
              </button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-[#6B6675]/60">No new notifications</p>
                </div>
              ) : (
                notifications.slice(0, 4).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 rounded-lg border flex space-x-3 transition-colors ${
                      notif.isRead ? "bg-white border-[#E5E4EA]" : "bg-[#F1E9EE]/40 border-[#714B67]/10"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border h-fit shrink-0 ${getNotificationColor(notif.type)}`}>
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{notif.title}</h4>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-0.5 bg-[#E1F5F4] hover:bg-[#00A09D]/20 text-[#00A09D] rounded cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B6675] leading-relaxed break-words">{notif.message}</p>
                      <span className="block text-[10px] text-[#6B6675]/60">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
