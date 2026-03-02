"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: any) {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", path: "/admin" },
    { name: "Attendance", path: "/admin/attendance" },
    { name: "Leave", path: "/admin/leave" },
    { name: "Setup", path: "/admin/schedule" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f0f13] text-white">

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1a22] p-6 space-y-6">

        <h2 className="text-2xl font-bold">
          HR Admin
        </h2>

        {menu.map((item) => (
          <Link
            key={item.path}
            href={item.path}
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

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>

    </div>
  );
}