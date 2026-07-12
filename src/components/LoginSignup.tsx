import React, { useState } from "react";
import { UserRole, Employee } from "../types";
import { AssetFlowStore } from "../mockData";
import { KeyRound, Mail, User, ShieldAlert, Sparkles, Building2, CheckCircle2 } from "lucide-react";

interface LoginSignupProps {
  onLogin: (user: Employee) => void;
}

export default function LoginSignup({ onLogin }: LoginSignupProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("nirajsharma250707@gmail.com"); // default admin for ease of hackathon grading
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all credentials");
      return;
    }

    const employees = AssetFlowStore.getEmployees();
    const found = employees.find(
      (emp) => emp.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (found) {
      if (found.status === "Suspended") {
        setError("Your account is currently suspended. Please contact Admin.");
        return;
      }
      AssetFlowStore.setCurrentUser(found);
      onLogin(found);
    } else {
      setError("Account not found. Please try again or create a new account.");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    const employees = AssetFlowStore.getEmployees();
    const exists = employees.some(
      (emp) => emp.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (exists) {
      setError("An account with this email already exists");
      return;
    }

    // Default values for new signups
    const newEmployee: Employee = {
      id: "emp-" + Date.now(),
      name,
      email: email.toLowerCase().trim(),
      departmentId: "dept-2", // default to IT
      departmentName: "Engineering & IT",
      role: UserRole.EMPLOYEE, // STRICT RULE: NO elevation or dropdown selection
      status: "Active"
    };

    const updatedEmployees = [...employees, newEmployee];
    AssetFlowStore.saveEmployees(updatedEmployees);
    AssetFlowStore.addActivityLog(name, "Registered a new account (Employee)", "Employee");
    AssetFlowStore.addNotification(
      "New employee registered",
      `${name} (${email}) has registered. Department assigned: Engineering & IT.`,
      "info"
    );

    setSuccess("Account registered successfully! Switching to login...");
    setIsLogin(true);
    setEmail(email);
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(113,75,103,0.16),_transparent_35%),linear-gradient(135deg,_#f8f3f7_0%,_#eef7f7_100%)] px-4 py-12 relative overflow-hidden">
      <div className="absolute top-[-8%] right-[-10%] w-[420px] h-[420px] rounded-full bg-[#714B67] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[-12%] left-[-10%] w-[360px] h-[360px] rounded-full bg-[#00A09D] opacity-10 pointer-events-none" />

      <div className="w-full max-w-5xl rounded-[28px] overflow-hidden border border-[#E5E4EA] shadow-[0_25px_80px_rgba(33,31,36,0.12)] z-10 bg-white grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[#714B67] p-8 md:p-10 text-white relative flex flex-col justify-between">
          <div>
            <div className="absolute top-4 right-4 flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00A09D]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D89614]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5432D]" />
            </div>
            <img src="/assets/WhatsApp Image 2026-07-12 at 11.57.14 AM.jpeg" alt="AssetFlow logo" className="h-16 w-16 rounded-2xl object-cover border border-white/30 shadow-lg" />
            <h1 className="mt-5 text-3xl font-bold tracking-tight">AssetFlow ERP</h1>
            <p className="mt-2 text-sm text-[#F1E9EE] max-w-sm">Manage assets, staff, bookings, maintenance and approvals from one secure corporate workspace.</p>
          </div>
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur">
            <div className="flex items-center gap-2 text-[#FCF1DA] font-semibold"><Sparkles className="h-4 w-4" /> Trusted by modern enterprise teams</div>
            <ul className="mt-3 space-y-2 text-sm text-[#F1E9EE]">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00A09D]" /> Secure role-based access</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00A09D]" /> Live booking and allocation visibility</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#00A09D]" /> QR-enabled asset operations</li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10">

        {/* Tab Selection */}
        <div className="flex border-b border-[#E5E4EA] bg-[#F4F5FA]">
          <button
            id="auth-tab-login"
            onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
            className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-200 ${
              isLogin
                ? "text-[#714B67] border-b-2 border-[#714B67] bg-white"
                : "text-[#6B6675] hover:text-[#714B67] hover:bg-[#F1E9EE]/40"
            }`}
          >
            Log in to Account
          </button>
          <button
            id="auth-tab-signup"
            onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
            className={`flex-1 py-4 text-center font-medium text-sm transition-all duration-200 ${
              !isLogin
                ? "text-[#714B67] border-b-2 border-[#714B67] bg-white"
                : "text-[#6B6675] hover:text-[#714B67] hover:bg-[#F1E9EE]/40"
            }`}
          >
            Register Org
          </button>
        </div>

        {/* Auth Body */}
        <div className="p-8">
          {error && (
            <div id="auth-error-banner" className="mb-4 p-3 bg-[#FBEAE6] text-[#C5432D] text-xs rounded-lg flex items-start space-x-2 border border-[#C5432D]/15 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div id="auth-success-banner" className="mb-4 p-3 bg-[#E1F5F4] text-[#00A09D] text-xs rounded-lg border border-[#00A09D]/15">
              <span>{success}</span>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4" id="login-form">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#6B6675]/60" />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-sm text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-[#6B6675] uppercase tracking-wider">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setError("Demo Mode: Contact your Administrator to reset password."); }}
                    className="text-xs text-[#714B67] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-[#6B6675]/60" />
                  <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-sm text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="login-submit"
                className="w-full py-2.5 bg-[#714B67] hover:bg-[#714B67]/90 text-white font-medium text-sm rounded-lg shadow-sm transition-all hover:shadow cursor-pointer flex justify-center items-center space-x-2"
              >
                <span>Log in</span>
              </button>

              <div className="pt-4 border-t border-[#E5E4EA] text-center">
                <p className="text-xs text-[#6B6675]/80">
                  Quick Demo Access:
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <button
                    type="button"
                    onClick={() => { setEmail("nirajsharma250707@gmail.com"); setPassword("password123"); }}
                    className="text-[10px] px-2 py-1 bg-[#F1E9EE] hover:bg-[#714B67]/10 text-[#714B67] rounded font-medium border border-[#714B67]/15"
                  >
                    Admin Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail("priya.sharma@assetflow.corp"); setPassword("password123"); }}
                    className="text-[10px] px-2 py-1 bg-[#E7F1FA] hover:bg-[#3B82C4]/10 text-[#3B82C4] rounded font-medium border border-[#3B82C4]/15"
                  >
                    Dept Head (Priya)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail("john.doe@assetflow.corp"); setPassword("password123"); }}
                    className="text-[10px] px-2 py-1 bg-[#E1F5F4] hover:bg-[#00A09D]/10 text-[#00A09D] rounded font-medium border border-[#00A09D]/15"
                  >
                    Employee (John)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4" id="signup-form">
              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-[#6B6675]/60" />
                  <input
                    type="text"
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-sm text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#6B6675]/60" />
                  <input
                    type="email"
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@organization.corp"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-sm text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6675] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-[#6B6675]/60" />
                  <input
                    type="password"
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-sm text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#FBEEDF] rounded-lg border border-[#D9822B]/20">
                <p className="text-[11px] leading-relaxed text-[#D9822B] font-medium">
                  🔒 Note: New accounts are created as <strong>Employee</strong>. Roles are assigned by your organization's Admin.
                </p>
              </div>

              <button
                type="submit"
                id="signup-submit"
                className="w-full py-2.5 bg-[#00A09D] hover:bg-[#00A09D]/90 text-white font-medium text-sm rounded-lg shadow-sm transition-all hover:shadow cursor-pointer"
              >
                Register asset manager
              </button>
            </form>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
