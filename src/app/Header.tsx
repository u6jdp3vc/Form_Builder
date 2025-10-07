"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { LogOut } from "lucide-react"; // ✅ ใช้ icon logout จาก lucide-react (shadcn/ui ใช้ lib นี้)

interface Payload {
  username: string;
  level: number;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    if (pathname === "/") return;

    const fetchPayload = async () => {
      try {
        const res = await fetch("/api/getPayload", { credentials: "include" });

        if (res.status === 401) {
          router.replace("/"); // redirect login
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch payload");

        const data: Payload = await res.json();
        setLevel(data.level);
      } catch (err) {
        console.error(err);
        router.replace("/"); // fallback redirect login
      }
    };

    fetchPayload();
  }, [pathname, router]);

  if (pathname === "/") return null;

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        icon: "question",
        title: "Are you sure?",
        text: "Do you want to log out?",
        showCancelButton: true,
        confirmButtonText: "Yes, log out.",
        cancelButtonText: "Cancel.",
      });

      if (result.isConfirmed) {
        // เรียก API logout เพื่อ clear cookie
        await fetch("/api/logout", { method: "POST" });

        localStorage.removeItem("redirectUrl");

        // แสดง success และ redirect
        await Swal.fire({
          icon: "success",
          title: "Logged out successfully.",
          timer: 1200,
          showConfirmButton: false,
          timerProgressBar: true,
        });

        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "An error occurred.",
        text: "Failed to log out.",
      });
    }
  };

  return (
    <header className="bg-blue-900 text-white w-full shadow-md flex items-center justify-between px-6 py-5 relative">
      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full p-2 transition cursor-pointer"
        title="Logout"
      >
        <LogOut size={24} />
      </button>

      {/* Center logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer">
        <img
          src="https://dth.travel/wp-content/uploads/2025/07/White_wo_FD.png"
          alt="Logo"
          className="h-12 w-auto"
        />
      </div>
    </header>
  );
}
