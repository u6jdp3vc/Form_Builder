"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { LogOut } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    if (pathname === "/") return;

    const fetchPayload = async () => {
      try {
        const res = await fetch("/api/getPayload", { credentials: "include" });
        if (!res.ok) return router.replace("/");
        const data = await res.json();
        setLevel(data.level);
      } catch {
        router.replace("/");
      }
    };

    fetchPayload();
  }, [pathname, router]);

  if (pathname === "/") return null;

  const handleLogout = async () => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Log out?",
      text: "Do you want to log out?",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      await fetch("/api/logout", { method: "POST" });
      localStorage.removeItem("redirectUrl");

      await Swal.fire({
        icon: "success",
        title: "Logged out successfully.",
        timer: 1200,
        showConfirmButton: false,
        timerProgressBar: true,
      });

      window.location.href = "/";
    } catch {
      Swal.fire("Error", "Failed to log out.", "error");
    }
  };

  return (
    <header className="bg-blue-900 text-white w-full shadow-md flex items-center justify-between px-6 py-5 relative">
      <button
        onClick={handleLogout}
        className="flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full p-2 transition cursor-pointer"
        title="Logout"
      >
        <LogOut size={24} />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 cursor-pointer">
        <img
          src="https://dth.travel/wp-content/uploads/2025/07/White_wo_FD.png"
          alt="Logo"
          className="h-12 w-auto"
        />
      </div>
    </header>
  );
}
