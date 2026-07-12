import React, { useState, useEffect } from "react";
import { Employee, Asset, AuditCycle, AuditLine, AssetStatus } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  ClipboardCheck, 
  Plus, 
  User, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertOctagon, 
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Lock,
  LockOpen,
  Info
} from "lucide-react";

interface AssetAuditProps {
  currentUser: Employee;
}

export default function AssetAudit({ currentUser }: AssetAuditProps) {
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [lines, setLines] = useState<AuditLine[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Selected Active Cycle for checkoff
  const [selectedCycleId, setSelectedCycleId] = useState("");

  // Create Cycle Modal Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");
  const [newScopeDept, setNewScopeDept] = useState("Engineering & IT");
  const [newScopeLoc, setNewScopeLoc] = useState("HQ Room 302");
  const [newAuditors, setNewAuditors] = useState("");

  // Lock Confirmation State
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  useEffect(() => {
    setCycles(AssetFlowStore.getAudits());
    setLines(AssetFlowStore.getAuditLines());
    setAssets(AssetFlowStore.getAssets());

    const activeCycles = AssetFlowStore.getAudits();
    if (activeCycles.length > 0) {
      setSelectedCycleId(activeCycles[0].id);
    }
  }, []);

  const syncList = () => {
    setCycles(AssetFlowStore.getAudits());
    setLines(AssetFlowStore.getAuditLines());
  };

  // Create audit cycle and seed audit checklist lines
  const handleCreateAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleName) return;

    const cycleId = "aud-" + Date.now();
    const newCycle: AuditCycle = {
      id: cycleId,
      name: newCycleName,
      scopeDepartment: newScopeDept,
      scopeLocation: newScopeLoc,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days out
      assignedAuditors: newAuditors ? newAuditors.split(",").map(s => s.trim()) : ["Robert Fox"],
      status: "In Progress"
    };

    // Seed audit lines based on all current assets in that location/department
    const currentAssets = AssetFlowStore.getAssets();
    const seededLines: AuditLine[] = currentAssets
      .filter(a => a.status !== AssetStatus.RETIRED_DISPOSED)
      .map(a => ({
        id: "audl-" + Math.random().toString(36).substr(2, 9),
        auditCycleId: cycleId,
        assetId: a.id,
        assetTag: a.tag,
        assetName: a.name,
        location: a.location,
        holderName: a.holderName,
        status: "Pending" as const
      }));

    const updatedCycles = [newCycle, ...cycles];
    AssetFlowStore.saveAudits(updatedCycles);
    setCycles(updatedCycles);

    const updatedLines = [...seededLines, ...lines];
    AssetFlowStore.saveAuditLines(updatedLines);
    setLines(updatedLines);

    setSelectedCycleId(cycleId);
    setIsCreateModalOpen(false);

    // Reset Form
    setNewCycleName("");
    setNewScopeDept("Engineering & IT");
    setNewScopeLoc("HQ Room 302");
    setNewAuditors("");

    AssetFlowStore.addActivityLog(currentUser.name, `Created Audit Cycle: ${newCycleName}`, "Audit");
    AssetFlowStore.addNotification(
      "Audit Cycle Initiated",
      `The audit cycle '${newCycleName}' has been launched. Seeding verification list...`,
      "success"
    );
  };

  // Inspect checklist items of selected cycle
  const activeCycle = cycles.find(c => c.id === selectedCycleId);
  const activeLines = lines.filter(l => l.auditCycleId === selectedCycleId);

  // Quick Action: Change status of asset checkoff (Verified/Missing/Damaged)
  const handleLineCheckoff = (lineId: string, itemStatus: "Verified" | "Missing" | "Damaged") => {
    if (activeCycle?.status === "Closed") return; // locked

    const updatedLines = lines.map(line => {
      if (line.id === lineId) {
        // Also dynamically trigger core inventory status sync on the fly!
        const assetTarget = assets.find(a => a.id === line.assetId);
        if (assetTarget) {
          let coreStatus = assetTarget.status;
          let coreCondition = assetTarget.condition;

          if (itemStatus === "Missing") {
            coreStatus = AssetStatus.LOST;
          } else if (itemStatus === "Damaged") {
            coreCondition = "Poor";
          }

          const updatedAssets = AssetFlowStore.getAssets().map(a => {
            if (a.id === line.assetId) {
              return { ...a, status: coreStatus, condition: coreCondition };
            }
            return a;
          });
          AssetFlowStore.saveAssets(updatedAssets);
        }

        return {
          ...line,
          status: itemStatus,
          auditedDate: new Date().toISOString().split("T")[0],
          notes: itemStatus === "Verified" ? "Verified physically in storage/hand" : `Marked ${itemStatus} during ${activeCycle?.name}`
        };
      }
      return line;
    });

    AssetFlowStore.saveAuditLines(updatedLines);
    setLines(updatedLines);
    setAssets(AssetFlowStore.getAssets()); // re-sync assets state
  };

  // Closing / Locking Cycle
  const handleLockCycle = () => {
    if (!selectedCycleId) return;

    const updatedCycles = cycles.map(c => {
      if (c.id === selectedCycleId) {
        return { ...c, status: "Closed" as const };
      }
      return c;
    });

    AssetFlowStore.saveAudits(updatedCycles);
    setCycles(updatedCycles);
    setIsLockModalOpen(false);

    AssetFlowStore.addActivityLog(currentUser.name, `Locked Audit Cycle: ${activeCycle?.name}`, "Audit");
    AssetFlowStore.addNotification(
      "Audit Cycle Closed",
      `Cycle '${activeCycle?.name}' has been locked. Final discrepancy records filed in archive.`,
      "info"
    );
  };

  // Computes discrepancy records (Missing / Damaged only)
  const discrepancyReport = activeLines.filter(l => l.status === "Missing" || l.status === "Damaged");

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Enterprise Asset Audits</h2>
          <p className="text-xs text-[#6B6675] mt-1">Configure cyclical inventory reviews, audit active custodians, and file lock-proof compliance registers.</p>
        </div>
        {currentUser.role !== "Employee" && (
          <button
            id="btn-create-audit"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create audit cycle</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cycles list Selector */}
        <div className="lg:col-span-1 bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4 h-fit">
          <div className="pb-3 border-b border-[#E5E4EA]">
            <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Audit Cycles Archive</h3>
            <p className="text-[11px] text-[#6B6675] mt-0.5">Select a cycle to launch checking checklists.</p>
          </div>

          <div className="space-y-3">
            {cycles.map((cy) => (
              <div
                key={cy.id}
                onClick={() => setSelectedCycleId(cy.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedCycleId === cy.id
                    ? "bg-[#F1E9EE] border-[#714B67]/30 text-[#714B67]"
                    : "bg-white border-[#E5E4EA] hover:bg-[#F4F5FA]/40"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    cy.status === "In Progress" ? "bg-[#FCF1DA] text-[#D89614]" : "bg-gray-100 text-gray-500"
                  }`}>
                    {cy.status === "Closed" ? <Lock className="w-2.5 h-2.5 mr-1" /> : <LockOpen className="w-2.5 h-2.5 mr-1" />}
                    {cy.status}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {cy.startDate}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 leading-snug">{cy.name}</h4>
                <p className="text-[10px] text-[#6B6675] font-medium mt-1">Scope: {cy.scopeDepartment} ({cy.scopeLocation})</p>
                
                <div className="flex items-center space-x-1.5 mt-3 text-[10px] text-[#6B6675] border-t border-[#E5E4EA]/50 pt-2">
                  <Users className="w-3.5 h-3.5 text-[#714B67]" />
                  <span>Auditors: {cy.assignedAuditors.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Checklists & Auto-Generated Discrepancy Reports */}
        <div className="lg:col-span-2 space-y-6">
          {activeCycle ? (
            <>
              {/* Checklist verification table */}
              <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
                <div className="pb-3 border-b border-[#E5E4EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">{activeCycle.name} — Hardware Checklist</h3>
                    <p className="text-[11px] text-[#6B6675] mt-0.5">Physically review assets. Mark corresponding state keys.</p>
                  </div>
                  {activeCycle.status === "In Progress" ? (
                    currentUser.role !== "Employee" ? (
                      <button
                        id="btn-close-audit-cycle"
                        onClick={() => setIsLockModalOpen(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-[#C5432D] hover:bg-[#C5432D]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Close audit cycle</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#D89614] bg-[#FCF1DA] px-2.5 py-1 rounded-md font-bold">
                        Cycle Active
                      </span>
                    )
                  ) : (
                    <div className="p-1.5 bg-gray-100 border border-gray-200 text-[#6B6675] rounded text-[10px] font-bold flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <span>CYCLE LOCKED ARCHIVE</span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" id="audit-checklist-table">
                    <thead>
                      <tr className="border-b border-[#E5E4EA]">
                        <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Asset</th>
                        <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Current Holder</th>
                        <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Location</th>
                        <th className="py-2 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider text-right">Physical Checkoff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                      {activeLines.map((line) => (
                        <tr key={line.id} className="hover:bg-[#F4F5FA]/40 transition-colors">
                          <td className="py-3">
                            <div className="font-mono font-bold text-[#714B67]">{line.assetTag}</div>
                            <div className="font-semibold text-gray-900 mt-0.5">{line.assetName}</div>
                          </td>
                          <td className="py-3 font-medium">{line.holderName || "In storage"}</td>
                          <td className="py-3 font-medium">{line.location}</td>
                          <td className="py-3 text-right">
                            {activeCycle.status === "Closed" ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] ${
                                line.status === "Verified" 
                                  ? "bg-[#E1F5F4] text-[#00A09D]" 
                                  : line.status === "Missing" 
                                  ? "bg-[#FBEAE6] text-[#C5432D]" 
                                  : "bg-[#FBEEDF] text-[#D9822B]"
                              }`}>
                                {line.status}
                              </span>
                            ) : (currentUser.role !== "Employee") ? (
                              <div className="inline-flex space-x-1">
                                <button
                                  id={`audit-verified-${line.id}`}
                                  onClick={() => handleLineCheckoff(line.id, "Verified")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer border ${
                                    line.status === "Verified"
                                      ? "bg-[#E1F5F4] text-[#00A09D] border-[#00A09D]/30"
                                      : "bg-white text-gray-400 border-[#E5E4EA] hover:bg-[#E1F5F4]/30"
                                  }`}
                                >
                                  Verified
                                </button>
                                <button
                                  id={`audit-missing-${line.id}`}
                                  onClick={() => handleLineCheckoff(line.id, "Missing")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer border ${
                                    line.status === "Missing"
                                      ? "bg-[#FBEAE6] text-[#C5432D] border-[#C5432D]/30 animate-pulse"
                                      : "bg-white text-gray-400 border-[#E5E4EA] hover:bg-[#FBEAE6]/30"
                                  }`}
                                >
                                  Missing
                                </button>
                                <button
                                  id={`audit-damaged-${line.id}`}
                                  onClick={() => handleLineCheckoff(line.id, "Damaged")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer border ${
                                    line.status === "Damaged"
                                      ? "bg-[#FBEEDF] text-[#D9822B] border-[#D9822B]/30"
                                      : "bg-white text-gray-400 border-[#E5E4EA] hover:bg-[#FBEEDF]/30"
                                  }`}
                                >
                                  Damaged
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] ${
                                line.status === "Verified" 
                                  ? "bg-[#E1F5F4] text-[#00A09D]" 
                                  : line.status === "Missing" 
                                  ? "bg-[#FBEAE6] text-[#C5432D]" 
                                  : line.status === "Damaged"
                                  ? "bg-[#FBEEDF] text-[#D9822B]"
                                  : "bg-gray-100 text-gray-400"
                              }`}>
                                {line.status || "Pending Review"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live compilation discrepancy reports */}
              <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
                <div className="pb-3 border-b border-[#E5E4EA] flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#C5432D] uppercase tracking-wider">Live Discrepancy compilation</h3>
                    <p className="text-[11px] text-[#6B6675] mt-0.5">Real-time filter identifying flagged physical issues or missing items.</p>
                  </div>
                  <span className="text-[10px] bg-[#FBEAE6] text-[#C5432D] border border-[#C5432D]/10 font-bold px-2.5 py-0.5 rounded-full">
                    {discrepancyReport.length} Flagged Item(s)
                  </span>
                </div>

                {discrepancyReport.length === 0 ? (
                  <div className="p-6 text-center text-[#6B6675]/60 bg-gray-50 rounded-xl border border-[#E5E4EA] text-xs">
                    No discrepancies flagged. Excellent organizational hardware compliance.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#E5E4EA] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse" id="discrepancy-report-table">
                      <thead className="bg-[#FBEAE6]/30 text-[#C5432D]">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Asset Tag</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Asset Name</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Issue Discrepancy</th>
                          <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider">Last Custodian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                        {discrepancyReport.map((line) => (
                          <tr key={line.id} className="hover:bg-[#FBEAE6]/10">
                            <td className="px-4 py-3.5 font-mono font-bold text-[#C5432D]">{line.assetTag}</td>
                            <td className="px-4 py-3.5 font-semibold text-gray-900">{line.assetName}</td>
                            <td className="px-4 py-3.5 font-bold">
                              <span className={`inline-flex items-center space-x-1 text-[10px] ${
                                line.status === "Missing" ? "text-[#C5432D]" : "text-[#D9822B]"
                              }`}>
                                {line.status === "Missing" ? <XCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                <span>{line.status === "Missing" ? "MISSING — SET TO LOST" : "DAMAGED — KEYED FOR REPAIR"}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3.5">{line.holderName || "In Inventory Storage"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 bg-white border border-[#E5E4EA] rounded-xl text-center space-y-4">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">No active audit selected</h4>
                <p className="text-xs text-[#6B6675] mt-1">Select an active cycle on the left or create a new cycle to seed the checklist.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE AUDIT CYCLE */}
      {isCreateModalOpen && (
        <div id="create-audit-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#714B67] px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Schedule Corporate Audit Cycle</h3>
                <p className="text-[10px] text-[#F1E9EE] mt-0.5">Determine scope boundaries and seed checking ledger lines.</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateAudit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Cycle Title</label>
                <input
                  type="text"
                  required
                  id="audit-cycle-name-input"
                  placeholder="e.g. Q3 Operations Logistics Audit"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Scope Department</label>
                <select
                  value={newScopeDept}
                  onChange={(e) => setNewScopeDept(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                >
                  <option value="Engineering & IT">Engineering & IT</option>
                  <option value="Administration">Administration</option>
                  <option value="Design & UX">Design & UX</option>
                  <option value="Operations & Logistics">Operations & Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Scope Location / Node</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HQ Room 302"
                  value={newScopeLoc}
                  onChange={(e) => setNewScopeLoc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Assigned Auditors (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Robert Fox, Alex Wong"
                  value={newAuditors}
                  onChange={(e) => setNewAuditors(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-create-audit"
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Launch Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CLOSING CYCLE */}
      {isLockModalOpen && (
        <div id="lock-confirm-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-sm w-full p-6 space-y-4 shadow-lg animate-scaleIn">
            <div className="w-12 h-12 bg-[#FBEAE6] text-[#C5432D] rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Close Audit Cycle confirmation</h4>
              <p className="text-xs text-[#6B6675] mt-1 leading-relaxed">
                Warning: Closing the cycle <strong>'{activeCycle?.name}'</strong> will permanently freeze checklist nodes and prevent further checkoff alterations. Flagged missing assets will remain permanently set as Lost/Overdue.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E4EA]">
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
              >
                No, cancel
              </button>
              <button
                id="btn-confirm-close-audit"
                onClick={handleLockCycle}
                className="px-4 py-2 bg-[#C5432D] hover:bg-[#C5432D]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Yes, lock cycle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
