import React, { useState, useEffect } from "react";
import { Employee, UserRole, Department, AssetCategory } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  Building2, 
  FolderTree, 
  Users, 
  Plus, 
  ShieldCheck, 
  ShieldAlert,
  ArrowRight,
  Info
} from "lucide-react";

interface OrgSetupProps {
  currentUser: Employee;
  onSwitchUser: (emp: Employee) => void;
}

type ActiveTab = "departments" | "categories" | "employees";

export default function OrgSetup({ currentUser, onSwitchUser }: OrgSetupProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Modal controls
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // New Department Form State
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHeadId, setNewDeptHeadId] = useState("");
  const [newDeptParentId, setNewDeptParentId] = useState("");

  // New Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatWarranty, setNewCatWarranty] = useState(12);
  const [newCatCustomFields, setNewCatCustomFields] = useState("");

  useEffect(() => {
    setDepartments(AssetFlowStore.getDepartments());
    setCategories(AssetFlowStore.getCategories());
    setEmployees(AssetFlowStore.getEmployees());
  }, []);

  const handleSwitchToAdmin = () => {
    const adminUser = AssetFlowStore.getEmployees().find(e => e.role === UserRole.ADMIN);
    if (adminUser) {
      onSwitchUser(adminUser);
    }
  };

  // Add Department Handlers
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptHeadId) return;

    const headEmployee = employees.find(emp => emp.id === newDeptHeadId);
    const parentDept = departments.find(d => d.id === newDeptParentId);

    const newDept: Department = {
      id: "dept-" + Date.now(),
      name: newDeptName,
      headId: newDeptHeadId,
      headName: headEmployee ? headEmployee.name : "Unassigned",
      parentDeptId: newDeptParentId || undefined,
      parentDeptName: parentDept ? parentDept.name : undefined,
      status: "Active"
    };

    const updated = [...departments, newDept];
    AssetFlowStore.saveDepartments(updated);
    setDepartments(updated);

    // Add activity and notifications
    AssetFlowStore.addActivityLog(currentUser.name, `Created Department: ${newDeptName}`, "Department");
    AssetFlowStore.addNotification(
      "New Department Added",
      `The department '${newDeptName}' has been successfully created under Head ${newDept.headName}.`,
      "success"
    );

    // Reset Form
    setNewDeptName("");
    setNewDeptHeadId("");
    setNewDeptParentId("");
    setIsDeptModalOpen(false);
  };

  // Add Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    const newCat: AssetCategory = {
      id: "cat-" + Date.now(),
      name: newCatName,
      warrantyPeriod: Number(newCatWarranty),
      customFields: newCatCustomFields || undefined
    };

    const updated = [...categories, newCat];
    AssetFlowStore.saveCategories(updated);
    setCategories(updated);

    AssetFlowStore.addActivityLog(currentUser.name, `Created Asset Category: ${newCatName}`, "Category");
    AssetFlowStore.addNotification(
      "New Category Created",
      `Asset category '${newCatName}' with ${newCatWarranty}-month warranty has been registered.`,
      "success"
    );

    setNewCatName("");
    setNewCatWarranty(12);
    setNewCatCustomFields("");
    setIsCatModalOpen(false);
  };

  // Promote / Change role of employee
  const handleRoleChange = (employeeId: string, newRole: UserRole) => {
    const updatedEmps = employees.map(emp => {
      if (emp.id === employeeId) {
        // Log changes
        AssetFlowStore.addActivityLog(
          currentUser.name,
          `Changed role of ${emp.name} to ${newRole}`,
          "Employee"
        );
        AssetFlowStore.addNotification(
          "Employee Role Promoted",
          `${emp.name}'s system permissions have been elevated to '${newRole}'.`,
          "info"
        );
        return { ...emp, role: newRole };
      }
      return emp;
    });

    AssetFlowStore.saveEmployees(updatedEmps);
    setEmployees(updatedEmps);
  };

  // Toggle status of employee (Suspended vs Active)
  const handleEmployeeStatusToggle = (employeeId: string) => {
    const updatedEmps = employees.map(emp => {
      if (emp.id === employeeId) {
        const nextStatus = emp.status === "Active" ? "Suspended" as const : "Active" as const;
        AssetFlowStore.addActivityLog(
          currentUser.name,
          `Set status of ${emp.name} to ${nextStatus}`,
          "Employee"
        );
        return { ...emp, status: nextStatus };
      }
      return emp;
    });
    AssetFlowStore.saveEmployees(updatedEmps);
    setEmployees(updatedEmps);
  };

  // Gated Role Protection View
  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="bg-white border border-[#E5E4EA] rounded-xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-[#FBEAE6] text-[#C5432D] rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900">Access Restricted — Admin Only</h3>
          <p className="text-xs text-[#6B6675] leading-relaxed">
            Organization setup (managing departments, defining asset categories, and promoting employees) requires administrator permissions. You are currently logged in as <strong>{currentUser.name}</strong> ({currentUser.role}).
          </p>
        </div>
        <div className="pt-2 border-t border-[#E5E4EA] flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleSwitchToAdmin}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all space-x-1"
          >
            <span>Switch to Admin Persona</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Organization Setup</h2>
        <p className="text-xs text-[#6B6675] mt-1">Configure company structures, customize dynamic schemas, and assign authority roles.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E4EA] bg-white rounded-xl p-1 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("departments")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "departments"
              ? "bg-[#F1E9EE] text-[#714B67]"
              : "text-[#6B6675] hover:bg-[#F4F5FA] hover:text-[#714B67]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Management</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "categories"
              ? "bg-[#F1E9EE] text-[#714B67]"
              : "text-[#6B6675] hover:bg-[#F4F5FA] hover:text-[#714B67]"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Asset Category Management</span>
        </button>

        <button
          onClick={() => setActiveTab("employees")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "employees"
              ? "bg-[#F1E9EE] text-[#714B67]"
              : "text-[#6B6675] hover:bg-[#F4F5FA] hover:text-[#714B67]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory</span>
        </button>
      </div>

      {/* Tab Content: Departments */}
      {activeTab === "departments" && (
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex justify-between items-center pb-3 border-b border-[#E5E4EA]">
            <div>
              <h3 className="text-sm font-bold text-[#714B67]">Corporate Department Hierarchies</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Define structured departments with mapped management heads for approvals.</p>
            </div>
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add department</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4EA]">
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Department Name</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Department Head</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Parent Department</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-[#F4F5FA]/40 transition-colors">
                    <td className="py-3.5 font-semibold text-gray-900">{dept.name}</td>
                    <td className="py-3.5 font-medium">{dept.headName}</td>
                    <td className="py-3.5 text-[#6B6675]/80">{dept.parentDeptName || "— Root —"}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dept.status === "Active" ? "bg-[#E1F5F4] text-[#00A09D]" : "bg-gray-100 text-gray-500"
                      }`}>
                        <span className={`w-1 h-1 mr-1.5 rounded-full ${dept.status === "Active" ? "bg-[#00A09D]" : "bg-gray-400"}`} />
                        {dept.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Categories */}
      {activeTab === "categories" && (
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex justify-between items-center pb-3 border-b border-[#E5E4EA]">
            <div>
              <h3 className="text-sm font-bold text-[#714B67]">Asset Category Schemas</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Structure asset lifespans, warranties, and dynamic custom properties.</p>
            </div>
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add category</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4EA]">
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Category Name</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Default Warranty Period</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Dynamic Fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F4F5FA]/40 transition-colors">
                    <td className="py-3.5 font-semibold text-gray-900">{cat.name}</td>
                    <td className="py-3.5 font-medium">{cat.warrantyPeriod} Months</td>
                    <td className="py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {cat.customFields ? cat.customFields.split(",").map((field, idx) => (
                          <span key={idx} className="text-[10px] bg-[#E7F1FA] text-[#3B82C4] px-2 py-0.5 rounded border border-[#3B82C4]/10">
                            {field.trim()}
                          </span>
                        )) : <span className="text-gray-400 font-mono">— None —</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Employees */}
      {activeTab === "employees" && (
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 space-y-4 shadow-sm animate-fadeIn">
          <div className="pb-3 border-b border-[#E5E4EA] flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#714B67]">Employee directory & role authorization</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Review active employees. Use the dropdown actions to elevate or change roles.</p>
            </div>
            <div className="p-2 bg-[#F1E9EE] border border-[#714B67]/10 rounded-lg flex items-center space-x-2 text-[10px] text-[#714B67] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#714B67]" />
              <span>STRICT: Role changes are only accessible via this administrator panel.</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4EA]">
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Employee Info</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Department</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Current ERP Role</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Status</th>
                  <th className="py-2.5 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F4F5FA]/40 transition-colors">
                    <td className="py-3.5">
                      <div className="font-semibold text-gray-900">{emp.name}</div>
                      <div className="text-[11px] text-[#6B6675]/80 mt-0.5">{emp.email}</div>
                    </td>
                    <td className="py-3.5 font-medium">{emp.departmentName}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.role === UserRole.ADMIN 
                          ? "bg-[#FBEAE6] text-[#C5432D]" 
                          : emp.role === UserRole.ASSET_MANAGER 
                          ? "bg-[#E1F5F4] text-[#00A09D]" 
                          : emp.role === UserRole.DEPARTMENT_HEAD 
                          ? "bg-[#E7F1FA] text-[#3B82C4]" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        emp.status === "Active" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <select
                        id={`role-select-${emp.id}`}
                        value={emp.role}
                        onChange={(e) => handleRoleChange(emp.id, e.target.value as UserRole)}
                        className="px-2 py-1 bg-white border border-[#E5E4EA] rounded text-[11px] font-semibold text-[#6B6675] focus:outline-none focus:border-[#714B67]"
                      >
                        <option value={UserRole.EMPLOYEE}>Employee</option>
                        <option value={UserRole.DEPARTMENT_HEAD}>Dept Head</option>
                        <option value={UserRole.ASSET_MANAGER}>Asset Mgr</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                      <button
                        id={`status-toggle-${emp.id}`}
                        onClick={() => handleEmployeeStatusToggle(emp.id)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                          emp.status === "Active"
                            ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                        }`}
                      >
                        {emp.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {isDeptModalOpen && (
        <div id="dept-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#714B67] px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Add New Corporate Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance & Audits"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Department Head</label>
                <select
                  required
                  value={newDeptHeadId}
                  onChange={(e) => setNewDeptHeadId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                >
                  <option value="">-- Choose Head --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.departmentName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Parent Department (Optional)</label>
                <select
                  value={newDeptParentId}
                  onChange={(e) => setNewDeptParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                >
                  <option value="">-- None (Root Department) --</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Add department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isCatModalOpen && (
        <div id="cat-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#714B67] px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">Add New Asset Category Schema</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Phones & Tablets"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Default Warranty Period (Months)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  placeholder="24"
                  value={newCatWarranty}
                  onChange={(e) => setNewCatWarranty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Dynamic Custom Fields (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="IMEI Number, Screen Size, Carrier Lock"
                  value={newCatCustomFields}
                  onChange={(e) => setNewCatCustomFields(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                />
                <span className="text-[10px] text-gray-400 block mt-1">These fields are made available dynamically when registering assets of this category.</span>
              </div>

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Add category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
