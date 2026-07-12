import { 
  UserRole, 
  AssetStatus, 
  Department, 
  AssetCategory, 
  Asset, 
  AssetAllocation, 
  TransferRequest, 
  ResourceBooking, 
  MaintenanceRequest, 
  AuditCycle, 
  AuditLine, 
  Employee, 
  ActivityLog, 
  Notification 
} from "../models/types";

// Helper keys for LocalStorage
const KEYS = {
  CURRENT_USER: "assetflow_current_user",
  DEPARTMENTS: "assetflow_departments",
  CATEGORIES: "assetflow_categories",
  EMPLOYEES: "assetflow_employees",
  ASSETS: "assetflow_assets",
  ALLOCATIONS: "assetflow_allocations",
  TRANSFERS: "assetflow_transfers",
  BOOKINGS: "assetflow_bookings",
  MAINTENANCE: "assetflow_maintenance",
  AUDITS: "assetflow_audits",
  AUDIT_LINES: "assetflow_audit_lines",
  ACTIVITY_LOGS: "assetflow_activity_logs",
  NOTIFICATIONS: "assetflow_notifications"
};

// Initial hardcoded values
const initialDepartments: Department[] = [
  { id: "dept-1", name: "Administration", headId: "emp-4", headName: "Robert Fox", status: "Active" },
  { id: "dept-2", name: "Engineering & IT", headId: "emp-2", headName: "Priya Sharma", parentDeptId: "dept-1", parentDeptName: "Administration", status: "Active" },
  { id: "dept-3", name: "Design & UX", headId: "emp-3", headName: "David Miller", parentDeptId: "dept-2", parentDeptName: "Engineering & IT", status: "Active" },
  { id: "dept-4", name: "Operations & Logistics", headId: "emp-5", headName: "Sarah Jenkins", parentDeptId: "dept-1", parentDeptName: "Administration", status: "Active" }
];

const initialCategories: AssetCategory[] = [
  { id: "cat-1", name: "Laptops & Computers", warrantyPeriod: 36, customFields: "CPU Model, RAM Size, Storage Size" },
  { id: "cat-2", name: "Office Furniture", warrantyPeriod: 60, customFields: "Material, Ergonomic Standard" },
  { id: "cat-3", name: "Vehicles & Transport", warrantyPeriod: 48, customFields: "Fuel Type, Odometer Reading, Insurance Provider" },
  { id: "cat-4", name: "Conference Equipment", warrantyPeriod: 24, customFields: "Display Resolution, Connection Ports" }
];

