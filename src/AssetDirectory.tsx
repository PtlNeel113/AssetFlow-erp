import React, { useState, useEffect } from "react";
import { Employee, Asset, AssetStatus, AssetCategory } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  Search, 
  Plus, 
  Calendar, 
  History, 
  Wrench, 
  Monitor, 
  SlidersHorizontal, 
  MapPin, 
  X,
  Upload,
  BookOpen,
  Info,
  CheckCircle,
  FileSpreadsheet,
  QrCode
} from "lucide-react";

interface AssetDirectoryProps {
  currentUser: Employee;
}

type DetailsTab = "timeline" | "allocation" | "maintenance" | "qrcode";

export default function AssetDirectory({ currentUser }: AssetDirectoryProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedBookable, setSelectedBookable] = useState("all");

  // Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<DetailsTab>("timeline");

  // Form State for New Asset
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newSerialNumber, setNewSerialNumber] = useState("");
  const [newAcquisitionDate, setNewAcquisitionDate] = useState(new Date().toISOString().split("T")[0]);
  const [newAcquisitionCost, setNewAcquisitionCost] = useState("");
  const [newCondition, setNewCondition] = useState<"New" | "Good" | "Fair" | "Poor">("New");
  const [newLocation, setNewLocation] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newIsBookable, setNewIsBookable] = useState(false);

  useEffect(() => {
    const loadedAssets = AssetFlowStore.getAssets();
    setAssets(loadedAssets);
    setCategories(AssetFlowStore.getCategories());
    setEmployees(AssetFlowStore.getEmployees());

    // Check for asset query param to auto-inspect
    const urlParams = new URLSearchParams(window.location.search);
    const assetTag = urlParams.get("asset");
    if (assetTag) {
      const match = loadedAssets.find(a => a.tag.toLowerCase() === assetTag.toLowerCase());
      if (match) {
        setSelectedAsset(match);
        setActiveDetailsTab("qrcode");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    const handleDataUpdate = () => {
      const refreshedAssets = AssetFlowStore.getAssets();
      setAssets(refreshedAssets);
      setCategories(AssetFlowStore.getCategories());
      setEmployees(AssetFlowStore.getEmployees());
    };

    window.addEventListener("assetflow_data_updated", handleDataUpdate);
    return () => window.removeEventListener("assetflow_data_updated", handleDataUpdate);
  }, []);

  // Filter computation
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.holderName && asset.holderName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || asset.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === "all" || asset.status === selectedStatus;
    const matchesLocation = selectedLocation === "all" || asset.location.toLowerCase().includes(selectedLocation.toLowerCase());
    
    let matchesBookable = true;
    if (selectedBookable === "yes") matchesBookable = asset.isBookable;
    if (selectedBookable === "no") matchesBookable = !asset.isBookable;

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesBookable;
  });

  // Locations set
  const locations = Array.from(new Set(assets.map(a => {
    const mainLoc = a.location.split("-")[0].trim();
    return mainLoc;
  })));

  // Generate sequence tag like AF-0114 based on total assets + random offset
  const getNextTagPreview = () => {
    const baseNumber = 100 + assets.length + 1;
    return `AF-0${baseNumber}`;
  };

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCategoryId || !newSerialNumber || !newLocation) return;

    const categoryObj = categories.find(c => c.id === newCategoryId);
    const generatedTag = getNextTagPreview();

    const newAsset: Asset = {
      id: "as-" + Date.now(),
      tag: generatedTag,
      name: newName,
      categoryId: newCategoryId,
      categoryName: categoryObj ? categoryObj.name : "Unassigned",
      serialNumber: newSerialNumber,
      acquisitionDate: newAcquisitionDate,
      acquisitionCost: Number(newAcquisitionCost) || 0,
      condition: newCondition,
      status: AssetStatus.AVAILABLE,
      location: newLocation,
      isBookable: newIsBookable,
      photoUrl: newPhotoUrl || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop&q=60",
      allocationHistory: [],
      maintenanceHistory: []
    };

    const updated = [newAsset, ...assets];
    AssetFlowStore.saveAssets(updated);
    setAssets(updated);

    // Activity Log
    AssetFlowStore.addActivityLog(currentUser.name, `Registered new asset ${generatedTag} (${newName})`, "Asset");
    AssetFlowStore.addNotification(
      "Asset Registered",
      `Asset ${generatedTag} - '${newName}' has been added to the Odoo Inventory directory.`,
      "success"
    );

    // Reset Form
    setNewName("");
    setNewCategoryId("");
    setNewSerialNumber("");
    setNewAcquisitionDate(new Date().toISOString().split("T")[0]);
    setNewAcquisitionCost("");
    setNewCondition("New");
    setNewLocation("");
    setNewPhotoUrl("");
    setNewIsBookable(false);
    setIsRegisterModalOpen(false);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: AssetStatus) => {
    let dotColor = "bg-[#6B6675]";
    let bgColor = "bg-[#F4F5FA]";
    let textColor = "text-[#6B6675]";

    if (status === AssetStatus.AVAILABLE) {
      dotColor = "bg-[#00A09D]";
      bgColor = "bg-[#E1F5F4]";
      textColor = "text-[#00A09D]";
    } else if (status === AssetStatus.ALLOCATED) {
      dotColor = "bg-[#3B82C4]";
      bgColor = "bg-[#E7F1FA]";
      textColor = "text-[#3B82C4]";
    } else if (status === AssetStatus.RESERVED) {
      dotColor = "bg-[#D89614]";
      bgColor = "bg-[#FCF1DA]";
      textColor = "text-[#D89614]";
    } else if (status === AssetStatus.UNDER_MAINTENANCE) {
      dotColor = "bg-[#D9822B]";
      bgColor = "bg-[#FBEEDF]";
      textColor = "text-[#D9822B]";
    } else if (status === AssetStatus.LOST) {
      dotColor = "bg-[#C5432D]";
      bgColor = "bg-[#FBEAE6]";
      textColor = "text-[#C5432D]";
    } else if (status === AssetStatus.RETIRED_DISPOSED) {
      dotColor = "bg-[#6B6675]";
      bgColor = "bg-[#E5E4EA]/60";
      textColor = "text-[#6B6675]";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotColor}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#714B67] tracking-tight">Corporate Asset Directory</h2>
          <p className="text-xs text-[#6B6675] mt-1">Lifecycle tracking, physical location assignments, and inventory serial management.</p>
        </div>
        <button
          id="btn-register-asset"
          onClick={() => setIsRegisterModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-all space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Register asset</span>
        </button>
      </div>

      {/* Filter and search panel */}
      <div className="bg-white border border-[#E5E4EA] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              id="search-input"
              placeholder="Search by tag (AF-XXXX), asset name, serial, or holder name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Category Dropdown */}
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs font-semibold text-[#6B6675] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs font-semibold text-[#6B6675] focus:outline-none"
            >
              <option value="all">All States</option>
              {Object.values(AssetStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Location Dropdown */}
            <select
              id="filter-location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs font-semibold text-[#6B6675] focus:outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Bookable Selection */}
            <select
              id="filter-bookable"
              value={selectedBookable}
              onChange={(e) => setSelectedBookable(e.target.value)}
              className="px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs font-semibold text-[#6B6675] focus:outline-none"
            >
              <option value="all">Bookable Status</option>
              <option value="yes">Shared (Bookable)</option>
              <option value="no">Dedicated Item</option>
            </select>
          </div>
        </div>

        {/* Filter Clear Indicator */}
        {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedLocation !== "all" || selectedBookable !== "all") && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E4EA]/50">
            <span className="text-[10px] text-[#6B6675] font-semibold">
              Filtered {filteredAssets.length} of {assets.length} assets
            </span>
            <button
              id="btn-clear-filters"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSelectedLocation("all");
                setSelectedBookable("all");
              }}
              className="text-[10px] text-[#714B67] hover:underline font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-[#E5E4EA] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="asset-directory-table">
            <thead>
              <tr className="border-b border-[#E5E4EA] bg-[#F4F5FA]/50">
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Tag</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Asset Info</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Shared Resource</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold text-[#6B6675] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4EA]/50 text-xs text-[#6B6675]">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#6B6675]/60">
                    No corporate assets match current search criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#F4F5FA]/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#714B67]">{asset.tag}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={asset.photoUrl} 
                          alt={asset.name} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-lg border border-[#E5E4EA] bg-[#F4F5FA] shrink-0"
                        />
                        <div>
                          <div className="font-bold text-gray-900 leading-tight">{asset.name}</div>
                          <div className="text-[10px] font-mono mt-0.5 text-[#6B6675]/80">S/N: {asset.serialNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{asset.categoryName}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D9822B]" />
                        <span>{asset.location}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {asset.isBookable ? (
                        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-[#E1F5F4] text-[#00A09D] rounded text-[10px] font-bold border border-[#00A09D]/10">
                          <BookOpen className="w-3 h-3" />
                          <span>Bookable</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px] font-mono">— Dedicated —</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{renderStatusBadge(asset.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        id={`btn-view-history-${asset.tag}`}
                        onClick={() => { setSelectedAsset(asset); setActiveDetailsTab("timeline"); }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-[#714B67]/25 text-[#714B67] hover:bg-[#F1E9EE] text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Inspect history</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER ASSET */}
      {isRegisterModalOpen && (
        <div id="register-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-2xl w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#714B67] px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Register Corporate Asset</h3>
                <p className="text-[10px] text-[#F1E9EE] mt-0.5">AssetFlow sequence automatically reserves a distinct hardware token.</p>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleRegisterAsset} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Asset Tag ID (Read-only)</label>
                  <input
                    type="text"
                    disabled
                    value={getNextTagPreview()}
                    className="w-full px-3 py-2 bg-gray-100 border border-[#E5E4EA] rounded-lg text-xs font-mono font-bold text-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Asset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro 14\"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Asset Category</label>
                  <select
                    required
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Manufacturer Serial Number (S/N)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-A190B389"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all text-transform:uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Acquisition Date</label>
                  <input
                    type="date"
                    required
                    value={newAcquisitionDate}
                    onChange={(e) => setNewAcquisitionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Acquisition Cost (INR / ₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150000"
                    value={newAcquisitionCost}
                    onChange={(e) => setNewAcquisitionCost(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Initial Physical Condition</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Location / Inventory Node</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HQ - Room 302"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase mb-1.5">Hardware Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                />
              </div>

              <div className="p-3.5 bg-[#E1F5F4] border border-[#00A09D]/15 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded bg-white text-[#00A09D] border border-[#00A09D]/10">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">Make bookable resource</h5>
                    <p className="text-[10px] text-[#6B6675]">Allow employees to book this asset as a shared, scheduled resource.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsBookable}
                    onChange={(e) => setNewIsBookable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A09D]"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-[#E5E4EA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E4EA] text-xs font-semibold rounded-lg text-[#6B6675] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Register asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLYOUT MODAL: INSPECT HISTORY */}
      {selectedAsset && (
        <div id="inspect-modal" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-[#E5E4EA] max-w-lg w-full overflow-hidden shadow-lg animate-scaleIn">
            <div className="bg-[#714B67] p-5 text-white flex justify-between items-start">
              <div className="flex items-center space-x-3.5">
                <img 
                  src={selectedAsset.photoUrl} 
                  alt={selectedAsset.name} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded-lg border border-white/20 bg-[#F4F5FA] shrink-0"
                />
                <div>
                  <span className="text-[10px] bg-white/10 text-white font-mono px-2 py-0.5 rounded font-bold">
                    {selectedAsset.tag}
                  </span>
                  <h3 className="font-bold text-sm mt-1">{selectedAsset.name}</h3>
                  <p className="text-[10px] text-[#F1E9EE]/80 mt-0.5">S/N: {selectedAsset.serialNumber} | {selectedAsset.location}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="text-white/80 hover:text-white font-bold cursor-pointer">✕</button>
            </div>

            {/* Inspect Tabs */}
            <div className="flex border-b border-[#E5E4EA] bg-[#F4F5FA]">
              <button
                onClick={() => setActiveDetailsTab("timeline")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 ${
                  activeDetailsTab === "timeline" ? "text-[#714B67] border-b-2 border-[#714B67] bg-white" : "text-[#6B6675] hover:text-[#714B67]"
                }`}
              >
                ERP Lifecycle Status
              </button>
              <button
                onClick={() => setActiveDetailsTab("allocation")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 ${
                  activeDetailsTab === "allocation" ? "text-[#714B67] border-b-2 border-[#714B67] bg-white" : "text-[#6B6675] hover:text-[#714B67]"
                }`}
              >
                Allocation History
              </button>
              <button
                onClick={() => setActiveDetailsTab("maintenance")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 ${
                  activeDetailsTab === "maintenance" ? "text-[#714B67] border-b-2 border-[#714B67] bg-white" : "text-[#6B6675] hover:text-[#714B67]"
                }`}
              >
                Maintenance Log
              </button>
              <button
                onClick={() => setActiveDetailsTab("qrcode")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-150 ${
                  activeDetailsTab === "qrcode" ? "text-[#714B67] border-b-2 border-[#714B67] bg-white" : "text-[#6B6675] hover:text-[#714B67]"
                }`}
              >
                Physical QR Tag
              </button>
            </div>

            {/* Inspect Body */}
            <div className="p-6 max-h-[350px] overflow-y-auto">
              {activeDetailsTab === "timeline" && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#F4F5FA] rounded-lg border border-[#E5E4EA] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#6B6675] font-semibold">Active ERP Lifecycle:</span>
                      {renderStatusBadge(selectedAsset.status)}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#6B6675] font-semibold">Asset Category:</span>
                      <span className="font-semibold text-gray-900">{selectedAsset.categoryName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#6B6675] font-semibold">Current Custodian:</span>
                      <span className="font-semibold text-gray-900">{selectedAsset.holderName || "— No assignment (In Inventory) —"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#6B6675] font-semibold">Acquisition Cost:</span>
                      <span className="font-semibold text-gray-900">₹{selectedAsset.acquisitionCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-[#6B6675] uppercase tracking-wider">Asset Lifespan Flow</h4>
                    <div className="relative border-l border-[#E5E4EA] pl-4 ml-2 space-y-4 text-xs">
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-100" />
                        <div className="font-semibold text-gray-900">Procured / Tagged</div>
                        <p className="text-[10px] text-gray-400">Acquired on {selectedAsset.acquisitionDate} under condition '{selectedAsset.condition}'</p>
                      </div>

                      {selectedAsset.allocationHistory.length > 0 && (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                          <div className="font-semibold text-gray-900">Lifecycle Allocation</div>
                          <p className="text-[10px] text-gray-400">Deployed to {selectedAsset.allocationHistory[0].employeeName}</p>
                        </div>
                      )}

                      {selectedAsset.status === AssetStatus.UNDER_MAINTENANCE && (
                        <div className="relative">
                          <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#D9822B] border-2 border-white" />
                          <div className="font-semibold text-gray-900">Under Active Repairs</div>
                          <p className="text-[10px] text-gray-400">Currently scheduled in the maintenance pipeline</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeDetailsTab === "allocation" && (
                <div className="space-y-3">
                  {selectedAsset.allocationHistory.length === 0 ? (
                    <p className="text-center py-6 text-xs text-[#6B6675]/60">This asset has never been allocated to any corporate staff.</p>
                  ) : (
                    selectedAsset.allocationHistory.map((item) => (
                      <div key={item.id} className="p-3 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold text-gray-900">
                          <span>{item.employeeName}</span>
                          <span className="text-[10px] text-gray-400">{item.date}</span>
                        </div>
                        <p className="text-[#6B6675] text-[11px] font-semibold">{item.action}</p>
                        {item.notes && <p className="text-gray-400 italic text-[10px] mt-1">"{item.notes}"</p>}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDetailsTab === "maintenance" && (
                <div className="space-y-3">
                  {selectedAsset.maintenanceHistory.length === 0 ? (
                    <p className="text-center py-6 text-xs text-[#6B6675]/60">This asset has never logged any physical system errors or repairs.</p>
                  ) : (
                    selectedAsset.maintenanceHistory.map((item) => (
                      <div key={item.id} className="p-3 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold text-gray-900">
                          <span className="truncate max-w-[70%]">{item.issue}</span>
                          <span className="text-[10px] text-gray-400">{item.date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D9822B]" />
                          <span className="text-[10px] text-[#D9822B] font-bold">{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeDetailsTab === "qrcode" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F4F5FA]/50 border border-[#E5E4EA] rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                    <div className="text-[10px] uppercase font-bold text-[#6B6675]/80 tracking-wider flex items-center space-x-1">
                      <QrCode className="w-3.5 h-3.5 text-[#714B67]" />
                      <span>Physical Asset Scan Code</span>
                    </div>
                    
                    <div className="p-3 bg-white rounded-lg border border-[#E5E4EA] flex items-center justify-center shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + "/?asset=" + selectedAsset.tag)}`}
                        alt={`QR code for ${selectedAsset.tag}`}
                        className="w-32 h-32"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-mono text-xs font-black text-[#714B67] tracking-widest bg-[#F1E9EE] px-2.5 py-0.5 rounded inline-block">
                        {selectedAsset.tag}
                      </h4>
                      <p className="text-[10px] text-gray-400 max-w-xs mx-auto">
                        Stick this QR tag on the physical hardware item. Scanning it with a phone links directly to this digital ERP record.
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-1">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + "/?asset=" + selectedAsset.tag)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-[#F1E9EE] hover:bg-[#F1E9EE]/85 text-[#714B67] text-[10px] font-bold rounded-lg border border-[#714B67]/10 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        Open High-Res
                      </a>
                      <button
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Print Asset Tag - ${selectedAsset.tag}</title>
                                  <style>
                                    body { font-family: monospace; text-align: center; padding: 40px; }
                                    .tag-container { border: 2px dashed #000; padding: 20px; display: inline-block; }
                                    h2 { margin: 10px 0; font-size: 24px; letter-spacing: 2px; }
                                    p { font-size: 14px; color: #555; }
                                  </style>
                                </head>
                                <body onload="window.print(); window.close();">
                                  <div class="tag-container">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "/?asset=" + selectedAsset.tag)}" />
                                    <h2>\${selectedAsset.tag}</h2>
                                    <p>\${selectedAsset.name}</p>
                                    <p>AssetFlow ERP - Odoo Edition</p>
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-[#6B6675] border border-[#E5E4EA] text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Print Tag
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#F4F5FA] border-t border-[#E5E4EA] flex justify-end">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-[#714B67] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
