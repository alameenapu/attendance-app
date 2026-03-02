"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LeaveManagement() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const perPage = 6;

    useEffect(() => {
        fetchLeaves();
    }, []);

    async function fetchLeaves() {
        const { data } = await supabase
            .from("leave_applications")
            .select("*, employees(name,email,avatar_url)")
            .order("created_at", { ascending: false });

        setLeaves(data || []);
    }

    async function updateStatus(leave: any, status: string) {

        // 1️⃣ Update leave status
        await supabase
            .from("leave_applications")
            .update({ status })
            .eq("id", leave.id);

        // 2️⃣ Insert notification
        await supabase.from("notifications").insert({
            employee_id: leave.employee_id,
            title: "Leave Application Update",
            message: `Your leave request from ${leave.start_date} to ${leave.end_date} has been ${status}.`,
        });

        // 3️⃣ Send Email
        await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: leave.employees.email,
                subject: "Leave Application Status",
                message: `Your leave request from ${leave.start_date} to ${leave.end_date} has been ${status}.`,
            }),
        });

        fetchLeaves();
    }

    const filtered = leaves.filter(
        (leave) =>
            leave.employees?.name
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            leave.employees?.email
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / perPage);

    const paginated = filtered.slice(
        (page - 1) * perPage,
        page * perPage
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f13] to-[#1a1a22] text-white p-6 md:p-10">

            <h1 className="text-3xl font-bold mb-8">
                Leave Management
            </h1>

            {/* SEARCH */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search employee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-[#1f1f28] px-4 py-2 rounded-lg w-full md:w-80"
                />
            </div>

            {/* LEAVE CARDS (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {paginated.map((leave) => (
                    <div
                        key={leave.id}
                        className="bg-[#1c1c24] p-6 rounded-2xl shadow-xl border border-white/5 hover:scale-[1.02] transition"
                    >

                        {/* Profile */}
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={
                                    leave.employees?.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${leave.employees?.name}`
                                }
                                className="w-12 h-12 rounded-full"
                            />

                            <div>
                                <div className="font-semibold">
                                    {leave.employees?.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {leave.employees?.email}
                                </div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="text-sm text-gray-300 mb-2">
                            From: {leave.start_date}
                        </div>

                        <div className="text-sm text-gray-300 mb-2">
                            To: {leave.end_date}
                        </div>

                        {/* Reason */}
                        <div className="text-sm text-gray-400 mb-4">
                            {leave.reason}
                        </div>

                        {/* Status Badge */}
                        <div className="mb-4">
                            <StatusBadge status={leave.status} />
                        </div>

                        {/* ACTION BUTTONS */}
                        {leave.status === "pending" && (
                            <div className="flex gap-3">

                                <button
                                    onClick={() => updateStatus(leave, "approved")}
                                    className="flex-1 bg-green-600 py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Approve
                                </button>

                                <button
                                    onClick={() =>
                                        updateStatus(leave, "rejected")
                                    }
                                    className="flex-1 bg-red-600 py-2 rounded-lg hover:bg-red-700 transition"
                                >
                                    Reject
                                </button>

                            </div>
                        )}

                    </div>
                ))}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-4 py-2 rounded-lg ${page === i + 1
                                ? "bg-blue-600"
                                : "bg-[#2a2a35]"
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

        </div>
    );
}

function StatusBadge({ status }: any) {
    if (status === "approved")
        return (
            <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs">
                Approved
            </span>
        );

    if (status === "rejected")
        return (
            <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs">
                Rejected
            </span>
        );

    return (
        <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-xs">
            Pending
        </span>
    );
}