const initialEmployees: Employee[] = [
  { id: "emp-1", name: "Niraj Sharma", email: "nirajsharma250707@gmail.com", departmentId: "dept-1", departmentName: "Administration", role: UserRole.ADMIN, status: "Active", employeeCode: "EMP-1001", adminCode: "ADM-9001", phone: "+91 98765 43210", address: "Bengaluru, Karnataka", dateJoined: "2024-01-09", managerName: "Robert Fox", emergencyContact: "+91 99887 66554", profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-2", name: "Priya Sharma", email: "priya.sharma@assetflow.corp", departmentId: "dept-2", departmentName: "Engineering & IT", role: UserRole.DEPARTMENT_HEAD, status: "Active", employeeCode: "EMP-1002", phone: "+91 91234 56789", address: "Pune, Maharashtra", dateJoined: "2023-08-14", managerName: "Robert Fox", emergencyContact: "+91 90123 45678", profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-3", name: "David Miller", email: "david.miller@assetflow.corp", departmentId: "dept-3", departmentName: "Design & UX", role: UserRole.DEPARTMENT_HEAD, status: "Active", employeeCode: "EMP-1003", phone: "+91 97654 32109", address: "Hyderabad, Telangana", dateJoined: "2023-11-20", managerName: "Robert Fox", emergencyContact: "+91 98765 11223", profilePhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-4", name: "Robert Fox", email: "robert.fox@assetflow.corp", departmentId: "dept-1", departmentName: "Administration", role: UserRole.DEPARTMENT_HEAD, status: "Active", employeeCode: "EMP-1004", phone: "+91 98222 88999", address: "Noida, Uttar Pradesh", dateJoined: "2022-05-11", managerName: "Niraj Sharma", emergencyContact: "+91 93210 77666", profilePhoto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-5", name: "Sarah Jenkins", email: "sarah.jenkins@assetflow.corp", departmentId: "dept-4", departmentName: "Operations & Logistics", role: UserRole.DEPARTMENT_HEAD, status: "Active", employeeCode: "EMP-1005", phone: "+91 94444 55666", address: "Chennai, Tamil Nadu", dateJoined: "2023-02-18", managerName: "Robert Fox", emergencyContact: "+91 90000 77888", profilePhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-6", name: "Alex Wong", email: "alex.wong@assetflow.corp", departmentId: "dept-4", departmentName: "Operations & Logistics", role: UserRole.ASSET_MANAGER, status: "Active", employeeCode: "EMP-1006", phone: "+91 95555 11222", address: "Mumbai, Maharashtra", dateJoined: "2024-04-02", managerName: "Sarah Jenkins", emergencyContact: "+91 92345 67890", profilePhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-7", name: "John Doe", email: "john.doe@assetflow.corp", departmentId: "dept-2", departmentName: "Engineering & IT", role: UserRole.EMPLOYEE, status: "Active", employeeCode: "EMP-1007", phone: "+91 91111 22222", address: "Delhi, NCR", dateJoined: "2025-01-06", managerName: "Priya Sharma", emergencyContact: "+91 98888 33333", profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=60" },
  { id: "emp-8", name: "Jane Smith", email: "jane.smith@assetflow.corp", departmentId: "dept-3", departmentName: "Design & UX", role: UserRole.EMPLOYEE, status: "Active", employeeCode: "EMP-1008", phone: "+91 92222 33344", address: "Kolkata, West Bengal", dateJoined: "2025-02-14", managerName: "David Miller", emergencyContact: "+91 93333 44455", profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=60" }
];

const initialAssets: Asset[] = [
  {
    id: "as-1",
    tag: "AF-0114",
    name: "MacBook Pro 16\" M3 Max",
    categoryId: "cat-1",
    categoryName: "Laptops & Computers",
    serialNumber: "SN-C02FP18MQ05D",
    acquisitionDate: "2025-01-15",
    acquisitionCost: 349900,
    condition: "New",
    status: AssetStatus.ALLOCATED,
    location: "HQ - Room 302",
    isBookable: false,
    holderId: "emp-2",
    holderName: "Priya Sharma",
    photoUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    allocationHistory: [
      { id: "alh-1", employeeName: "Priya Sharma", action: "Allocated", date: "2025-01-20", notes: "Allocated to Dept Head on onboarding" }
    ],
    maintenanceHistory: [
      { id: "mth-1", issue: "Keyboard keys sticky", date: "2025-05-12", status: "Resolved" }
    ]
  },
  {
    id: "as-2",
    tag: "AF-0115",
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    categoryId: "cat-1",
    categoryName: "Laptops & Computers",
    serialNumber: "SN-PF4X82Q9",
    acquisitionDate: "2025-02-10",
    acquisitionCost: 189900,
    condition: "Good",
    status: AssetStatus.AVAILABLE,
    location: "HQ - IT Lab Inventory",
    isBookable: false,
    allocationHistory: [
      { id: "alh-2", employeeName: "Sarah Jenkins", action: "Returned", date: "2025-06-01", notes: "Returned after department migration" }
    ],
    maintenanceHistory: [
      { id: "mth-2", issue: "Screen flicker on cold start", date: "2025-07-01", status: "In Progress" }
    ]
  },
  {
    id: "as-3",
    tag: "AF-0220",
    name: "Herman Miller Aeron Chair",
    categoryId: "cat-2",
    categoryName: "Office Furniture",
    serialNumber: "SN-HM-AERON-992",
    acquisitionDate: "2024-05-11",
    acquisitionCost: 125000,
    condition: "Good",
    status: AssetStatus.ALLOCATED,
    location: "Tech Hub - Floor 2",
    isBookable: false,
    holderId: "emp-7",
    holderName: "John Doe",
    photoUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    allocationHistory: [
      { id: "alh-3", employeeName: "John Doe", action: "Allocated", date: "2024-05-15", notes: "Standard desk allocation" }
    ],
    maintenanceHistory: []
  },
  {
    id: "as-4",
    tag: "AF-0402",
    name: "Smart Board Pro 75\" 4K",
    categoryId: "cat-4",
    categoryName: "Conference Equipment",
    serialNumber: "SN-SB75-4K-09",
    acquisitionDate: "2024-09-01",
    acquisitionCost: 450000,
    condition: "New",
    status: AssetStatus.RESERVED,
    location: "Main Conf Room B",
    isBookable: true,
    holderId: "emp-3",
    holderName: "David Miller",
    allocationHistory: [],
    maintenanceHistory: []
  },
  {
    id: "as-5",
    tag: "AF-0301",
    name: "Tesla Model Y (Electric Utility Fleet)",
    categoryId: "cat-3",
    categoryName: "Vehicles & Transport",
    serialNumber: "SN-5YJ3E1EB8LF8XXXXX",
    acquisitionDate: "2023-11-20",
    acquisitionCost: 4790000,
    condition: "Fair",
    status: AssetStatus.UNDER_MAINTENANCE,
    location: "Parking Slot A (Charger B)",
    isBookable: true,
    allocationHistory: [
      { id: "alh-4", employeeName: "Alex Wong", action: "Allocated", date: "2024-01-05", notes: "Assigned as shared pool vehicle" }
    ],
    maintenanceHistory: [
      { id: "mth-3", issue: "Battery range diagnostics needed", date: "2026-07-11", status: "Pending Approval" }
    ]
  },
  {
    id: "as-6",
    tag: "AF-0118",
    name: "Dell UltraSharp 34\" Curved Monitor",
    categoryId: "cat-1",
    categoryName: "Laptops & Computers",
    serialNumber: "SN-DELL-U3419W-01",
    acquisitionDate: "2024-03-12",
    acquisitionCost: 84900,
    condition: "Good",
    status: AssetStatus.LOST,
    location: "Remote - Held by Employee",
    isBookable: false,
    holderId: "emp-7",
    holderName: "John Doe",
    allocationHistory: [
      { id: "alh-5", employeeName: "John Doe", action: "Allocated", date: "2024-03-20", notes: "Remote setup item" }
    ],
    maintenanceHistory: []
  },
  {
    id: "as-7",
    tag: "AF-0224",
    name: "Executive Walnut Corner Desk",
    categoryId: "cat-2",
    categoryName: "Office Furniture",
    serialNumber: "SN-WD-EXEC-44",
    acquisitionDate: "2019-01-10",
    acquisitionCost: 150000,
    condition: "Poor",
    status: AssetStatus.RETIRED_DISPOSED,
    location: "Storage Warehouse B",
    isBookable: false,
    allocationHistory: [
      { id: "alh-6", employeeName: "Robert Fox", action: "Returned", date: "2025-12-15", notes: "Returned prior to decommissioning due to drawer damage" }
    ],
    maintenanceHistory: [
      { id: "mth-4", issue: "Drawer rail misalignment", date: "2025-06-10", status: "Resolved" }
    ]
  }
];

const initialAllocations: AssetAllocation[] = [
  {
    id: "al-1",
    assetId: "as-1",
    assetTag: "AF-0114",
    assetName: "MacBook Pro 16\" M3 Max",
    employeeId: "emp-2",
    employeeName: "Priya Sharma",
    departmentId: "dept-2",
    allocationDate: "2025-01-20",
    expectedReturnDate: "2026-01-20",
    status: "Active",
    notes: "Allocated for standard workflow"
  },
  {
    id: "al-2",
    assetId: "as-3",
    assetTag: "AF-0220",
    assetName: "Herman Miller Aeron Chair",
    employeeId: "emp-7",
    employeeName: "John Doe",
    departmentId: "dept-2",
    allocationDate: "2024-05-15",
    expectedReturnDate: "2026-05-15",
    status: "Active",
    notes: "Home setup allocation"
  },
  {
    id: "al-3",
    assetId: "as-6",
    assetTag: "AF-0118",
    assetName: "Dell UltraSharp 34\" Curved Monitor",
    employeeId: "emp-7",
    employeeName: "John Doe",
    departmentId: "dept-2",
    allocationDate: "2024-03-20",
    expectedReturnDate: "2025-03-20", // Overdue return
    status: "Overdue",
    notes: "Overdue remote monitor return"
  }
];

const initialTransfers: TransferRequest[] = [
  {
    id: "tr-1",
    assetId: "as-1",
    assetTag: "AF-0114",
    assetName: "MacBook Pro 16\" M3 Max",
    fromEmployeeId: "emp-2",
    fromEmployeeName: "Priya Sharma",
    toEmployeeId: "emp-7",
    toEmployeeName: "John Doe",
    requestDate: "2026-07-10",
    status: "Requested"
  }
];

const initialBookings: ResourceBooking[] = [
  {
    id: "bk-1",
    resourceId: "as-4",
    resourceName: "Smart Board Pro 75\" 4K (Conf Room B)",
    employeeId: "emp-2",
    employeeName: "Priya Sharma",
    bookingDate: "2026-07-12",
    startTime: "09:00",
    endTime: "10:00",
    status: "Upcoming"
  },
  {
    id: "bk-2",
    resourceId: "as-4",
    resourceName: "Smart Board Pro 75\" 4K (Conf Room B)",
    employeeId: "emp-7",
    employeeName: "John Doe",
    bookingDate: "2026-07-12",
    startTime: "11:00",
    endTime: "12:30",
    status: "Upcoming"
  },
  {
    id: "bk-3",
    resourceId: "as-5",
    resourceName: "Tesla Model Y (Parking Slot A)",
    employeeId: "emp-8",
    employeeName: "Jane Smith",
    bookingDate: "2026-07-11",
    startTime: "14:00",
    endTime: "16:00",
    status: "Completed"
  }
];

const initialMaintenances: MaintenanceRequest[] = [
  {
    id: "mnt-1",
    assetId: "as-5",
    assetTag: "AF-0301",
    assetName: "Tesla Model Y (Electric Utility Fleet)",
    issueSummary: "Battery range diagnostics needed",
    description: "Rapid battery percentage drop noted below 20%. Requesting complete battery pack cell diagnostics and voltage balance validation.",
    priority: "High",
    requesterId: "emp-5",
    requesterName: "Sarah Jenkins",
    stage: "Pending",
    createdDate: "2026-07-11"
  },
  {
    id: "mnt-2",
    assetId: "as-2",
    assetTag: "AF-0115",
    assetName: "Lenovo ThinkPad X1 Carbon Gen 11",
    issueSummary: "Screen flicker on cold start",
    description: "Display flickers heavily during initial BIOS loading and Windows login screens. Normalizes after 5 minutes of operation.",
    priority: "Urgent",
    requesterId: "emp-6",
    requesterName: "Alex Wong",
    assignedTechnician: "Alex Wong",
    stage: "In Progress",
    createdDate: "2026-07-01"
  },
  {
    id: "mnt-3",
    assetId: "as-1",
    assetTag: "AF-0114",
    assetName: "MacBook Pro 16\" M3 Max",
    issueSummary: "Sticky keys recovery",
    description: "The spacebar and Shift key feel stiff and sticky. Cleaned and adjusted switch caps.",
    priority: "Medium",
    requesterId: "emp-2",
    requesterName: "Priya Sharma",
    assignedTechnician: "External IT Support",
    stage: "Resolved",
    createdDate: "2025-05-12"
  }
];

const initialAudits: AuditCycle[] = [
  {
    id: "aud-1",
    name: "Q3 IT Assets Audit Cycle",
    scopeDepartment: "Engineering & IT",
    scopeLocation: "HQ Room 302 & Remote",
    startDate: "2026-07-10",
    endDate: "2026-07-15",
    assignedAuditors: ["Robert Fox", "Alex Wong"],
    status: "In Progress"
  }
];

const initialAuditLines: AuditLine[] = [
  { id: "audl-1", auditCycleId: "aud-1", assetId: "as-1", assetTag: "AF-0114", assetName: "MacBook Pro 16\" M3 Max", location: "HQ - Room 302", holderName: "Priya Sharma", status: "Verified", auditedDate: "2026-07-10" },
  { id: "audl-2", auditCycleId: "aud-1", assetId: "as-2", assetTag: "AF-0115", assetName: "Lenovo ThinkPad X1 Carbon Gen 11", location: "HQ - IT Lab Inventory", status: "Verified", auditedDate: "2026-07-10" },
  { id: "audl-3", auditCycleId: "aud-1", assetId: "as-3", assetTag: "AF-0220", assetName: "Herman Miller Aeron Chair", location: "Tech Hub - Floor 2", holderName: "John Doe", status: "Pending" },
  { id: "audl-4", auditCycleId: "aud-1", assetId: "as-6", assetTag: "AF-0118", assetName: "Dell UltraSharp 34\" Curved Monitor", location: "Remote - Held by Employee", holderName: "John Doe", status: "Pending" }
];

const initialActivityLogs: ActivityLog[] = [
  { id: "act-1", timestamp: "2026-07-11T14:32:00-07:00", userName: "Sarah Jenkins", actionDescription: "Raised Maintenance Request for Tesla Model Y", relatedEntity: "Maintenance" },
  { id: "act-2", timestamp: "2026-07-11T10:15:00-07:00", userName: "Priya Sharma", actionDescription: "Requested asset transfer for AF-0114 to John Doe", relatedEntity: "Transfer" },
  { id: "act-3", timestamp: "2026-07-10T16:00:00-07:00", userName: "Alex Wong", actionDescription: "Launched Q3 IT Assets Audit Cycle", relatedEntity: "Audit" },
  { id: "act-4", timestamp: "2026-07-10T09:12:00-07:00", userName: "Priya Sharma", actionDescription: "Booked Conference Room B Smart Board", relatedEntity: "Booking" }
];

const initialNotifications: Notification[] = [
  { id: "not-1", title: "Overdue Return Alert", message: "Asset AF-0118 (Dell UltraSharp 34\" Curved Monitor) assigned to John Doe is 478 days overdue.", type: "danger", timestamp: "2026-07-11T08:00:00", isRead: false },
  { id: "not-2", title: "New Transfer Request", message: "Priya Sharma requested to transfer AF-0114 to John Doe.", type: "info", timestamp: "2026-07-11T10:15:00", isRead: false },
  { id: "not-3", title: "Maintenance Alert", message: "Sarah Jenkins raised an urgent maintenance request for AF-0301.", type: "warning", timestamp: "2026-07-11T14:32:00", isRead: false },
  { id: "not-4", title: "Audit Update", message: "Alex Wong verified 2 items in Q3 IT Assets Audit.", type: "success", timestamp: "2026-07-10T17:45:00", isRead: true }
];

function notifyDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("assetflow_data_updated"));
    window.dispatchEvent(new Event("storage"));
  }
}

