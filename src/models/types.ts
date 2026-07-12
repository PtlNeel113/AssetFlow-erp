export enum UserRole {
  ADMIN = "Admin",
  ASSET_MANAGER = "Asset Manager",
  DEPARTMENT_HEAD = "Department Head",
  EMPLOYEE = "Employee"
}

export enum AssetStatus {
  AVAILABLE = "Available",
  ALLOCATED = "Allocated",
  RESERVED = "Reserved",
  UNDER_MAINTENANCE = "Under Maintenance",
  LOST = "Lost/Overdue",
  RETIRED_DISPOSED = "Retired/Disposed"
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  headName: string;
  parentDeptId?: string;
  parentDeptName?: string;
  status: "Active" | "Inactive";
}

export interface AssetCategory {
  id: string;
  name: string;
  warrantyPeriod: number; // in months
  customFields?: string;
}

export interface Asset {
  id: string;
  tag: string; // e.g., AF-0114
  name: string;
  categoryId: string;
  categoryName: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: "New" | "Good" | "Fair" | "Poor";
  status: AssetStatus;
  location: string;
  isBookable: boolean;
  photoUrl?: string;
  holderId?: string; // current assigned employee ID
  holderName?: string; // current assigned employee Name
  allocationHistory: {
    id: string;
    employeeName: string;
    action: string; // e.g. "Allocated", "Transferred", "Returned"
    date: string;
    notes?: string;
  }[];
  maintenanceHistory: {
    id: string;
    issue: string;
    date: string;
    status: string;
  }[];
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  employeeId: string;
  employeeName: string;
  departmentId?: string;
  allocationDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  conditionCheckIn?: string;
  status: "Active" | "Returned" | "Overdue";
  notes?: string;
}

export interface TransferRequest {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  requestDate: string;
  status: "Requested" | "Approved" | "Reallocated" | "Rejected";
}

export interface ResourceBooking {
  id: string;
  resourceId: string; // e.g. "RM-1", "PROJ-1"
  resourceName: string;
  employeeId: string;
  employeeName: string;
  bookingDate: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  issueSummary: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  requesterId: string;
  requesterName: string;
  assignedTechnician?: string;
  stage: "Pending" | "Approved" | "Technician Assigned" | "In Progress" | "Resolved";
  photoUrl?: string;
  createdDate: string;
}

export interface AuditCycle {
  id: string;
  name: string;
  scopeDepartment: string;
  scopeLocation: string;
  startDate: string;
  endDate: string;
  assignedAuditors: string[]; // names of auditors
  status: "Draft" | "In Progress" | "Closed";
}

export interface AuditLine {
  id: string;
  auditCycleId: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  location: string;
  holderName?: string;
  status: "Verified" | "Missing" | "Damaged" | "Pending";
  notes?: string;
  auditedDate?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  role: UserRole;
  status: "Active" | "Suspended";
  employeeCode?: string;
  adminCode?: string;
  phone?: string;
  address?: string;
  dateJoined?: string;
  managerName?: string;
  emergencyContact?: string;
  profilePhoto?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  actionDescription: string;
  relatedEntity: string; // e.g. "Asset", "Maintenance", "Booking"
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "danger" | "success";
  timestamp: string;
  isRead: boolean;
}
