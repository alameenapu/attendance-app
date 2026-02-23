"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./map"), { ssr: false });

export default function AdminPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const today = new Date().toISOString().split("T")[0];

  // 🔐 Check Admin Access
  useEffect(() => {
    async function checkAdmin() {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/login");
        return;
      }

      

      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      console.log("Auth User:", authData.user);
      console.log("Employee Record:", employee);

      if (!employee || employee.role !== "admin") {
        router.push("/");
        return;
      }

      setChecking(false);
      fetchAllData();
    }

    checkAdmin();
  }, []);

  async function fetchAllData() {
    await Promise.all([
      fetchEmployees(),
      fetchTodayAttendance(),
      fetchLeaves(),
    ]);
  }

    async function fetchEmployees() {
        const { data } = await supabase.from("employees").select("*");
        setEmployees(data || []);
    }

  async function fetchTodayAttendance() {
    const { data, error } = await supabase
      .from("attendance")
      .select("*, employees(name,email,avatar_url)")
      .eq("attendance_date", today);
        console.log("All attendance dates:", data);
        console.log("Today variable:", today);

    setTodayAttendance(data || []);
  }

  async function fetchLeaves() {
    const { data } = await supabase
      .from("leave_applications")
      .select("*, employees(name,email)")
      .order("created_at", { ascending: false });

    setLeaveRequests(data || []);
  }

    // ⏳ Prevent Flashing Before Role Check
    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] text-white">
                Checking admin access...
            </div>
        );
    }

    async function updateRole(id: string, newRole: string) {
        await supabase
            .from("employees")
            .update({ role: newRole })
            .eq("id", id);

        fetchEmployees();
    }
    async function updateLeaveStatus(id: string, status: string) {
        await supabase
            .from("leave_applications")
            .update({ status })
            .eq("id", id);

        fetchLeaves();
    }

    return (
  <div className="min-h-screen bg-[#0f0f13] text-white p-8">

    <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

    {/* TOP SECTION: Employees + Map */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

      {/* LEFT SIDE - EMPLOYEE TABLE */}
      <div className="bg-[#1c1c24] rounded-xl p-6 overflow-auto">

        <h2 className="text-xl font-semibold mb-4">Employees</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="text-left py-2">Name</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className="border-b border-white/5 hover:bg-[#2a2a35] transition"
              >
                <td className="py-3">{emp.name}</td>
                <td>{emp.email}</td>
                <td>
                  <select
                    value={emp.role}
                    onChange={(e) =>
                      updateRole(emp.id, e.target.value)
                    }
                    className="bg-[#2a2a35] px-2 py-1 rounded text-white"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* RIGHT SIDE - MAP */}
      <div className="bg-[#1c1c24] rounded-xl p-6">

        <h2 className="text-xl font-semibold mb-4">
          Today’s Attendance Map
        </h2>

        <Map attendance={todayAttendance} />

      </div>

    </div>

    {/* BOTTOM SECTION - LEAVE TABLE FULL WIDTH */}
    <div className="bg-[#1c1c24] rounded-xl p-6">

      <h2 className="text-xl font-semibold mb-4">
        Leave Applications
      </h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-gray-400">
            <th className="text-left py-2">Name</th>
            <th className="text-left py-2">From</th>
            <th className="text-left py-2">To</th>
            <th className="text-left py-2">Reason</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {leaveRequests.map((leave) => (
            <tr
              key={leave.id}
              className="border-b border-white/5 hover:bg-[#2a2a35] transition"
            >
              <td className="py-3">
                {leave.employees?.name}
              </td>
              <td>{leave.start_date}</td>
              <td>{leave.end_date}</td>
              <td>{leave.reason}</td>
              <td>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    leave.status === "approved"
                      ? "bg-green-600"
                      : leave.status === "rejected"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {leave.status}
                </span>
              </td>
              <td className="space-x-2">
                <button
                  onClick={() =>
                    updateLeaveStatus(leave.id, "approved")
                  }
                  className="bg-green-600 px-3 py-1 rounded text-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    updateLeaveStatus(leave.id, "rejected")
                  }
                  className="bg-red-600 px-3 py-1 rounded text-xs"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>

  </div>
);
}