// ODOO MODULE CODE EMBEDS
export const ODOO_MODULE_FILES = {
  MANIFEST: `
# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'AssetFlow - Enterprise Asset & Resource ERP',
    'version': '1.0.0',
    'category': 'Operations/Assets',
    'summary': 'Lifecycle management, double-allocation conflict prevention, resource scheduling, audits, and maintenance.',
    'description': """
AssetFlow ERP Module
====================
Provides an enterprise-level platform for:
* Tracking corporate physical assets and shared bookable resources.
* Managing full Asset Lifecycles (Available, Allocated, Reserved, Maintenance, Lost, Retired).
* Overlap & Conflict prevention workflows for bookings and allocations.
* Multi-stage maintenance pipelines with technician task boards.
* Structured asset audits with color-coded checklists and discrepancy reporting.
    """,
    'author': 'AssetFlow Hackathon Team',
    'website': 'https://github.com/nirajsharma250707/assetflow',
    'depends': ['base', 'mail', 'calendar', 'hr'],
    'data': [
        'security/assetflow_security.xml',
        'security/ir.model.access.csv',
        'data/asset_sequence.xml',
        'views/assetflow_menus.xml',
        'views/asset_views.xml',
        'views/department_views.xml',
        'views/booking_views.xml',
        'views/maintenance_views.xml',
        'views/audit_views.xml',
        'views/dashboard_templates.xml',
    ],
    'demo': [
        'data/assetflow_demo.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
`,
  MODELS: `
# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import datetime

class AssetCategory(models.Model):
    _name = 'assetflow.category'
    _description = 'Asset Category'

    name = fields.Char(string='Category Name', required=True)
    warranty_period = fields.Integer(string='Warranty Period (Months)', default=12)
    custom_field_definitions = fields.Text(string='Custom Field Definitions', help='Comma-separated dynamic fields')

class Asset(models.Model):
    _name = 'assetflow.asset'
    _description = 'Asset Directory'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Asset Name', required=True, tracking=True)
    tag = fields.Char(string='Asset Tag', required=True, copy=False, readonly=True, 
                     default=lambda self: _('New'))
    category_id = fields.Many2one('assetflow.category', string='Category', required=True, tracking=True)
    serial_number = fields.Char(string='Serial Number', required=True)
    acquisition_date = fields.Date(string='Acquisition Date', default=fields.Date.today)
    acquisition_cost = fields.Float(string='Acquisition Cost (USD)')
    condition = fields.Selection([
        ('new', 'New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor')
    ], string='Condition', default='new', tracking=True)
    
    status = fields.Selection([
        ('available', 'Available'),
        ('allocated', 'Allocated'),
        ('reserved', 'Reserved'),
        ('maintenance', 'Under Maintenance'),
        ('lost', 'Lost/Overdue'),
        ('retired', 'Retired/Disposed')
    ], string='Status', default='available', tracking=True)
    
    location = fields.Char(string='Location', required=True, tracking=True)
    is_bookable = fields.Boolean(string='Bookable Resource', default=False)
    image = fields.Binary(string='Asset Photo')
    
    holder_id = fields.Many2one('hr.employee', string='Current Holder', tracking=True, readonly=True)
    allocation_ids = fields.One2many('assetflow.allocation', 'asset_id', string='Allocation History')
    maintenance_ids = fields.One2many('assetflow.maintenance', 'asset_id', string='Maintenance Tasks')

    @api.model
    def create(self, vals):
        if vals.get('tag', _('New')) == _('New'):
            vals['tag'] = self.env['ir.sequence'].next_by_code('assetflow.asset') or _('New')
        return super(Asset, self).create(vals)

class AssetAllocation(models.Model):
    _name = 'assetflow.allocation'
    _description = 'Asset Allocation Engine'
    _inherit = ['mail.thread']

    asset_id = fields.Many2one('assetflow.asset', string='Asset', required=True)
    employee_id = fields.Many2one('hr.employee', string='Employee', required=True)
    department_id = fields.Many2one('hr.department', string='Department', compute='_compute_dept', store=True)
    allocation_date = fields.Date(string='Allocation Date', default=fields.Date.today)
    expected_return_date = fields.Date(string='Expected Return Date', required=True)
    actual_return_date = fields.Date(string='Actual Return Date')
    notes = fields.Text(string='Check-in/Check-out Notes')
    
    status = fields.Selection([
        ('active', 'Active'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue')
    ], string='Status', default='active', tracking=True)

    @api.depends('employee_id')
    def _compute_dept(self):
        for rec in self:
            rec.department_id = rec.employee_id.department_id

    @api.constrains('asset_id', 'status')
    def _check_double_allocation(self):
        for rec in self:
            if rec.status == 'active':
                conflict = self.search([
                    ('asset_id', '=', rec.asset_id.id),
                    ('status', '=', 'active'),
                    ('id', '!=', rec.id)
                ])
                if conflict:
                    raise ValidationError(_("Allocation Blocked: Asset %s is currently held by %s. Raise a Transfer instead.") % 
                                          (rec.asset_id.name, conflict[0].employee_id.name))

    def action_mark_returned(self, condition_check_in, notes):
        self.ensure_one()
        self.write({
            'actual_return_date': fields.Date.today(),
            'status': 'returned',
            'notes': notes
        })
        self.asset_id.write({
            'status': 'available',
            'condition': condition_check_in,
            'holder_id': False
        })
`,
  VIEWS: `
<!-- XML Odoo UI Definitions -->
<odoo>
    <record id="view_assetflow_asset_tree" model="ir.ui.view">
        <field name="name">assetflow.asset.tree</field>
        <field name="model">assetflow.asset</field>
        <field name="arch" type="xml">
            <tree decoration-info="status == 'allocated'" decoration-success="status == 'available'" decoration-warning="status == 'reserved'">
                <field name="tag"/>
                <field name="name"/>
                <field name="category_id"/>
                <field name="serial_number"/>
                <field name="location"/>
                <field name="holder_id"/>
                <field name="status" widget="badge" 
                       decoration-success="status == 'available'" 
                       decoration-info="status == 'allocated'" 
                       decoration-warning="status == 'reserved'"
                       decoration-danger="status == 'lost'"
                       decoration-muted="status == 'retired'"/>
            </tree>
        </field>
    </record>

    <record id="view_assetflow_asset_kanban" model="ir.ui.view">
        <field name="name">assetflow.asset.kanban</field>
        <field name="model">assetflow.asset</field>
        <field name="arch" type="xml">
            <kanban default_group_by="status" class="o_kanban_mobile">
                <field name="id"/>
                <field name="name"/>
                <field name="tag"/>
                <field name="status"/>
                <field name="holder_id"/>
                <field name="image"/>
                <templates>
                    <t t-name="kanban-box">
                        <div class="oe_kanban_global_click o_kanban_record_has_image_fill">
                            <div class="o_kanban_image_fill_left" t-attf-style="background-image:url('#{kanban_image('assetflow.asset', 'image', record.id.raw_value)}')"/>
                            <div class="oe_kanban_details">
                                <strong class="o_kanban_record_title"><field name="name"/></strong>
                                <div><span class="badge badge-secondary"><field name="tag"/></span></div>
                                <div>Location: <field name="location"/></div>
                                <div>Holder: <field name="holder_id"/></div>
                            </div>
                        </div>
                    </t>
                </templates>
            </kanban>
        </field>
    </record>
</odoo>
`,
  SECURITY: `
# ir.model.access.csv Odoo security rules
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_assetflow_employee_read,assetflow.asset employee,model_assetflow_asset,base.group_user,1,0,0,0
access_assetflow_manager_all,assetflow.asset manager,model_assetflow_asset,hr.group_hr_manager,1,1,1,1
access_assetflow_alloc_employee,assetflow.allocation employee,model_assetflow_allocation,base.group_user,1,0,0,0
access_assetflow_alloc_mgr,assetflow.allocation mgr,model_assetflow_allocation,hr.group_hr_manager,1,1,1,1
`
};

