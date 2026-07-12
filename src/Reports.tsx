import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Download, 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Grid3X3,
  FileSpreadsheet,
  Mail,
  BellRing,
  CalendarDays,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { AssetFlowStore } from "../mockData";
import { triggerSystemNotification, requestNotificationPermission } from "../utils/notificationHelper";

export default function Reports() {
  // MOCK TELEMETRY DATA MATCHING THE ODOO COLOR PALETTE
  const utilizationData = [
    { month: "Jan", Laptops: 65, Furniture: 40, Vehicles: 10, Conf: 20 },
    { month: "Feb", Laptops: 70, Furniture: 42, Vehicles: 25, Conf: 30 },
    { month: "Mar", Laptops: 75, Furniture: 45, Vehicles: 30, Conf: 45 },
    { month: "Apr", Laptops: 85, Furniture: 50, Vehicles: 40, Conf: 55 },
    { month: "May", Laptops: 88, Furniture: 55, Vehicles: 50, Conf: 65 },
    { month: "Jun", Laptops: 92, Furniture: 58, Vehicles: 65, Conf: 70 },
    { month: "Jul", Laptops: 96, Furniture: 60, Vehicles: 75, Conf: 80 }
  ];

  const maintenanceData = [
    { category: "Laptops", active: 2, resolved: 14, preventive: 8 },
    { category: "Furniture", active: 0, resolved: 4, preventive: 2 },
    { category: "Vehicles", active: 1, resolved: 3, preventive: 5 },
    { category: "Conf. Equip", active: 0, resolved: 1, preventive: 3 }
  ];

  const departmentData = [
    { name: "Engineering & IT", value: 45, color: "#714B67" },
    { name: "Design & UX", value: 20, color: "#3B82C4" },
    { name: "Administration", value: 15, color: "#00A09D" },
    { name: "Operations & Logistics", value: 20, color: "#D9822B" }
  ];

  // HEATMAP GRID FOR RESOURCE BOOKING: 5 Days vs 5 Intervals
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const times = ["09:00", "11:00", "13:00", "15:00", "17:00"];
  // Mock occupancy density (0: low, 1: medium, 2: peak)
  const heatmapData = [
    [2, 1, 0, 1, 0], // Mon
    [1, 2, 2, 1, 1], // Tue
    [0, 1, 2, 2, 0], // Wed
    [2, 2, 1, 1, 2], // Thu
    [1, 0, 0, 1, 0]  // Fri
  ];

  const currentUser = AssetFlowStore.getCurrentUser();
  const [email, setEmail] = useState(currentUser?.email || "nirajsharma250707@gmail.com");
  const [day, setDay] = useState("Monday");
  const [reportType, setReportType] = useState("Both (Utilization & Maintenance)");
  const [subscriptions, setSubscriptions] = useState<{ id: string; email: string; day: string; reportType: string }[]>([]);
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    const loaded = localStorage.getItem("assetflow_report_subscriptions");
    if (loaded) {
      try {
        setSubscriptions(JSON.parse(loaded));
      } catch {
        setSubscriptions([]);
      }
    } else {
      const seed = [
        { id: "sub-seed", email: currentUser?.email || "nirajsharma250707@gmail.com", day: "Monday", reportType: "Both (Utilization & Maintenance)" }
      ];
      setSubscriptions(seed);
      localStorage.setItem("assetflow_report_subscriptions", JSON.stringify(seed));
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await requestNotificationPermission();

    const newSub = {
      id: "sub-" + Date.now(),
      email,
      day,
      reportType
    };

    const updated = [newSub, ...subscriptions];
    setSubscriptions(updated);
    localStorage.setItem("assetflow_report_subscriptions", JSON.stringify(updated));

    setJustSubscribed(true);
    setTimeout(() => setJustSubscribed(false), 4000);

    // Track logs & send system notifications
    AssetFlowStore.addActivityLog(currentUser.name, `Subscribed ${email} to weekly reports on ${day}`, "Reports");
    AssetFlowStore.addNotification(
      "Report Subscription Confirmed",
      `Weekly email delivery for '${reportType}' has been scheduled for ${email} every ${day} at 09:00 AM IST.`,
      "success"
    );

    triggerSystemNotification(
      "Subscription Successful!",
      `Weekly reports for '${reportType}' will be dispatched to ${email} every ${day}!`
    );
  };

  const handleUnsubscribe = (id: string) => {
    const updated = subscriptions.filter(s => s.id !== id);
    setSubscriptions(updated);
    localStorage.setItem("assetflow_report_subscriptions", JSON.stringify(updated));

    AssetFlowStore.addActivityLog(currentUser.name, `Cancelled a weekly report subscription`, "Reports");
    AssetFlowStore.addNotification(
      "Report Subscription Cancelled",
      "Automated report delivery has been successfully deleted.",
      "info"
    );
  };

  // CSV Exporter helper
  const handleExportCSV = (filename: string, headers: string[], rows: any[][]) => {
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUtilization = () => {
    const headers = ["Month", "Laptops & Computers", "Office Furniture", "Vehicles & Transport", "Conference Equipment"];
    const rows = utilizationData.map(d => [d.month, d.Laptops, d.Furniture, d.Vehicles, d.Conf]);
    handleExportCSV("assetflow_utilization_trends", headers, rows);
  };

  const exportMaintenance = () => {
    const headers = ["Category", "Active Repairs", "Resolved Repairs", "Preventive Audits"];
    const rows = maintenanceData.map(d => [d.category, d.active, d.resolved, d.preventive]);
    handleExportCSV("assetflow_maintenance_frequency", headers, rows);
  };

  const exportDepartment = () => {
    const headers = ["Department", "Allocation Share (%)"];
    const rows = departmentData.map(d => [d.name, d.value]);
    handleExportCSV("assetflow_department_allocation_summary", headers, rows);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Reports & Analytics</h2>
        <p className="text-xs text-[#6B6675] mt-1">Review operational KPI telemetry, repair logs, and load trends across the organization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: LINE CHART */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4EA]">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#F1E9EE] text-[#714B67] rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Asset Utilization Trend (%)</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Deployment utilization densities tracked monthly.</p>
              </div>
            </div>
            <button
              id="export-utilization"
              onClick={exportUtilization}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-[#E5E4EA] text-[#6B6675] hover:bg-gray-50 text-[11px] font-semibold rounded-lg cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F5FA" />
                <XAxis dataKey="month" stroke="#6B6675" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B6675" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E5E4EA" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="Laptops" name="IT Laptops" stroke="#714B67" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Furniture" name="Furniture" stroke="#3B82C4" strokeWidth={2} />
                <Line type="monotone" dataKey="Vehicles" name="Fleet Vehicles" stroke="#D9822B" strokeWidth={2} />
                <Line type="monotone" dataKey="Conf" name="Conf. Media" stroke="#00A09D" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: BAR CHART */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4EA]">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#FBEEDF] text-[#D9822B] rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Maintenance Frequency by Category</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Summary of repairs and compliance audits.</p>
              </div>
            </div>
            <button
              id="export-maintenance"
              onClick={exportMaintenance}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-[#E5E4EA] text-[#6B6675] hover:bg-gray-50 text-[11px] font-semibold rounded-lg cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F5FA" />
                <XAxis dataKey="category" stroke="#6B6675" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B6675" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E5E4EA" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="active" name="Active Tickets" fill="#D53F8C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved Repairs" fill="#00A09D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="preventive" name="Preventive checks" fill="#3B82C4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: PIE CHART */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4EA]">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#E7F1FA] text-[#3B82C4] rounded-lg">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Department allocation summary</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Corporate hardware density shares by department.</p>
              </div>
            </div>
            <button
              id="export-department"
              onClick={exportDepartment}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-[#E5E4EA] text-[#6B6675] hover:bg-gray-50 text-[11px] font-semibold rounded-lg cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 flex-1 w-full text-xs text-[#6B6675]">
              {departmentData.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-[#F4F5FA] rounded border border-[#E5E4EA]/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-semibold text-gray-900">{d.name}</span>
                  </div>
                  <span className="font-mono font-bold text-gray-800">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 4: HEATMAP GRID */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E4EA]">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#E1F5F4] text-[#00A09D] rounded-lg">
                <Grid3X3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Resource Booking Heatmap</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Peak occupancy booking densities mapped by weekday.</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-[9px] text-[#6B6675]">
              <span className="w-2.5 h-2.5 bg-gray-100 border rounded" /><span>Low</span>
              <span className="w-2.5 h-2.5 bg-[#FCF1DA] rounded" /><span>Mid</span>
              <span className="w-2.5 h-2.5 bg-[#714B67] rounded" /><span>Peak</span>
            </div>
          </div>

          {/* Simple Visual Heatmap Grid */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <span className="w-10 text-right" />
              <div className="flex-1 grid grid-cols-5 gap-1 text-center text-[10px] text-[#6B6675] font-bold">
                {times.map(t => <span key={t}>{t}</span>)}
              </div>
            </div>

            {days.map((day, dIdx) => (
              <div key={day} className="flex items-center space-x-2">
                <span className="w-10 text-right font-bold text-[10px] text-gray-900">{day}</span>
                <div className="flex-1 grid grid-cols-5 gap-1.5">
                  {times.map((time, tIdx) => {
                    const density = heatmapData[dIdx][tIdx];
                    let bg = "bg-gray-100 hover:bg-gray-200";
                    if (density === 1) bg = "bg-[#FCF1DA] hover:bg-[#D89614]/30";
                    if (density === 2) bg = "bg-[#714B67] hover:bg-[#714B67]/90";

                    return (
                      <div
                        key={time}
                        className={`h-9 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-300 ${bg}`}
                        title={`${day} @ ${time}: ${density === 2 ? "High Demand" : density === 1 ? "Medium Demand" : "Low Demand"}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WEEKLY REPORT SCHEDULER & SUBSCRIPTIONS */}
      <div className="bg-white border border-[#E5E4EA] rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E4EA] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Weekly ERP Report Scheduler</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Subscribe to automated dispatch emails of corporate utilization and preventative maintenance logs.</p>
            </div>
          </div>
          <span className="mt-2 sm:mt-0 px-2.5 py-0.5 bg-[#E1F5F4] text-[#00A09D] font-bold text-[10px] rounded-full border border-[#00A09D]/10 flex items-center gap-1">
            <BellRing className="w-3 h-3" />
            <span>Active Cron Dispatcher</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscribe Form */}
          <div className="lg:col-span-2 bg-[#F4F5FA]/50 border border-[#E5E4EA]/55 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Configure Automated Dispatch</h4>
            
            {justSubscribed && (
              <div className="p-3.5 bg-[#E1F5F4] border border-[#00A09D]/20 rounded-lg flex items-center space-x-2.5 text-xs text-[#00A09D] font-bold animate-slideIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>Success Ji! Subscription scheduled. A weekly alert has been registered.</span>
              </div>
            )}

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6675] uppercase mb-1.5">Recipient Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. employee@assetflow.corp"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6675] uppercase mb-1.5">Weekly Delivery Day</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] transition-all"
                    >
                      <option value="Monday">Every Monday (09:00 AM IST)</option>
                      <option value="Wednesday">Every Wednesday (09:00 AM IST)</option>
                      <option value="Friday">Every Friday (05:00 PM IST)</option>
                      <option value="Saturday">Every Saturday (10:00 AM IST)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B6675] uppercase mb-1.5">Report Package Scope</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] transition-all"
                >
                  <option value="Both (Utilization & Maintenance)">Both (Utilization trends & preventative maintenance logs)</option>
                  <option value="Asset Utilization Trend Only">Asset Utilization and department density charts only</option>
                  <option value="Preventative Maintenance Logs Only">Maintenance frequency and audit cycles logs only</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <span>Schedule Weekly Subscription</span>
                </button>
              </div>
            </form>
          </div>

          {/* Subscriptions List */}
          <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Active Subscriptions ({subscriptions.length})</h4>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-[#6B6675]/60">No active reports scheduled.</p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="p-3 bg-[#F4F5FA] border border-[#E5E4EA]/45 rounded-lg text-xs space-y-1.5 relative group">
                    <button
                      onClick={() => handleUnsubscribe(sub.id)}
                      className="absolute right-2 top-2 p-1 text-[#6B6675] hover:text-[#C5432D] hover:bg-[#FBEAE6] rounded transition-all cursor-pointer"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="font-bold text-gray-950 truncate pr-6">{sub.email}</div>
                    <div className="text-[10px] text-[#6B6675] font-semibold flex items-center space-x-1">
                      <span>Delivered:</span>
                      <span className="text-[#714B67]">{sub.day} at 09:00 AM IST</span>
                    </div>
                    <div className="text-[9px] bg-white px-2 py-0.5 rounded border border-[#E5E4EA]/60 inline-block font-medium truncate max-w-full">
                      {sub.reportType}
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
