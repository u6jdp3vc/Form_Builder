"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface MenuItem {
    name: string;
    path: string;
    minLevel: number;
}

interface Payload {
    username: string;
    level: number;
    role: string;
}

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [level, setLevel] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
                await fetch("/api/logout", { method: "POST" });
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

    const menuItems: MenuItem[] = [
        { name: "Frontend", path: "/frontenduser", minLevel: 50 },
        { name: "Backend", path: "/backenduser", minLevel: 51 },
    ];

    return (
        <>
            <header className="bg-blue-900 text-white w-full shadow-md flex items-center justify-between px-6 py-6">
                <button
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    className="flex flex-col justify-between h-6 w-8 px-1 py-1 cursor-pointer"
                >
                    <span className="block w-full h-0.5 bg-white"></span>
                    <span className="block w-full h-0.5 bg-white"></span>
                    <span className="block w-full h-0.5 bg-white"></span>
                </button>

                <div className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer">
                    <img
                        src="https://dth.travel/wp-content/uploads/2025/07/White_wo_FD.png"
                        alt="Logo"
                        className="h-12 w-auto"
                    />
                </div>
            </header>

            <div
                className={`fixed top-0 left-0 h-screen w-64 bg-blue-900 text-white shadow-lg transform transition-transform duration-300 z-50 flex flex-col ${drawerOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex justify-end p-4">
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="text-white text-2xl font-bold cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                <nav className="flex-1 flex flex-col px-4 space-y-2">
                    {menuItems.map((item) => {
                        const disabled =
                            (item.name === "Frontend" && (level ?? 0) < 50) ||
                            (item.name === "Backend" && (level ?? 0) <= 50);

                        return (
                            <a
                                key={item.path}
                                href={disabled ? "#" : item.path} // ถ้า disabled จะไม่ไปไหน
                                onClick={(e) => {
                                    if (disabled) {
                                        e.preventDefault(); // ป้องกัน navigation
                                        Swal.fire({
                                            icon: "warning",
                                            title: "Insufficient permissions.",
                                            text:
                                                item.name === "Frontend"
                                                    ? "You must have a level of 50 or higher to access the Frontend."
                                                    : "You must have a level greater than 50 to access the Backend.",
                                        });
                                        return;
                                    }

                                    // ป้องกัน default navigation เพื่อให้ router.push ทำงาน
                                    e.preventDefault();

                                    // แสดง success Swal ก่อน redirect
                                    Swal.fire({
                                        icon: "success",
                                        title: `Logging in to ${item.name}`,
                                        text: "Redirecting to the next page...",
                                        timer: 1200,
                                        showConfirmButton: false,
                                        timerProgressBar: true,
                                    }).then(() => {
                                        router.push(item.path);
                                        setDrawerOpen(false);
                                    });
                                }}
                                className={`block px-4 py-2 rounded hover:bg-blue-700 cursor-pointer ${pathname === item.path ? "bg-blue-800 font-bold" : ""
                                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {item.name}
                            </a>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {drawerOpen && <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)} />}
        </>
    );
}