// Initial state loads
export function getInitialData<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

export function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Global data stores with getter/setter wrappers
export class AssetFlowStore {
  static getCurrentUser(): Employee {
    return getInitialData<Employee>(KEYS.CURRENT_USER, initialEmployees[0]);
  }

  static setCurrentUser(user: Employee) {
    saveToStorage(KEYS.CURRENT_USER, user);
  }

  static getDepartments(): Department[] {
    return getInitialData<Department[]>(KEYS.DEPARTMENTS, initialDepartments);
  }

  static saveDepartments(depts: Department[]) {
    saveToStorage(KEYS.DEPARTMENTS, depts);
    notifyDataChanged();
  }

  static getCategories(): AssetCategory[] {
    return getInitialData<AssetCategory[]>(KEYS.CATEGORIES, initialCategories);
  }

  static saveCategories(cats: AssetCategory[]) {
    saveToStorage(KEYS.CATEGORIES, cats);
    notifyDataChanged();
  }

  static getEmployees(): Employee[] {
    return getInitialData<Employee[]>(KEYS.EMPLOYEES, initialEmployees);
  }

  static saveEmployees(emps: Employee[]) {
    saveToStorage(KEYS.EMPLOYEES, emps);
    notifyDataChanged();
  }

  static getAssets(): Asset[] {
    return getInitialData<Asset[]>(KEYS.ASSETS, initialAssets);
  }

