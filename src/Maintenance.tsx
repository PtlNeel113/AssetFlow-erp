import React, { useState, useEffect } from "react";
import { Employee, Asset, MaintenanceRequest, AssetStatus } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  Wrench, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Clock, 
  User, 
  AlertTriangle,
  Flame,
  UserCheck
} from "lucide-react";

interface MaintenanceProps {
  currentUser: Employee;
}

type StageType = "Pending" | "Approved" | "Technician Assigned" | "In Progress" | "Resolved";

export default function Maintenance({ currentUser }: MaintenanceProps) {
  const [maintenances, setMaintenances] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Raise Request Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formAssetId, setFormAssetId] = useState("");
  const [formIssue, setFormIssue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");

  useEffect(() => {
    setMaintenances(AssetFlowStore.getMaintenance());
    setAssets(AssetFlowStore.getAssets());
  }, []);

  const syncList = () => {
    setMaintenances(AssetFlowStore.getMaintenance());
  };

  const handleRaiseRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAssetId || !formIssue) return;

    const assetObj = assets.find(a => a.id === formAssetId);
    if (!assetObj) return;

    const isAutoApproved = currentUser.role === "Admin" || currentUser.role === "Department Head" || currentUser.role === "Asset Manager";

    const newReq: MaintenanceRequest = {
      id: "mnt-" + Date.now(),
      assetId: formAssetId,
      assetTag: assetObj.tag,
      assetName: assetObj.name,
      issueSummary: formIssue,
      description: formDescription,
      priority: formPriority,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      stage: isAutoApproved ? "Approved" : "Pending",
      createdDate: new Date().toISOString().split("T")[0]
    };

    // Update asset status to Maintenance
    const updatedAssets = AssetFlowStore.getAssets().map(a => {
      if (a.id === formAssetId) {
        return {
          ...a,
          status: AssetStatus.UNDER_MAINTENANCE,
          maintenanceHistory: [
            {
              id: "mth-" + Date.now(),
              issue: formIssue,
              date: new Date().toISOString().split("T")[0],
              status: isAutoApproved ? "Approved" : "Pending Approval"
            },
            ...a.maintenanceHistory
          ]
        };
      }
      return a;
    });
    AssetFlowStore.saveAssets(updatedAssets);

    const updatedMnt = [...maintenances, newReq];
    AssetFlowStore.saveMaintenance(updatedMnt);
    setMaintenances(updatedMnt);

    AssetFlowStore.addActivityLog(currentUser.name, `Raised Maintenance request for ${assetObj.tag}`, "Maintenance");
    AssetFlowStore.addNotification(
      isAutoApproved ? "Maintenance Request Approved" : "Maintenance Request Filed",
      isAutoApproved 
        ? `Ticket raised for ${assetObj.tag} (${assetObj.name}) and auto-approved because you are an Admin/Manager.`
        : `Ticket filed for ${assetObj.tag} (${assetObj.name}): '${formIssue}'. Status: Pending approval.`,
      isAutoApproved ? "success" : "warning"
    );

    // Reset Form
    setIsModalOpen(false);
    setFormAssetId("");
    setFormIssue("");
    setFormDescription("");
    setFormPriority("Medium");
  };

  // Move ticket stage
  const handleMoveStage = (id: string, currentStage: StageType, direction: "next" | "prev") => {
    const stages: StageType[] = ["Pending", "Approved", "Technician Assigned", "In Progress", "Resolved"];
    const currentIdx = stages.indexOf(currentStage);
    let nextIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;

    if (nextIdx < 0 || nextIdx >= stages.length) return;
    const targetStage = stages[nextIdx];

    const updated = maintenances.map((m) => {
      if (m.id === id) {
        // Log action
        AssetFlowStore.addActivityLog(
          currentUser.name,
          `Promoted maintenance request ${m.assetTag} to ${targetStage}`,
          "Maintenance"
        );

        let patch: Partial<MaintenanceRequest> = { stage: targetStage };
        if (targetStage === "Technician Assigned" && !m.assignedTechnician) {
          patch.assignedTechnician = currentUser.name; // Assign to current manager/user for demo realism
        }

        return { ...m, ...patch };
      }
      return m;
    });

    AssetFlowStore.saveMaintenance(updated);
    setMaintenances(updated);

    // If fully Resolved, check asset back to Available
    if (targetStage === "Resolved") {
      const ticket = maintenances.find(m => m.id === id);
      if (ticket) {
        const updatedAssets = AssetFlowStore.getAssets().map(a => {
          if (a.id === ticket.assetId) {
            return {
              ...a,
              status: AssetStatus.AVAILABLE,
              maintenanceHistory: a.maintenanceHistory.map(mh => 
                mh.issue === ticket.issueSummary ? { ...mh, status: "Resolved" } : mh
              )
            };
          }
          return a;
        });
        AssetFlowStore.saveAssets(updatedAssets);
        AssetFlowStore.addNotification(
          "Maintenance Resolved",
          `Repair completed for ${ticket.assetTag} (${ticket.assetName}). Asset set back to Available state.`,
          "success"
        );
      }
    }
  };

  // Filter lists per stage
  const getCardsByStage = (stage: StageType) => {
    return maintenances.filter((m) => m.stage === stage);
  };

  // Render priority pill
  const renderPriorityBadge = (priority: string) => {
    let style = "bg-[#E7F1FA] text-[#3B82C4]";
    if (priority === "Low") style = "bg-gray-100 text-gray-600";
    if (priority === "Medium") style = "bg-[#E1F5F4] text-[#00A09D]";
    if (priority === "High") style = "bg-[#FBEEDF] text-[#D9822B]";
    if (priority === "Urgent") style = "bg-[#FBEAE6] text-[#C5432D] animate-pulse";

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${style}`}>
        {priority === "Urgent" && <Flame className="w-3 h-3 mr-0.5" />}
        {priority} Priority
      </span>
    );
  };

  const columns: { stage: StageType; title: string; color: string }[] = [
    { stage: "Pending", title: "1. Pending Review", color: "border-t-4 border-gray-400 bg-gray-50/50" },
    { stage: "Approved", title: "2. Approved", color: "border-t-4 border-[#3B82C4] bg-sky-50/20" },
    { stage: "Technician Assigned", title: "3. Scheduled", color: "border-t-4 border-[#D89614] bg-amber-50/10" },
    { stage: "In Progress", title: "4. In Progress", color: "border-t-4 border-[#D9822B] bg-[#FBEEDF]/10" },
    { stage: "Resolved", title: "5. Resolved Check", color: "border-t-4 border-[#00A09D] bg-teal-50/20" }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Maintenance Pipelines</h2>
          <p className="text-xs text-[#6B6675] mt-1">Raise support tickets, approve technician schedules, and monitor physical repair workflows in real-time.</p>
        </div>
        <button
          id="btn-raise-request"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#D9822B] hover:bg-[#D9822B]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Raise request</span>
        </button>
      </div>

      {/* Visual Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const cards = getCardsByStage(col.stage);
          return (
            <div key={col.stage} className={`flex flex-col bg-white border border-[#E5E4EA] rounded-xl p-3 min-w-[220px] shadow-sm ${col.color}`}>
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E4EA] mb-3">
                <h3 className="text-xs font-bold text-gray-900 truncate">{col.title}</h3>
                <span className="text-[10px] bg-gray-100 text-[#6B6675] font-bold px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Kanban Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] min-h-[250px]">
                {cards.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-gray-300 italic">No tickets in stage</div>
                ) : (
                  cards.map((req) => (
                    <div key={req.id} className="bg-white border border-[#E5E4EA] rounded-lg p-3 hover:shadow-sm transition-shadow space-y-2.5 relative">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-mono font-bold bg-[#F1E9EE] text-[#714B67] px-1.5 py-0.5 rounded">
                            {req.assetTag}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]">{req.assetName}</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{req.issueSummary}</h4>
                      </div>

                      <div className="flex flex-wrap gap-1.5 justify-between items-center pt-2 border-t border-[#E5E4EA]/50 text-[10px] text-[#6B6675]">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[80px]">{req.requesterName}</span>
                        </div>
                        {renderPriorityBadge(req.priority)}
                      </div>

                      {req.assignedTechnician && (
                        <div className="p-1.5 bg-[#E7F1FA] border border-[#3B82C4]/10 rounded flex items-center space-x-1 text-[10px] text-[#3B82C4] font-semibold">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Tech: {req.assignedTechnician}</span>
                        </div>
                      )}

                      {/* Direction Advancement Arrows - Bypassed for Employees */}
                      {(currentUser.role === "Admin" || currentUser.role === "Department Head" || currentUser.role === "Asset Manager") ? (
                        <div className="flex justify-between items-center pt-1.5 border-t border-[#E5E4EA]/40">
                          <button
                            id={`prev-stage-${req.id}`}
                            disabled={col.stage === "Pending"}
                            onClick={() => handleMoveStage(req.id, col.stage, "prev")}
                            className={`p-1 bg-gray-50 border border-[#E5E4EA] rounded hover:bg-gray-100 cursor-pointer ${
                              col.stage === "Pending" ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                            title="Move Back"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 text-[#6B6675]" />
                          </button>
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Move Stage</span>
                          <button
                            id={`next-stage-${req.id}`}
                            disabled={col.stage === "Resolved"}
                            onClick={() => handleMoveStage(req.id, col.stage, "next")}
                            className={`p-1 bg-[#F1E9EE] border border-[#714B67]/20 rounded hover:bg-[#714B67]/10 cursor-pointer ${
                              col.stage === "Resolved" ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                            title="Advance Workflow"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-[#714B67]" />
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1.5 border-t border-[#E5E4EA]/40 text-center">
                          <span className="text-[9px] text-gray-400 uppercase font-bold">Standard Review Mode</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: RAISE MAINTENANCE REQUEST */}
      {isModalOpen && (
        <div id="maintenance-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#D9822B] px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Raise Maintenance Request</h3>
                <p className="text-[10px] text-[#FBEEDF] mt-0.5">AssetFlow locks assets in repair status until technician resolution.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRaiseRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Select Broken Asset</label>
                <select
                  required
                  id="maint-asset-select"
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.filter(a => a.status !== AssetStatus.RETIRED_DISPOSED).map(a => (
                    <option key={a.id} value={a.id}>{a.tag} — {a.name} ({a.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Issue Summary</label>
                <input
                  type="text"
                  required
                  id="maint-issue-input"
                  placeholder="e.g. Device screen flickering or dead keys"
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  id="maint-desc-input"
                  placeholder="Detail symptoms, error screens, and steps leading to the physical hardware failure..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Urgency / Priority Level</label>
                <select
                  id="maint-priority-select"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                >
                  <option value="Low">Low (Backlog repair)</option>
                  <option value="Medium">Medium (Affects single employee)</option>
                  <option value="High">High (Urgent repair needed)</option>
                  <option value="Urgent">Urgent (Operation blocking downtime)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-maintenance"
                  className="px-4 py-2 bg-[#D9822B] hover:bg-[#D9822B]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Raise request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
