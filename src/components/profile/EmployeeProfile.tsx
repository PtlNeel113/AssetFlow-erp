import React, { useEffect, useMemo, useState } from "react";
import { Employee, Asset, ResourceBooking } from "../../models/types";
import { AssetFlowStore } from "../../data/mockData";
import { Download, QrCode, ScanLine, BadgeCheck, Mail, Phone, MapPin, CalendarDays, Briefcase, ShieldCheck, Sparkles, Building2, Clock3, UserCircle2 } from "lucide-react";

interface EmployeeProfileProps {
  currentUser: Employee;
}

export default function EmployeeProfile({ currentUser }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee>(currentUser);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);
  const [scanValue, setScanValue] = useState("");
  const [scanResult, setScanResult] = useState<Asset | null>(null);

  useEffect(() => {
    const refresh = () => {
      const employees = AssetFlowStore.getEmployees();
      const match = employees.find((item) => item.id === currentUser.id) || currentUser;
      setEmployee(match);
      setAssets(AssetFlowStore.getAssets());
      setBookings(AssetFlowStore.getBookings());
    };

    refresh();
    window.addEventListener("assetflow_data_updated", refresh);
    return () => window.removeEventListener("assetflow_data_updated", refresh);
  }, [currentUser.id]);

  const assignedAssets = useMemo(() => assets.filter((asset) => asset.holderId === employee.id), [assets, employee.id]);
  const upcomingBookings = useMemo(() => bookings.filter((booking) => booking.employeeId === employee.id && booking.status !== "Cancelled"), [bookings, employee.id]);

  const profileCard = useMemo(() => {
    const idPayload = JSON.stringify({
      name: employee.name,
      employeeCode: employee.employeeCode || employee.id,
      adminCode: employee.adminCode || "N/A",
      role: employee.role,
      email: employee.email,
      department: employee.departmentName,
      qrType: "employee"
    });
    return `data:text/plain;charset=utf-8,${encodeURIComponent(idPayload)}`;
  }, [employee]);

  const handleDownloadProfile = () => {
    const link = document.createElement("a");
    link.href = profileCard;
    link.download = `${employee.employeeCode || employee.id}-profile.txt`;
    link.click();
  };

  const handleScan = () => {
    if (!scanValue.trim()) return;
    const found = assets.find((asset) =>
      asset.tag.toLowerCase() === scanValue.trim().toLowerCase() ||
      asset.serialNumber.toLowerCase() === scanValue.trim().toLowerCase()
    );
    setScanResult(found || null);
  };

  const qrCodeSrc = useMemo(() => {
    const payload = JSON.stringify({
      type: "employee",
      id: employee.id,
      code: employee.employeeCode || employee.id,
      name: employee.name,
      dept: employee.departmentName
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
  }, [employee]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#714B67]">My Profile</h2>
          <p className="text-xs text-[#6B6675] mt-1">Your secure employee identity, access details, and assigned asset record.</p>
        </div>
        <button onClick={handleDownloadProfile} className="inline-flex items-center gap-2 rounded-lg bg-[#714B67] px-4 py-2 text-xs font-semibold text-white shadow-sm">
          <Download className="h-4 w-4" />
          Download ID
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-[#E5E4EA] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative">
              <img src={employee.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=60"} alt={employee.name} className="h-24 w-24 rounded-2xl object-cover" />
              <div className="absolute -bottom-2 -right-2 rounded-full bg-[#00A09D] p-1.5 text-white shadow">
                <UserCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-[#211F24]">{employee.name}</h3>
                <span className="rounded-full bg-[#E1F5F4] px-2.5 py-1 text-[10px] font-semibold text-[#00A09D]">{employee.role}</span>
              </div>
              <p className="mt-2 text-sm text-[#6B6675]">{employee.departmentName} • {employee.email}</p>
              <div className="mt-4 grid gap-3 text-sm text-[#6B6675] sm:grid-cols-2">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#714B67]" /> <span>Admin ID: {employee.adminCode || "N/A"}</span></div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#3B82C4]" /> <span>{employee.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#D9822B]" /> <span>{employee.phone || "-"}</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#D89614]" /> <span>{employee.address || employee.departmentName}</span></div>
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#714B67]" /> <span>Joined: {employee.dateJoined || "-"}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-[#6B6675]">
            <BadgeCheck className="h-4 w-4 text-[#00A09D]" />
            <span>Employee ID: {employee.employeeCode || employee.id}</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#F4F5FA] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#714B67]"><Building2 className="h-4 w-4" /> Department</div>
              <p className="mt-2 text-sm text-[#6B6675]">{employee.departmentName}</p>
              <p className="mt-1 text-xs text-[#6B6675]">Manager: {employee.managerName || "-"}</p>
            </div>
            <div className="rounded-xl bg-[#F4F5FA] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#714B67]"><Sparkles className="h-4 w-4" /> Emergency Contact</div>
              <p className="mt-2 text-sm text-[#6B6675]">{employee.emergencyContact || "-"}</p>
              <p className="mt-1 text-xs text-[#6B6675]">Fast support contact for asset or safety requests.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E5E4EA] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#714B67]">QR Identity</h3>
            <QrCode className="h-5 w-5 text-[#00A09D]" />
          </div>
          <div className="mt-4 flex flex-col items-center">
            <img src={qrCodeSrc} alt="Employee QR" className="h-40 w-40 rounded-xl border border-[#E5E4EA] bg-white p-2" />
            <p className="mt-3 text-center text-xs text-[#6B6675]">Use this QR to identify yourself at asset checkpoints and service desks.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[24px] border border-[#E5E4EA] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#714B67]">Assigned assets</h3>
            <span className="rounded-full bg-[#E1F5F4] px-2.5 py-1 text-[10px] font-bold text-[#00A09D]">{assignedAssets.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {assignedAssets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#E5E4EA] p-4 text-sm text-[#6B6675]">No active asset allocation is linked to this employee yet.</p>
            ) : assignedAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between rounded-xl border border-[#E5E4EA] bg-[#F4F5FA] px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#211F24]">{asset.name}</p>
                  <p className="text-xs text-[#6B6675]">{asset.tag} · {asset.location}</p>
                </div>
                <span className="rounded-full bg-[#E7F1FA] px-2.5 py-1 text-[10px] font-semibold text-[#3B82C4]">{asset.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E5E4EA] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#714B67]">Asset QR lookup</h3>
            <ScanLine className="h-5 w-5 text-[#D9822B]" />
          </div>
          <div className="mt-4 space-y-3">
            <input value={scanValue} onChange={(e) => setScanValue(e.target.value)} placeholder="Paste asset tag or serial number" className="w-full rounded-lg border border-[#E5E4EA] bg-[#F4F5FA] px-3 py-2 text-sm text-[#6B6675]" />
            <button onClick={handleScan} className="w-full rounded-lg bg-[#D9822B] px-3 py-2 text-sm font-semibold text-white">Lookup asset</button>
            {scanResult ? (
              <div className="rounded-xl border border-[#E5E4EA] bg-[#FBEEDF] p-3 text-sm text-[#D9822B]">
                <p className="font-semibold">{scanResult.name}</p>
                <p className="mt-1 text-xs">Tag: {scanResult.tag} · Location: {scanResult.location}</p>
                <p className="mt-1 text-xs">Status: {scanResult.status}</p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-[#E5E4EA] p-3 text-sm text-[#6B6675]">Use a QR tag, tag ID, or serial number to reveal asset details instantly.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#E5E4EA] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#714B67]">Upcoming bookings</h3>
          <span className="rounded-full bg-[#FCF1DA] px-2.5 py-1 text-[10px] font-bold text-[#D89614]">{upcomingBookings.length}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {upcomingBookings.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E5E4EA] p-4 text-sm text-[#6B6675]">No upcoming bookings available.</p>
          ) : upcomingBookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-[#E5E4EA] bg-[#F4F5FA] p-3">
              <p className="text-sm font-semibold text-[#211F24]">{booking.resourceName}</p>
              <p className="mt-1 text-xs text-[#6B6675]">{booking.bookingDate} · {booking.startTime} to {booking.endTime}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