  static saveAssets(assets: Asset[]) {
    saveToStorage(KEYS.ASSETS, assets);
    notifyDataChanged();
  }

  static getAllocations(): AssetAllocation[] {
    return getInitialData<AssetAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
  }

  static saveAllocations(allocs: AssetAllocation[]) {
    saveToStorage(KEYS.ALLOCATIONS, allocs);
    notifyDataChanged();
  }

  static getTransfers(): TransferRequest[] {
    return getInitialData<TransferRequest[]>(KEYS.TRANSFERS, initialTransfers);
  }

  static saveTransfers(transfers: TransferRequest[]) {
    saveToStorage(KEYS.TRANSFERS, transfers);
    notifyDataChanged();
  }

  static getBookings(): ResourceBooking[] {
    return getInitialData<ResourceBooking[]>(KEYS.BOOKINGS, initialBookings);
  }

  static saveBookings(bookings: ResourceBooking[]) {
    saveToStorage(KEYS.BOOKINGS, bookings);
    notifyDataChanged();
  }

  static getMaintenance(): MaintenanceRequest[] {
    return getInitialData<MaintenanceRequest[]>(KEYS.MAINTENANCE, initialMaintenances);
  }

  static saveMaintenance(requests: MaintenanceRequest[]) {
    saveToStorage(KEYS.MAINTENANCE, requests);
    notifyDataChanged();
  }

