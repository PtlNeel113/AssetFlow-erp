import React, { useState, useEffect } from "react";
import { Employee, ActivityLog, Notification } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  FileClock, 
  Search, 
  Bell, 
  Check, 
  CheckCheck,
  Clock,
  Filter,
  User,
  Trash2,
  AlertTriangle,
  Info
} from "lucide-react";

interface ActivityLogsProps {
  currentUser: Employee;
}

export default function ActivityLogs({ currentUser }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLogs(AssetFlowStore.getActivityLogs());
    setNotifications(AssetFlowStore.getNotifications());
  }, []);

  const handleMarkAllRead = () => {
    const list = AssetFlowStore.getNotifications().map(n => ({ ...n, isRead: true }));
    AssetFlowStore.saveNotifications(list);
    setNotifications(list);
  };

  const handleClearNotifications = () => {
    AssetFlowStore.saveNotifications([]);
    setNotifications([]);
  };

  const handleMarkSingleRead = (id: string) => {
    const list = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    AssetFlowStore.saveNotifications(list);
    setNotifications(list);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterType === "all" || log.relatedEntity.toLowerCase() === filterType.toLowerCase();
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.relatedEntity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Color formatter for Related Entity badges
  const getEntityBadgeStyle = (entity: string) => {
    switch (entity.toLowerCase()) {
      case "asset": return "bg-[#F1E9EE] text-[#714B67]";
      case "maintenance": return "bg-[#FBEEDF] text-[#D9822B]";
      case "booking": return "bg-[#FCF1DA] text-[#D89614]";
      case "allocation": return "bg-[#E7F1FA] text-[#3B82C4]";
      case "transfer": return "bg-[#E1F5F4] text-[#00A09D]";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">System Logs & Notifications</h2>
        <p className="text-xs text-[#6B6675] mt-1">Audit security logs, review system events, and track notification registers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Left/Mid: Full Activity Trail */}
        <div className="lg:col-span-2 bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E4EA] gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#F1E9EE] text-[#714B67] rounded-lg">
                <FileClock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-sans">Audit trail logs</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Chronological record of corporate inventory transactions.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                id="log-entity-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs font-semibold text-[#6B6675] focus:outline-none"
              >
                <option value="all">All Modules</option>
                <option value="asset">Assets</option>
                <option value="allocation">Allocations</option>
                <option value="transfer">Transfers</option>
                <option value="booking">Bookings</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="log-search"
              placeholder="Search audit lines by operator, asset tag, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
            />
          </div>

          <div className="overflow-x-auto border border-[#E5E4EA] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse" id="system-audit-logs-table">
              <thead className="bg-[#F4F5FA]/50 border-b border-[#E5E4EA]">
                <tr>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Operator</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Module Type</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Action Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#6B6675]/60">
                      No system logs found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F4F5FA]/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{log.userName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getEntityBadgeStyle(log.relatedEntity)}`}>
                          {log.relatedEntity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{log.actionDescription}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column Right: Full Notifications Feed */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#E5E4EA] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#714B67]" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Notification logs</h3>
            </div>
            <div className="flex space-x-1">
              <button
                id="btn-mark-all-read"
                onClick={handleMarkAllRead}
                className="p-1 text-[#00A09D] hover:bg-[#E1F5F4] rounded-lg transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                id="btn-clear-all-notifications"
                onClick={handleClearNotifications}
                className="p-1 text-[#C5432D] hover:bg-[#FBEAE6] rounded-lg transition-colors cursor-pointer"
                title="Clear all alerts"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-[#6B6675]/60 text-xs">
                No alerts or notifications in archive.
              </div>
            ) : (
              notifications.map((not) => (
                <div 
                  key={not.id}
                  className={`p-3.5 border rounded-xl space-y-2 relative transition-all ${
                    not.isRead ? "bg-white border-[#E5E4EA]" : "bg-[#F1E9EE]/40 border-[#714B67]/15"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">{not.title}</h4>
                    {!not.isRead && (
                      <button
                        id={`mark-read-single-${not.id}`}
                        onClick={() => handleMarkSingleRead(not.id)}
                        className="p-1 bg-[#E1F5F4] text-[#00A09D] hover:bg-[#00A09D]/15 rounded cursor-pointer transition-colors"
                        title="Mark read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6675] leading-relaxed break-words">{not.message}</p>
                  <span className="block text-[9px] font-mono text-gray-400">
                    {new Date(not.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
