import React, { useState, useEffect } from "react";
import LoginSignup from "./components/LoginSignup";
import MainLayout from "./components/MainLayout";
import Dashboard from "./components/Dashboard";
import AssetDirectory from "./components/AssetDirectory";
import AllocationTransfer from "./components/AllocationTransfer";
import ResourceBooking from "./components/ResourceBooking";
import Maintenance from "./components/Maintenance";
import AssetAudit from "./components/AssetAudit";
import Reports from "./components/Reports";
import ActivityLogs from "./components/ActivityLogs";
import OrgSetup from "./components/OrgSetup";
import DeveloperOdoo from "./components/DeveloperOdoo";
import EmployeeProfile from "./components/profile/EmployeeProfile";
import { Employee } from "./types";
import { AssetFlowStore } from "./mockData";
import AiChatbot from "./components/AiChatbot";
import { triggerSystemNotification, requestNotificationPermission } from "./utils/notificationHelper";

export default function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("assetflow_theme") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("assetflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    // Read user from localStorage on boot
    const storedUser = localStorage.getItem("assetflow_current_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // Fallback or unauthenticated
        setCurrentUser(null);
      }
    }

    // Check for scanned physical asset parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("asset")) {
      setActiveTab("directory");
    }
  }, []);

  // System-level native browser alerts monitoring effect
  useEffect(() => {
    if (!currentUser) return;

    // Request permissions early
    requestNotificationPermission();

    // Store already alerted IDs & statuses to prevent repetitive popups
    const alertedMaintenanceKeys = new Set<string>();
    const alertedAuditKeys = new Set<string>();

    // Pre-populate with currently existing states so we only alert on transitions
    const initialMaint = AssetFlowStore.getMaintenance();
    initialMaint.forEach(m => {
      alertedMaintenanceKeys.add(`${m.id}-${m.stage}`);
    });

    const initialAudits = AssetFlowStore.getAudits();
    initialAudits.forEach(a => {
      alertedAuditKeys.add(a.id);
    });

    // Check periodically (every 4 seconds)
    const interval = setInterval(() => {
      // 1. Monitor Maintenance Requests
      const currentMaint = AssetFlowStore.getMaintenance();
      currentMaint.forEach(m => {
        const key = `${m.id}-${m.stage}`;
        
        // If the logged-in user is the requester of the ticket
        if (m.requesterId === currentUser.id) {
          // If the ticket transitioned to Approved or Resolved, and we haven't alerted for this stage yet
          if ((m.stage === "Approved" || m.stage === "Resolved") && !alertedMaintenanceKeys.has(key)) {
            triggerSystemNotification(
              "Maintenance Request Update",
              `Achaa! Your ticket for ${m.assetName} (${m.assetTag}) is now ${m.stage.toUpperCase()}!`
            );
            alertedMaintenanceKeys.add(key);
          }
        }
        alertedMaintenanceKeys.add(key);
      });

      // 2. Monitor Audit Cycle Assignments
      const currentAudits = AssetFlowStore.getAudits();
      currentAudits.forEach(a => {
        if (!alertedAuditKeys.has(a.id)) {
          // If the logged-in user is in the assigned auditors list
          const isUserAssigned = a.assignedAuditors.some(
            auditor => auditor.toLowerCase().includes(currentUser.name.toLowerCase()) ||
                       currentUser.name.toLowerCase().includes(auditor.toLowerCase())
          );
          
          if (isUserAssigned && a.status === "In Progress") {
            triggerSystemNotification(
              "New Audit Cycle Assigned",
              `Namaste! You have been assigned to audit cycle '${a.name}' for department ${a.scopeDepartment}.`
            );
          }
          alertedAuditKeys.add(a.id);
        }
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSuccess = (user: Employee) => {
    AssetFlowStore.setCurrentUser(user);
    setCurrentUser(user);
    setActiveTab("dashboard");
    AssetFlowStore.addActivityLog(user.name, "User signed into AssetFlow Session", "Security");
  };

  const handleLogout = () => {
    if (currentUser) {
      AssetFlowStore.addActivityLog(currentUser.name, "User signed out of AssetFlow Session", "Security");
    }
    localStorage.removeItem("assetflow_current_user");
    setCurrentUser(null);
  };

  // Render the corresponding screen component based on activeTab
  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case "dashboard":
        return <Dashboard currentUser={currentUser} onNavigate={setActiveTab} />;
      case "directory":
        return <AssetDirectory currentUser={currentUser} />;
      case "profile":
        return <EmployeeProfile currentUser={currentUser} />;
      case "allocations":
        return <AllocationTransfer currentUser={currentUser} />;
      case "bookings":
        return <ResourceBooking currentUser={currentUser} />;
      case "maintenance":
        return <Maintenance currentUser={currentUser} />;
      case "audits":
        return <AssetAudit currentUser={currentUser} />;
      case "reports":
        return <Reports />;
      case "logs":
        return <ActivityLogs currentUser={currentUser} />;
      case "org-setup":
        return <OrgSetup currentUser={currentUser} onSwitchUser={setCurrentUser} />;
      case "odoo":
        return <DeveloperOdoo />;
      default:
        return <Dashboard currentUser={currentUser} onNavigate={setActiveTab} />;
    }
  };

  if (!currentUser) {
    return <LoginSignup onLogin={handleLoginSuccess} />;
  }

  return (
    <MainLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      theme={theme}
      setTheme={setTheme}
    >
      {renderTabContent()}
      <AiChatbot currentUser={currentUser} onNavigate={setActiveTab} />
    </MainLayout>
  );
}
