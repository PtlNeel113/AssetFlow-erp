import React, { useState, useEffect } from "react";
import { Employee, Asset, AssetStatus, AssetAllocation, TransferRequest, UserRole } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  ArrowRightLeft, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  Check, 
  X, 
  RotateCcw,
  BookOpen,
  Info
} from "lucide-react";

interface AllocationTransferProps {
  currentUser: Employee;
}

export default function AllocationTransfer({ currentUser }: AllocationTransferProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);

  // Allocation Form State
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [allocationNotes, setAllocationNotes] = useState("");

  // Return Flow Modal/State
  const [returningAllocation, setReturningAllocation] = useState<AssetAllocation | null>(null);
  const [returnCondition, setReturnCondition] = useState<"New" | "Good" | "Fair" | "Poor">("Good");
  const [returnNotes, setReturnNotes] = useState("");

  useEffect(() => {
    syncLists();
  }, []);

  const syncLists = () => {
    setAssets(AssetFlowStore.getAssets());
    setEmployees(AssetFlowStore.getEmployees());
    setAllocations(AssetFlowStore.getAllocations());
    setTransfers(AssetFlowStore.getTransfers());
  };

  // Inspect chosen asset for conflict warning
  const chosenAsset = assets.find(a => a.id === selectedAssetId);
  const isChosenAssetAllocated = chosenAsset?.status === AssetStatus.ALLOCATED;
  const currentCustodianName = chosenAsset?.holderName || "another employee";

  // Trigger Allocation
  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedEmployeeId || !expectedReturnDate) return;

    if (isChosenAssetAllocated) {
      // Safeguard block
      return;
    }

    const assetObj = assets.find(a => a.id === selectedAssetId);
    const employeeObj = employees.find(e => e.id === selectedEmployeeId);

    if (!assetObj || !employeeObj) return;

    // Create Allocation
    const newAlloc: AssetAllocation = {
      id: "al-" + Date.now(),
      assetId: selectedAssetId,
      assetTag: assetObj.tag,
      assetName: assetObj.name,
      employeeId: selectedEmployeeId,
      employeeName: employeeObj.name,
      departmentId: employeeObj.departmentId,
      allocationDate: new Date().toISOString().split("T")[0],
      expectedReturnDate,
      status: "Active",
      notes: allocationNotes
    };

    // Update Asset Status in storage
    const updatedAssets = assets.map(a => {
      if (a.id === selectedAssetId) {
        return {
          ...a,
          status: AssetStatus.ALLOCATED,
          holderId: selectedEmployeeId,
          holderName: employeeObj.name,
          allocationHistory: [
            {
              id: "alh-" + Date.now(),
              employeeName: employeeObj.name,
              action: "Allocated",
              date: new Date().toISOString().split("T")[0],
              notes: allocationNotes
            },
            ...a.allocationHistory
          ]
        };
      }
      return a;
    });

    AssetFlowStore.saveAssets(updatedAssets);
    const updatedAllocations = [newAlloc, ...allocations];
    AssetFlowStore.saveAllocations(updatedAllocations);

    // Logging
    AssetFlowStore.addActivityLog(currentUser.name, `Allocated asset ${assetObj.tag} to ${employeeObj.name}`, "Allocation");
    AssetFlowStore.addNotification(
      "Asset Allocated",
      `Asset ${assetObj.tag} successfully allocated to ${employeeObj.name} until ${expectedReturnDate}.`,
      "success"
    );

    // Reset Form
    setSelectedAssetId("");
    setSelectedEmployeeId("");
    setExpectedReturnDate("");
    setAllocationNotes("");
    syncLists();
  };

  // Trigger Transfer Request
  const handleRequestTransfer = () => {
    if (!selectedAssetId || !selectedEmployeeId) return;

    const assetObj = assets.find(a => a.id === selectedAssetId);
    const employeeObj = employees.find(e => e.id === selectedEmployeeId);

    if (!assetObj || !employeeObj) return;

    const newTransfer: TransferRequest = {
      id: "tr-" + Date.now(),
      assetId: selectedAssetId,
      assetTag: assetObj.tag,
      assetName: assetObj.name,
      fromEmployeeId: assetObj.holderId || "emp-2",
      fromEmployeeName: assetObj.holderName || "Priya Sharma",
      toEmployeeId: selectedEmployeeId,
      toEmployeeName: employeeObj.name,
      requestDate: new Date().toISOString().split("T")[0],
      status: "Requested"
    };

    const updatedTransfers = [newTransfer, ...transfers];
    AssetFlowStore.saveTransfers(updatedTransfers);

    AssetFlowStore.addActivityLog(currentUser.name, `Requested transfer of ${assetObj.tag} to ${employeeObj.name}`, "Transfer");
    AssetFlowStore.addNotification(
      "Transfer Requested",
      `A transfer of asset ${assetObj.tag} from ${newTransfer.fromEmployeeName} to ${newTransfer.toEmployeeName} was requested.`,
      "info"
    );

    // Reset form
    setSelectedAssetId("");
    setSelectedEmployeeId("");
    setExpectedReturnDate("");
    setAllocationNotes("");
    syncLists();
  };

  // Transfer actions (Approve/Reject)
  const handleTransferDecision = (transferId: string, action: "Approved" | "Rejected") => {
    const trObj = transfers.find(t => t.id === transferId);
    if (!trObj) return;

    const updatedTransfers = transfers.map(t => {
      if (t.id === transferId) {
        return { ...t, status: action === "Approved" ? ("Approved" as const) : ("Rejected" as const) };
      }
      return t;
    });
    AssetFlowStore.saveTransfers(updatedTransfers);

    if (action === "Approved") {
      // Execute the actual re-allocation of asset
      const updatedAssets = assets.map(a => {
        if (a.id === trObj.assetId) {
          return {
            ...a,
            status: AssetStatus.ALLOCATED,
            holderId: trObj.toEmployeeId,
            holderName: trObj.toEmployeeName,
            allocationHistory: [
              {
                id: "alh-" + Date.now(),
                employeeName: trObj.toEmployeeName,
                action: "Transferred",
                date: new Date().toISOString().split("T")[0],
                notes: `Transferred from ${trObj.fromEmployeeName} via Manager approval`
              },
              ...a.allocationHistory
            ]
          };
        }
        return a;
      });
      AssetFlowStore.saveAssets(updatedAssets);

      // Close the old allocation and create a new one
      const updatedAllocs = allocations.map(al => {
        if (al.assetId === trObj.assetId && al.status === "Active") {
          return { ...al, status: "Returned" as const, actualReturnDate: new Date().toISOString().split("T")[0] };
        }
        return al;
      });

      const newAlloc: AssetAllocation = {
        id: "al-" + Date.now(),
        assetId: trObj.assetId,
        assetTag: trObj.assetTag,
        assetName: trObj.assetName,
        employeeId: trObj.toEmployeeId,
        employeeName: trObj.toEmployeeName,
        allocationDate: new Date().toISOString().split("T")[0],
        expectedReturnDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default 1 yr
        status: "Active"
      };

      AssetFlowStore.saveAllocations([newAlloc, ...updatedAllocs]);
      AssetFlowStore.addActivityLog(currentUser.name, `Approved transfer for ${trObj.assetTag} to ${trObj.toEmployeeName}`, "Transfer");
      AssetFlowStore.addNotification(
        "Transfer Approved",
        `Transfer approved. Asset ${trObj.assetTag} has been re-allocated to ${trObj.toEmployeeName}.`,
        "success"
      );
    } else {
      AssetFlowStore.addActivityLog(currentUser.name, `Rejected transfer for ${trObj.assetTag}`, "Transfer");
      AssetFlowStore.addNotification(
        "Transfer Rejected",
        `Transfer request for ${trObj.assetTag} was rejected.`,
        "danger"
      );
    }

    syncLists();
  };

  // Process Return check-in
  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAllocation) return;

    const allocId = returningAllocation.id;

    // Update allocation to Returned
    const updatedAllocs = allocations.map(al => {
      if (al.id === allocId) {
        return {
          ...al,
          status: "Returned" as const,
          actualReturnDate: new Date().toISOString().split("T")[0],
          conditionCheckIn: returnCondition,
          notes: al.notes + ` | Returned condition: ${returnCondition}. Check-in note: ${returnNotes}`
        };
      }
      return al;
    });
    AssetFlowStore.saveAllocations(updatedAllocs);

    // Update Asset Status to Available and record history
    const updatedAssets = assets.map(a => {
      if (a.id === returningAllocation.assetId) {
        return {
          ...a,
          status: AssetStatus.AVAILABLE,
          holderId: undefined,
          holderName: undefined,
          condition: returnCondition,
          allocationHistory: [
            {
              id: "alh-" + Date.now(),
              employeeName: returningAllocation.employeeName,
              action: "Returned",
              date: new Date().toISOString().split("T")[0],
              notes: `Returned under condition '${returnCondition}'. Notes: ${returnNotes}`
            },
            ...a.allocationHistory
          ]
        };
      }
      return a;
    });
    AssetFlowStore.saveAssets(updatedAssets);

    AssetFlowStore.addActivityLog(currentUser.name, `Returned asset ${returningAllocation.assetTag} from ${returningAllocation.employeeName}`, "Allocation");
    AssetFlowStore.addNotification(
      "Asset Checked In",
      `Asset ${returningAllocation.assetTag} successfully returned under condition '${returnCondition}'.`,
      "success"
    );

    setReturningAllocation(null);
    setReturnNotes("");
    syncLists();
  };

  const isManagerOrHead = currentUser.role === UserRole.ADMIN || 
                         currentUser.role === UserRole.ASSET_MANAGER || 
                         currentUser.role === UserRole.DEPARTMENT_HEAD;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Allocation & Transfers</h2>
        <p className="text-xs text-[#6B6675] mt-1">Deploy company hardware, secure transfer approval cycles, and document checking-in notes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Left: Allocate Form */}
        <div className="lg:col-span-1 bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4 shadow-sm h-fit">
          <div className="pb-3 border-b border-[#E5E4EA]">
            <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Deploy Asset Allocation</h3>
            <p className="text-[11px] text-[#6B6675] mt-0.5">Assign physical hardware custody to a verified employee.</p>
          </div>

          <form onSubmit={handleAllocate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6B6675] uppercase mb-1">Select Asset</label>
              <select
                required
                id="alloc-asset-select"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
              >
                <option value="">-- Choose Asset --</option>
                {assets.filter(a => a.status !== AssetStatus.RETIRED_DISPOSED).map(a => (
                  <option key={a.id} value={a.id}>{a.tag} — {a.name} ({a.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B6675] uppercase mb-1">Select Employee Recipient</label>
              <select
                required
                id="alloc-employee-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.departmentName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B6675] uppercase mb-1">Expected Return Date</label>
              <input
                type="date"
                required
                id="alloc-return-date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B6675] uppercase mb-1">Check-out Notes</label>
              <textarea
                rows={2}
                placeholder="Initial allocation notes..."
                value={allocationNotes}
                onChange={(e) => setAllocationNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
              />
            </div>

            {/* CONFLICT ENCOUNTER ALERT */}
            {isChosenAssetAllocated ? (
              <div id="alloc-conflict-block" className="p-3.5 bg-[#FBEAE6] border border-[#C5432D]/15 rounded-lg space-y-2.5">
                <div className="flex items-start space-x-2 text-[#C5432D]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold leading-tight">Double-Allocation Guard</h5>
                    <p className="text-[10px] text-[#6B6675] mt-1">Currently held by <strong>{currentCustodianName}</strong>. Standard allocation is blocked to prevent scheduling collisions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-request-transfer"
                  onClick={handleRequestTransfer}
                  className="w-full py-1.5 bg-[#C5432D] hover:bg-[#C5432D]/90 text-white font-semibold text-[11px] rounded-md cursor-pointer transition-all flex items-center justify-center space-x-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Request Transfer</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                id="btn-confirm-allocation"
                className="w-full py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all"
              >
                Allocate asset
              </button>
            )}
          </form>
        </div>

        {/* Column Right: Transit Requests (Approvals) & Deploy History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Transfers Approvals */}
          <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="pb-3 border-b border-[#E5E4EA]">
              <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Active Custody Transfer Approvals</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Asset manager review board for cross-employee custody movements.</p>
            </div>

            <div className="space-y-3">
              {transfers.length === 0 ? (
                <p className="text-center py-6 text-xs text-[#6B6675]/50">No active custody transfer requests in the pipeline.</p>
              ) : (
                transfers.map((tr) => (
                  <div key={tr.id} className="p-3.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] bg-[#714B67] text-white font-mono font-bold px-1.5 py-0.5 rounded">
                          {tr.assetTag}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900">{tr.assetName}</h4>
                      </div>
                      <p className="text-[11px] text-[#6B6675] font-semibold">
                        Transfer custody from <strong>{tr.fromEmployeeName}</strong> to <strong>{tr.toEmployeeName}</strong>
                      </p>
                      <span className="block text-[10px] text-gray-400">Requested date: {tr.requestDate}</span>
                    </div>

                    <div className="flex items-center space-x-2.5 sm:shrink-0">
                      {tr.status === "Requested" ? (
                        isManagerOrHead ? (
                          <>
                            <button
                              id={`approve-transfer-${tr.id}`}
                              onClick={() => handleTransferDecision(tr.id, "Approved")}
                              className="px-2.5 py-1.5 bg-[#00A09D] hover:bg-[#00A09D]/90 text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              id={`reject-transfer-${tr.id}`}
                              onClick={() => handleTransferDecision(tr.id, "Rejected")}
                              className="px-2.5 py-1.5 bg-white border border-[#C5432D] text-[#C5432D] hover:bg-[#FBEAE6] text-[11px] font-bold rounded-lg cursor-pointer flex items-center space-x-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
                            Pending Manager Approval
                          </span>
                        )
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tr.status === "Approved" ? "bg-[#E1F5F4] text-[#00A09D]" : "bg-[#FBEAE6] text-[#C5432D]"
                        }`}>
                          {tr.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Deployments Table */}
          <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="pb-3 border-b border-[#E5E4EA]">
              <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Active Custody Deployments</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Physical items currently deployed in active production environments.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="active-deployments-table">
                <thead>
                  <tr className="border-b border-[#E5E4EA]">
                    <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Asset</th>
                    <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Custodian</th>
                    <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Due Date</th>
                    <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Status</th>
                    <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                  {allocations.filter(al => al.status === "Active" || al.status === "Overdue").map((al) => (
                    <tr key={al.id} className="hover:bg-[#F4F5FA]/40 transition-colors">
                      <td className="py-3.5">
                        <div className="font-mono font-bold text-[#714B67]">{al.assetTag}</div>
                        <div className="font-medium text-gray-900 mt-0.5">{al.assetName}</div>
                      </td>
                      <td className="py-3.5 font-medium">{al.employeeName}</td>
                      <td className="py-3.5 font-mono">{al.expectedReturnDate}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          al.status === "Overdue" ? "bg-[#FBEAE6] text-[#C5432D]" : "bg-[#E7F1FA] text-[#3B82C4]"
                        }`}>
                          {al.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          id={`mark-returned-${al.id}`}
                          onClick={() => setReturningAllocation(al)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-[#00A09D]/25 text-[#00A09D] hover:bg-[#E1F5F4] text-xs font-semibold rounded-lg cursor-pointer transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Mark returned</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: RETURN FORM CHECK-IN */}
      {returningAllocation && (
        <div id="return-checkin-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#00A09D] px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Asset Return Check-in</h3>
                <p className="text-[10px] text-[#E1F5F4] mt-0.5">AssetFlow locks hardware condition changes into ledger histories.</p>
              </div>
              <button onClick={() => setReturningAllocation(null)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleProcessReturn} className="p-6 space-y-4">
              <div className="p-3 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg space-y-1">
                <span className="text-[10px] text-gray-400 font-mono font-bold block">{returningAllocation.assetTag}</span>
                <h4 className="text-xs font-bold text-gray-900">{returningAllocation.assetName}</h4>
                <p className="text-[10px] text-[#6B6675]">Currently returned by: {returningAllocation.employeeName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Incoming Condition Check-in</label>
                <select
                  id="return-condition-select"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                >
                  <option value="New">New (Unopened/Pristine)</option>
                  <option value="Good">Good (Minor cosmetics only)</option>
                  <option value="Fair">Fair (Scratches/Normal wear)</option>
                  <option value="Poor">Poor (Damaged components)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Custodian Check-in Notes</label>
                <textarea
                  id="return-notes-area"
                  required
                  rows={3}
                  placeholder="Review accessories, screen scratch conditions, and power cable returns..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReturningAllocation(null)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-return"
                  className="px-4 py-2 bg-[#00A09D] hover:bg-[#00A09D]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Process check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
