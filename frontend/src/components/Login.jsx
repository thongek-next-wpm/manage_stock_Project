import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LOGO_URL = `${process.env.PUBLIC_URL}/LOGO%20CYN.png`;

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check session on mount by calling backend endpoint
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && data?.user) {
            // if backend supplies emailVerified or similar flag, obey it; otherwise assume verified
            const emailVerified = data.user.emailVerified ?? true;
            if (emailVerified) {
              const role = (data.user.role || "").toString().trim();
              const isAdmin = role === "admin" || role === "admn";
              if (isAdmin) navigate("/admin");
              else navigate("/map");
            }
          }
        }
      } catch (err) {
        // network or server error; keep on login page
        console.warn("Session check failed:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg("");

    try {
      if (!identifier.trim() || !password.trim()) {
        setMsg("กรุณากรอกข้อมูลให้ครบถ้วน");
        setIsLoading(false);
        return;
      }

      // Send credentials to server endpoint. Backend should accept identifier (email or phone)
      // and return JSON: { success: true, user: { role, emailVerified, ... }, message, token }
      const payload = { identifier: identifier.trim(), password };
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to parse message from server
        let body = null;
        try {
          body = await res.json();
        } catch (e) {
          /* ignore */
        }
        const serverMsg =
          body?.message || "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่";
        setMsg(serverMsg);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (!data?.success) {
        setMsg(data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        setIsLoading(false);
        return;
      }

      const user = data.user || {};
      const emailVerified = user.emailVerified ?? true;
      if (!emailVerified) {
        setMsg("กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ");
        setIsLoading(false);
        return;
      }

      // Optionally backend may have updated lastLogin; otherwise server should handle it.
      const role = (user.role || "").toString().trim();
      const isAdmin = role === "admin" || role === "admn";

      setMsg("เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...");
      setTimeout(() => {
        if (isAdmin) navigate("/admin");
        else navigate("/map");
      }, 800);
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
      if (error?.code === "auth/user-not-found")
        errorMessage = "ไม่พบผู้ใช้งาน กรุณาตรวจสอบอีเมลหรือเบอร์โทรศัพท์";
      else if (error?.code === "auth/wrong-password")
        errorMessage = "รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
      else if (error?.code === "auth/invalid-email")
        errorMessage = "รูปแบบอีเมลไม่ถูกต้อง";
      else if (error?.code === "auth/user-disabled")
        errorMessage = "บัญชีผู้ใช้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ";
      else if (error?.code === "auth/too-many-requests")
        errorMessage = "คำขอเข้าสู่ระบบมากเกินไป กรุณารอสักครู่แล้วลองใหม่";
      setMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-card">
          <div className="login-logo" aria-label="CYN Communication logo">
            <img src={LOGO_URL} alt="CYN Communication" />
          </div>
          <h2 className="login-title">เข้าสู่ระบบ</h2>
          <p className="login-subtitle">
            กรุณาเข้าสู่ระบบเพื่อใช้งานระบบบริหารจัดการคลังสินค้า
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-field">
              <label className="form-label" htmlFor="identifier">
                อีเมลหรือเบอร์โทรศัพท์
              </label>
              <input
                id="identifier"
                className="text-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="อีเมลหรือเบอร์โทรศัพท์"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="password">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                className="text-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรุณากรอกรหัสผ่าน"
                required
              />
            </div>

            <div className="login-options">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>จดจำการเข้าสู่ระบบ</span>
              </label>
            </div>

            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <svg className="icon-lock" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    opacity="0.3"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    opacity="0.8"
                  />
                </svg>
              ) : (
                <svg
                  className="icon-lock"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17 8h-1V6a4 4 0 10-8 0v2H7a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-8a2 2 0 00-2-2zm-6 7.73V17a1 1 0 102 0v-1.27a2 2 0 10-2 0zM10 6a2 2 0 114 0v2h-4V6z" />
                </svg>
              )}
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            {msg && (
              <div
                className={`alert ${
                  msg.includes("สำเร็จ") ? "alert-success" : "alert-error"
                }`}
              >
                {msg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export const logout = async () => {
  try {
    // Ask backend to destroy session / cookie
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch (error) {
    console.warn("Logout request failed, continuing local cleanup", error);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }
};
