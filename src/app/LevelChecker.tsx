"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LevelChecker() {
  const router = useRouter();

  const fetchPayload = async () => {
    try {
      const res = await fetch("/api/getPayload", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        router.replace("/"); // token ไม่ valid → redirect
        return;
      }

      const data = await res.json();
      const level = Number(data.level) || 0;
      const currentPath = window.location.pathname;
      const redirect = localStorage.getItem("redirectUrl");

      console.log("LevelChecker: level =", level, "redirect =", redirect);

      // ถ้าอยู่หน้า backenduser ต้อง level >50
      if (currentPath === "/backenduser" && level <= 50) {
        router.replace("/"); // redirect ไปหน้า / แต่ไม่ลบ redirectUrl
        return;
      }

      // หน้าอื่น ๆ
      if (level > 50) return; // >50 → อยู่ต่อได้
      if (level === 50 && redirect) return; // =50 + redirect → อยู่ต่อได้

      // level <50 → redirect ไปหน้า / แต่ไม่ลบ redirectUrl
      if (level < 50) {
        router.replace("/");
        return;
      }

    } catch (err) {
      console.error(err);
      router.replace("/");
    }
  };

  useEffect(() => {
    fetchPayload();
  }, []);

  return null;
}
