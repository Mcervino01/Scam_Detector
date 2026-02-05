"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "client", passcode: passcode.trim() }),
      });

      if (res.ok) {
        router.push("/chat");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid passcode");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "admin", email: adminEmail, password: adminPassword }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ScamShield</h1>
          <p className="text-blue-200/80 text-sm">
            AI-Powered Scam Detection. Check suspicious texts, URLs, emails, and screenshots instantly.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
          {!showAdminLogin ? (
            <>
              <form onSubmit={handlePasscodeLogin} className="space-y-4">
                <div>
                  <label htmlFor="passcode" className="block text-sm font-medium text-blue-100 mb-1.5">
                    Enter your access code
                  </label>
                  <input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Your passcode"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !passcode.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? "Verifying..." : "Start Scanning"}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <button
                  onClick={() => {
                    setShowAdminLogin(true);
                    setError("");
                  }}
                  className="text-xs text-blue-300/60 hover:text-blue-200 transition-colors"
                >
                  Admin Login
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">Admin Login</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setError("");
                  }}
                  className="text-xs text-blue-300/60 hover:text-blue-200"
                >
                  Back to passcode login
                </button>
              </div>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "\uD83D\uDCDD", label: "Text & Email" },
            { icon: "\uD83D\uDD17", label: "URLs & Links" },
            { icon: "\uD83D\uDCF7", label: "Screenshots" },
          ].map((feature) => (
            <div key={feature.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <p className="text-xs text-blue-200/70">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