  static getAudits(): AuditCycle[] {
    return getInitialData<AuditCycle[]>(KEYS.AUDITS, initialAudits);
  }

  static saveAudits(audits: AuditCycle[]) {
    saveToStorage(KEYS.AUDITS, audits);
    notifyDataChanged();
  }

  static getAuditLines(): AuditLine[] {
    return getInitialData<AuditLine[]>(KEYS.AUDIT_LINES, initialAuditLines);
  }

  static saveAuditLines(lines: AuditLine[]) {
    saveToStorage(KEYS.AUDIT_LINES, lines);
    notifyDataChanged();
  }

  static getActivityLogs(): ActivityLog[] {
    return getInitialData<ActivityLog[]>(KEYS.ACTIVITY_LOGS, initialActivityLogs);
  }

  static addActivityLog(userName: string, actionDescription: string, relatedEntity: string) {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: "act-" + Date.now(),
      timestamp: new Date().toISOString(),
      userName,
      actionDescription,
      relatedEntity
    };
    const updated = [newLog, ...logs];
    saveToStorage(KEYS.ACTIVITY_LOGS, updated);
    notifyDataChanged();
    return updated;
  }

  static getNotifications(): Notification[] {
    return getInitialData<Notification[]>(KEYS.NOTIFICATIONS, initialNotifications);
  }

  static saveNotifications(notifications: Notification[]) {
    saveToStorage(KEYS.NOTIFICATIONS, notifications);
    notifyDataChanged();
  }

  static addNotification(title: string, message: string, type: "info" | "warning" | "danger" | "success") {
    const list = this.getNotifications();
    const item: Notification = {
      id: "not-" + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const updated = [item, ...list];
    this.saveNotifications(updated);
    return updated;
  }
}
