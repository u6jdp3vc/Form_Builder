"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPageClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // อ่าน redirect param หรือค่าเก่าจาก localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || localStorage.getItem("redirectUrl");
    if (redirect) {
      setRedirectUrl(redirect);
      localStorage.setItem("redirectUrl", redirect);
    }
  }, []);

  // ตรวจสอบ login ตอน mount
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("/api/getPayload", { credentials: "include" });
        if (!res.ok) return setLoading(false);

        const data = await res.json();
        const level = Number(data.level) || 0;
        const redirect = localStorage.getItem("redirectUrl") || redirectUrl;
        const path = window.location.pathname;

        if (redirect && level >= 50)
          return (window.location.href = decodeURIComponent(redirect));

        if (level > 50 && path !== "/backenduser")
          return router.replace("/backenduser");

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    checkLogin();
  }, [redirectUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, redirect: redirectUrl }),
      });
      const data = await res.json();

      if (!data.success)
        return Swal.fire("Login Failed", data.message || "An error occurred.", "error");

      rememberMe
        ? (localStorage.setItem("rememberUsername", username),
           localStorage.setItem("rememberPassword", password))
        : (localStorage.removeItem("rememberUsername"),
           localStorage.removeItem("rememberPassword"));

      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Redirecting...",
        timer: 1200,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      const redirect = localStorage.getItem("redirectUrl") || redirectUrl;
      const level = Number(data.level) || 0;

      if (redirect && level >= 50)
        window.location.href = decodeURIComponent(redirect);
      else if (level > 50)
        window.location.href = "/backenduser";
      else
        window.location.href = "/";
    } catch {
      Swal.fire("Error", "An error occurred during login.", "error");
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900">
      <form
        onSubmit={handleLogin}
        className="bg-blue-500/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-96 flex flex-col items-center"
      >
        <img
          src="https://dth.travel/wp-content/uploads/2025/07/White_wo_FD.png"
          alt="Logo"
          className="w-40 mb-6"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-blue-100 text-blue-900"
        />
        <div className="w-full mb-2 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 bg-blue-100 text-blue-900 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <label className="self-start mb-4 flex items-center space-x-2 text-white">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Remember Password</span>
        </label>
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition hover:-translate-y-1 cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
}
