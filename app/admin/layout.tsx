"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // install if needed

export default function AdminLayout({ children }: any) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: "Dashboard", path: "/admin" },
    { name: "Attendance", path: "/admin/attendance" },
    { name: "Leave", path: "/admin/leave" },
    { name: "Setup", path: "/admin/schedule" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f0f13] text-white">

      {/* 🔥 MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a1a22] flex items-center px-4 z-50 border-b border-white/5">
        <button onClick={() => setOpen(true)}>
          <Menu size={24} />
        </button>
        <h2 className="ml-4 font-semibold">HR Admin</h2>
      </div>

      {/* 🔥 MOBILE SIDEBAR */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        } md:hidden`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a1a22] p-6 space-y-6 transform transition-transform z-50
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-col`}
      >
        {/* Close button (mobile) */}
        <div className="flex justify-between items-center md:hidden">
          <h2 className="text-xl font-bold">HR Admin</h2>
          <button onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Desktop Title */}
        <h2 className="hidden md:block text-2xl font-bold">
          HR Admin
        </h2>

        {menu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setOpen(false)}
            className={`px-4 py-2 rounded-lg ${
              pathname === item.path
                ? "bg-blue-600"
                : "hover:bg-[#2a2a35]"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 mt-14 md:mt-0">
        {children}
      </main>

    </div>
  );
}