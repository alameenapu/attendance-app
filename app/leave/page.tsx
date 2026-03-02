"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LeavePage() {
  const [user, setUser] = useState<any>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      setUser(data.user);
    }
    getUser();
  }, []);

  async function applyLeave() {
    if (!startDate || !endDate || !reason)
      return alert("Fill all fields");

    await supabase.from("leave_applications").insert({
      employee_id: user.id,
      start_date: startDate,
      end_date: endDate,
      reason,
      status: "pending",
    });

    alert("Leave Applied Successfully ✅");
    router.push("/attendance");
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex justify-center items-center p-6">

      <div className="bg-[#1c1c24] p-8 rounded-2xl w-full max-w-md space-y-4">

        <h1 className="text-2xl font-bold text-center mb-6">
          Apply Leave
        </h1>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-[#2a2a35] px-4 py-2 rounded"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full bg-[#2a2a35] px-4 py-2 rounded"
        />

        <textarea
          placeholder="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-[#2a2a35] px-4 py-2 rounded"
        />

        <button
          onClick={applyLeave}
          className="w-full bg-blue-600 py-3 rounded-lg"
        >
          Submit Leave Request
        </button>

      </div>

    </div>
  );
}