"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberUsername");
    const savedPassword = localStorage.getItem("rememberPassword");
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    const checkLogin = async () => {
      try {
        const res = await fetch("/api/getPayload", { credentials: "include" });
        if (res.status === 401) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch payload");
        const data = await res.json();
        const level = data.level || 0;
        if (level > 50) router.replace("/backenduser");
        else if (level === 50) router.replace("/frontenduser");
        else setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    checkLogin();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (rememberMe) {
          localStorage.setItem("rememberUsername", username);
          localStorage.setItem("rememberPassword", password);
        } else {
          localStorage.removeItem("rememberUsername");
          localStorage.removeItem("rememberPassword");
        }

        await Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Login successful. Redirecting to the next page...",
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        // ✅ เช็คว่ามี redirect query param ไหม
        if (redirect) {
          router.replace(redirect); // ใช้ router.replace ดีกว่า window.location.href
        } else if (data.redirectUrl) {
          window.location.href = data.redirectUrl; // หรือ router.replace(data.redirectUrl)
        } else {
          router.replace("/frontenduser"); // fallback
        }
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: data.message || "An error occurred.",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred during login.",
      });
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900">
      <form
        onSubmit={handleLogin}
        className="bg-blue-500/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-96 max-w-full flex flex-col items-center"
      >
        <div className="mb-6 flex justify-center">
          <img
            src="https://dth.travel/wp-content/uploads/2025/07/White_wo_FD.png"
            alt="Login Header"
            className="w-32 sm:w-36 md:w-40 ml-10"
          />
        </div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-100 text-blue-900 transition"
        />
        <div className="w-full mb-2 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-100 text-blue-900 transition pr-10"
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
          Remember Password
        </label>
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition transform hover:-translate-y-1 cursor-pointer"
        >
          Login
        </button>
      </form>
    </div>
  );
}
