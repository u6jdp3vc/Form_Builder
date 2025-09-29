"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LevelChecker() {
  const router = useRouter();

  const fetchPayload = async () => {
    try {
      const res = await fetch("/api/getPayload", { cache: "no-store" });
      if (!res.ok) {
        router.replace("/"); // ถ้า token ไม่ valid → redirect
        return;
      }

      const data = await res.json();
      console.log("Payload:", data);

      if (!data.level || data.level <= 50) {
        router.replace("/"); // redirect ถ้า level ไม่ถึง
      }
    } catch (err) {
      console.error(err);
      router.replace("/"); // error → redirect
    }
  };

  useEffect(() => {
    fetchPayload(); // check ตอน refresh / mount
  }, []);

  return null;
}
