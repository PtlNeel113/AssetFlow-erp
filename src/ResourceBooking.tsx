import React, { useState, useEffect } from "react";
import { Employee, Asset, ResourceBooking, AssetStatus } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ShieldAlert,
  Info
} from "lucide-react";

interface ResourceBookingProps {
  currentUser: Employee;
}

export default function ResourceBookingView({ currentUser }: ResourceBookingProps) {
  const [bookableAssets, setBookableAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);

  // Selected asset for schedule visualizer
  const [selectedAssetId, setSelectedAssetId] = useState("");

  // Booking Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [formAssetId, setFormAssetId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");

  // Real-time conflict feedback
  const [overlapError, setOverlapError] = useState("");

  useEffect(() => {
    const assets = AssetFlowStore.getAssets().filter(a => a.isBookable);
    setBookableAssets(assets);
    setBookings(AssetFlowStore.getBookings());
    if (assets.length > 0) {
      setSelectedAssetId(assets[0].id);
    }

    const handleUpdate = () => {
      setBookings(AssetFlowStore.getBookings());
      setBookableAssets(AssetFlowStore.getAssets().filter(a => a.isBookable));
    };

    window.addEventListener("assetflow_bookings_updated", handleUpdate);
    window.addEventListener("assetflow_data_updated", handleUpdate);
    return () => {
      window.removeEventListener("assetflow_bookings_updated", handleUpdate);
      window.removeEventListener("assetflow_data_updated", handleUpdate);
    };
  }, []);

  // Run real-time overlap validation as the user modifies form fields
  useEffect(() => {
    validateOverlaps();
  }, [formAssetId, formDate, formStartTime, formEndTime, bookings]);

  const validateOverlaps = () => {
    setOverlapError("");
    if (!formAssetId || !formDate || !formStartTime || !formEndTime) return;

    // Convert input times to numbers for easy comparison (e.g., "09:30" -> 9.5)
    const timeToNum = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h + m / 60;
    };

    const startNum = timeToNum(formStartTime);
    const endNum = timeToNum(formEndTime);

    if (endNum <= startNum) {
      setOverlapError("End time must be after start time.");
      return;
    }

    // Find overlapping booking for the same resource on the same date
    const collision = bookings.find((bk) => {
      if (bk.resourceId !== formAssetId || bk.bookingDate !== formDate || bk.status === "Cancelled") {
        return false;
      }
      const bkStart = timeToNum(bk.startTime);
      const bkEnd = timeToNum(bk.endTime);

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return startNum < bkEnd && endNum > bkStart;
    });

    if (collision) {
      setOverlapError(
        `This slot overlaps an existing booking (${collision.startTime}–${collision.endTime}) held by ${collision.employeeName}. Choose a different time.`
      );
    }
  };

  // Submit booking
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (overlapError || !formAssetId || !formDate || !formStartTime || !formEndTime) return;

    const assetObj = bookableAssets.find(a => a.id === formAssetId);
    if (!assetObj) return;

    const newBooking: ResourceBooking = {
      id: "bk-" + Date.now(),
      resourceId: formAssetId,
      resourceName: `${assetObj.name} (${assetObj.location})`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      bookingDate: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      status: "Upcoming"
    };

    const updated = [...bookings, newBooking];
    AssetFlowStore.saveBookings(updated);
    setBookings(updated);

    // Update asset state in directory if needed (keep as Reserved if upcoming today)
    const updatedAssets = AssetFlowStore.getAssets().map(a => {
      if (a.id === formAssetId && a.status === AssetStatus.AVAILABLE) {
        return { ...a, status: AssetStatus.RESERVED, holderId: currentUser.id, holderName: currentUser.name };
      }
      return a;
    });
    AssetFlowStore.saveAssets(updatedAssets);

    AssetFlowStore.addActivityLog(currentUser.name, `Scheduled booking for ${assetObj.name}`, "Booking");
    AssetFlowStore.addNotification(
      "Resource Scheduled",
      `Successfully reserved '${assetObj.name}' on ${formDate} from ${formStartTime} to ${formEndTime}.`,
      "success"
    );

    // Reset Form
    setIsBookModalOpen(false);
    setFormAssetId("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStartTime("09:00");
    setFormEndTime("10:00");
  };

  // Cancel booking
  const handleCancelBooking = (id: string) => {
    const updated = bookings.map(bk => {
      if (bk.id === id) {
        AssetFlowStore.addActivityLog(currentUser.name, `Cancelled booking for ${bk.resourceName}`, "Booking");
        return { ...bk, status: "Cancelled" as const };
      }
      return bk;
    });
    AssetFlowStore.saveBookings(updated);
    setBookings(updated);

    // Release asset status
    const bkObj = bookings.find(b => b.id === id);
    if (bkObj) {
      const updatedAssets = AssetFlowStore.getAssets().map(a => {
        if (a.id === bkObj.resourceId && a.status === AssetStatus.RESERVED) {
          return { ...a, status: AssetStatus.AVAILABLE, holderId: undefined, holderName: undefined };
        }
        return a;
      });
      AssetFlowStore.saveAssets(updatedAssets);
    }
  };

  // Export single booking to ICS calendar format
  const handleExportICS = (booking: ResourceBooking) => {
    try {
      const cleanDate = booking.bookingDate.replace(/-/g, ""); // "YYYYMMDD"
      const startClean = booking.startTime.replace(/:/g, "") + "00"; // "HHMMSS"
      const endClean = booking.endTime.replace(/:/g, "") + "00"; // "HHMMSS"

      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AssetFlow ERP//Resource Booking//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${booking.id}@assetflow.erp`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${cleanDate}T${startClean}`,
        `DTEND:${cleanDate}T${endClean}`,
        `SUMMARY:AssetFlow Booking: ${booking.resourceName.split("(")[0].trim()}`,
        `DESCRIPTION:Corporate reservation made by ${booking.employeeName} inside AssetFlow ERP. Status: ${booking.status}`,
        `LOCATION:${booking.resourceName.includes("(") ? booking.resourceName.split("(")[1]?.replace(")", "") : "AssetFlow ERP"}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ];

      const icsString = icsLines.join("\r\n");
      const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `booking-${booking.id}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      AssetFlowStore.addNotification(
        "Calendar Exported",
        `Successfully generated ICS calendar token for '${booking.resourceName.split("(")[0].trim()}'.`,
        "success"
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Export all non-cancelled bookings to single ICS calendar file
  const handleExportAllICS = () => {
    try {
      const activeBookings = bookings.filter(b => b.status !== "Cancelled");
      if (activeBookings.length === 0) return;

      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AssetFlow ERP//Resource Booking//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
      ];

      activeBookings.forEach((booking) => {
        const cleanDate = booking.bookingDate.replace(/-/g, "");
        const startClean = booking.startTime.replace(/:/g, "") + "00";
        const endClean = booking.endTime.replace(/:/g, "") + "00";
        
        icsLines.push(
          "BEGIN:VEVENT",
          `UID:${booking.id}@assetflow.erp`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
          `DTSTART:${cleanDate}T${startClean}`,
          `DTEND:${cleanDate}T${endClean}`,
          `SUMMARY:AssetFlow Booking: ${booking.resourceName.split("(")[0].trim()}`,
          `DESCRIPTION:Corporate reservation made by ${booking.employeeName} inside AssetFlow ERP. Status: ${booking.status}`,
          `LOCATION:${booking.resourceName.includes("(") ? booking.resourceName.split("(")[1]?.replace(")", "") : "AssetFlow ERP"}`,
          "END:VEVENT"
        );
      });

      icsLines.push("END:VCALENDAR");

      const icsString = icsLines.join("\r\n");
      const blob = new Blob([icsString], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `assetflow-bookings.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      AssetFlowStore.addNotification(
        "Schedule Synced",
        `Exported ${activeBookings.length} bookings into a unified .ics calendar file.`,
        "success"
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Filter bookings for visual schedule
  const activeVisualAsset = bookableAssets.find(a => a.id === selectedAssetId);
  const visualBookings = bookings.filter(b => b.resourceId === selectedAssetId && b.status !== "Cancelled");

  // Hourly slots for scheduler display (08:00 to 18:00)
  const hours = Array.from({ length: 11 }, (_, i) => {
    const h = i + 8;
    return `${h < 10 ? "0" + h : h}:00`;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Shared Resource Bookings</h2>
          <p className="text-xs text-[#6B6675] mt-1">Schedule conferencing rooms, company vehicles, and high-value equipment without overlap collisions.</p>
        </div>
        <button
          id="btn-trigger-book-modal"
          onClick={() => { setIsBookModalOpen(true); if (bookableAssets.length > 0) setFormAssetId(bookableAssets[0].id); }}
          className="inline-flex items-center px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Book resource</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column Left: Visual Week-Agenda Scheduler */}
        <div className="lg:col-span-2 bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E4EA] gap-3">
            <div>
              <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Hourly Schedule Grid</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Select a resource to review booking intervals.</p>
            </div>
            <select
              id="booking-resource-filter"
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="px-3 py-1.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs font-semibold text-[#6B6675]"
            >
              {bookableAssets.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Visual Hour Grid */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {activeVisualAsset ? (
              hours.map((hour) => {
                // Find if there's an ongoing reservation at this hour
                const reservation = visualBookings.find(b => {
                  const [h] = hour.split(":").map(Number);
                  const [bStartH] = b.startTime.split(":").map(Number);
                  const [bEndH] = b.endTime.split(":").map(Number);
                  return h >= bStartH && h < bEndH;
                });

                return (
                  <div key={hour} className="flex items-center space-x-3.5 py-1.5 group">
                    <span className="w-12 text-right font-mono text-[11px] text-[#6B6675] font-semibold">{hour}</span>
                    <div className="flex-1 border-b border-[#E5E4EA]/60 relative h-12 flex items-center">
                      {reservation ? (
                        <div className="absolute inset-y-1 inset-x-2 bg-[#FCF1DA] border-l-4 border-[#D89614] rounded px-3 py-1 flex items-center justify-between text-xs text-[#D89614] font-medium shadow-sm animate-fadeIn">
                          <div>
                            <span className="font-bold block text-gray-900">{reservation.employeeName}</span>
                            <span className="text-[10px] text-[#D89614]/85 font-mono">{reservation.startTime} - {reservation.endTime}</span>
                          </div>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#D89614]/10 shadow-sm font-bold">Reserved</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center px-4 rounded hover:bg-[#F4F5FA]/40 transition-colors cursor-pointer text-[10px] text-gray-300 font-medium group-hover:text-[#714B67]">
                          + Available Interval
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-xs text-gray-400">No bookable resources configured inside organization inventory.</p>
            )}
          </div>
        </div>

        {/* Column Right: Booking Register List */}
        <div className="bg-white border border-[#E5E4EA] rounded-xl p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[#E5E4EA] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider">Bookings list</h3>
              <p className="text-[11px] text-[#6B6675] mt-0.5">Registry of ongoing and completed reservations.</p>
            </div>
            {bookings.some(b => b.status !== "Cancelled") && (
              <button
                onClick={handleExportAllICS}
                title="Export all approved bookings to .ics"
                className="px-2.5 py-1 bg-[#F1E9EE] hover:bg-[#F1E9EE]/85 text-[#714B67] border border-[#714B67]/10 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1"
              >
                <Calendar className="w-3 h-3" />
                <span>Export ICS</span>
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {bookings.length === 0 ? (
              <p className="text-center py-12 text-xs text-[#6B6675]/60">No bookings yet — Book a resource</p>
            ) : (
              bookings.slice().reverse().map((bk) => (
                <div key={bk.id} className="p-3 bg-[#F4F5FA] border border-[#E5E4EA] rounded-xl space-y-2 relative">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-gray-900 leading-snug">{bk.resourceName.split("(")[0]}</h4>
                      <p className="text-[10px] text-[#6B6675] font-semibold flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-[#D89614]" />
                        <span>{bk.bookingDate} | {bk.startTime}–{bk.endTime}</span>
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bk.status === "Upcoming"
                        ? "bg-[#FCF1DA] text-[#D89614]"
                        : bk.status === "Ongoing"
                        ? "bg-[#E7F1FA] text-[#3B82C4]"
                        : bk.status === "Completed"
                        ? "bg-[#E1F5F4] text-[#00A09D]"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {bk.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#E5E4EA]/50">
                    <span className="text-[#6B6675]/80 font-medium">By: {bk.employeeName}</span>
                    <div className="flex items-center space-x-2">
                      {bk.status !== "Cancelled" && (
                        <button
                          onClick={() => handleExportICS(bk)}
                          title="Export booking to .ics calendar"
                          className="text-[#714B67] hover:text-[#714B67]/80 font-bold cursor-pointer flex items-center space-x-0.5"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
                          <span>Sync ICS</span>
                        </button>
                      )}
                      {bk.status === "Upcoming" && (bk.employeeId === currentUser.id || currentUser.role !== "Employee") && (
                        <button
                          id={`cancel-booking-${bk.id}`}
                          onClick={() => handleCancelBooking(bk.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer flex items-center space-x-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: BOOK RESOURCE */}
      {isBookModalOpen && (
        <div id="book-resource-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-md w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#714B67] px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Schedule Shared Resource</h3>
                <p className="text-[10px] text-[#F1E9EE] mt-0.5">AssetFlow locks schedule times to avoid double-bookings.</p>
              </div>
              <button onClick={() => setIsBookModalOpen(false)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Select Bookable Resource</label>
                <select
                  required
                  id="book-asset-id"
                  value={formAssetId}
                  onChange={(e) => setFormAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                >
                  <option value="">-- Select Resource --</option>
                  {bookableAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} — {a.location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Booking Date</label>
                <input
                  type="date"
                  required
                  id="book-date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Start Time</label>
                  <input
                    type="time"
                    required
                    id="book-start-time"
                    step="1800"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">End Time</label>
                  <input
                    type="time"
                    required
                    id="book-end-time"
                    step="1800"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white"
                  />
                </div>
              </div>

              {/* OVERLAP COLLISION WARNING */}
              {overlapError && (
                <div id="booking-overlap-alert" className="p-3.5 bg-[#FBEAE6] border border-[#C5432D]/15 rounded-lg flex items-start space-x-2 text-[#C5432D]">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h5 className="text-xs font-bold leading-none">Schedule Overlap Alert</h5>
                    <p className="text-[10px] text-[#6B6675] mt-1">{overlapError}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-booking-submit"
                  disabled={!!overlapError}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-lg cursor-pointer ${
                    overlapError 
                      ? "bg-gray-300 cursor-not-allowed text-gray-500" 
                      : "bg-[#714B67] hover:bg-[#714B67]/90"
                  }`}
                >
                  Book resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
