"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LevelChecker() {
  const router = useRouter();

  useEffect(() => {
    const checkLevel = async () => {
      try {
        const res = await fetch("/api/getPayload", { cache: "no-store", credentials: "include" });
        if (!res.ok) return router.replace("/");

        const { level } = await res.json();
        const currentPath = window.location.pathname;
        const redirect = localStorage.getItem("redirectUrl");
        const userLevel = Number(level) || 0;

        if (currentPath === "/backenduser" && userLevel <= 50)
          return router.replace("/");

        if (userLevel > 50 || (userLevel === 50 && redirect))
          return; // อยู่ต่อได้

        router.replace("/");
      } catch {
        router.replace("/");
      }
    };

    checkLevel();
  }, [router]);

  return null;
}
