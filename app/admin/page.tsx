"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (employee?.role !== "admin") {
        router.replace("/attendance");
        return;
      }

      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking Admin Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white p-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-4 text-gray-400">
        Admin panel is now working.
      </p>
    </div>
  );
}