"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function AccessDeniedPage() {
  const router = useRouter();

  useEffect(() => {
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "คุณไม่มีสิทธิ์เข้าหน้านี้",
      confirmButtonText: "OK"
    }).then(async () => {
      // เรียก API ลบ token
      await fetch("/api/logout", { method: "POST" });

      // redirect ไปหน้า login
      router.replace("/"); 
    });
  }, [router]);

  return null;
}
