import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SideNavBar from './components/SideNavBar';
import MarketingLanding from './pages/MarketingLanding';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import AssetAllocation from './pages/AssetAllocation';
import Bookings from './pages/Bookings';
import Maintenance from './pages/Maintenance';
import Audits from './pages/Audits';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Security from './pages/Security';
import VerificationProgress from './pages/VerificationProgress';
import Onboarding from './pages/Onboarding';

import {
  initialAssets,
  initialBookings,
  initialKanbanTasks,
  initialDepartments,
  initialEmployees,
  initialCategories,
  initialNotifications,
  initialUserSettings,
  initialAudits
} from './data/mockData';

function AppLayout({ children, user, onLogout }) {
  return (
    <div className="app-layout">
      <SideNavBar user={user} onLogout={onLogout} />
      <div className="main-content" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(initialUserSettings);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Global State for Persistence & Interactivity
  const [assets, setAssets] = useState(initialAssets);
  const [bookings, setBookings] = useState(initialBookings);
  const [kanbanTasks, setKanbanTasks] = useState(initialKanbanTasks);
  const [departments, setDepartments] = useState(initialDepartments);
  const [employees, setEmployees] = useState(initialEmployees);
  const [categories, setCategories] = useState(initialCategories);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [audits, setAudits] = useState(initialAudits);

  const handleLogin = (userInfo) => {
    setUser({ ...initialUserSettings, fullName: userInfo.fullName, email: userInfo.email, role: userInfo.role });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MarketingLanding />} />
        <Route 
          path="/login" 
          element={
            <Login 
              onLogin={handleLogin} 
              employees={employees} 
            />
          } 
        />
        <Route 
          path="/signup" 
          element={
            <Onboarding 
              employees={employees} 
              onSignUp={(newEmp) => setEmployees([...employees, newEmp])} 
              onLogin={handleLogin} 
            />
          } 
        />

        {/* Authenticated Routes with layout */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Dashboard assets={assets} bookings={bookings} kanbanTasks={kanbanTasks} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/organization" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Organization 
                  departments={departments} 
                  setDepartments={setDepartments} 
                  categories={categories} 
                  setCategories={setCategories} 
                  employees={employees} 
                  setEmployees={setEmployees} 
                />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/assets" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Assets assets={assets} setAssets={setAssets} categories={categories} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/assets/:id" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <AssetDetail assets={assets} setAssets={setAssets} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/allocations" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <AssetAllocation assets={assets} setAssets={setAssets} employees={employees} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/bookings" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Bookings bookings={bookings} setBookings={setBookings} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/maintenance" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Maintenance kanbanTasks={kanbanTasks} setKanbanTasks={setKanbanTasks} employees={employees} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/audits" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Audits audits={audits} setAudits={setAudits} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/reports" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Reports />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/notifications" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Notifications notifications={notifications} setNotifications={setNotifications} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Settings user={user} setUser={setUser} onLogout={handleLogout} />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/security" 
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout}>
                <Security />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/verifying" 
          element={<VerificationProgress onComplete={() => setIsAuthenticated(true)} />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
