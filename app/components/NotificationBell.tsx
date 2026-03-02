"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationBell({ userId }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("employee_id", userId)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
  }

  async function markAsRead(id: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    fetchNotifications();
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">

      <button onClick={() => setOpen(!open)}>
        🔔 {unreadCount > 0 && (
          <span className="bg-red-600 px-2 py-1 rounded-full text-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-[#1c1c24] rounded-xl p-4 shadow-xl">

          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-2 mb-2 rounded cursor-pointer ${
                  n.is_read ? "bg-[#2a2a35]" : "bg-[#2a2a35]/60"
                }`}
              >
                <div className="text-sm font-semibold">
                  {n.title}
                </div>
                <div className="text-xs text-gray-400">
                  {n.message}
                </div>
              </div>
            ))
          )}

        </div>
      )}
    </div>
  );
}
