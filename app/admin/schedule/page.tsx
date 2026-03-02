"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSetupPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 5;

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [overtimeAfter, setOvertimeAfter] = useState("18:00");
  const [scheduleId, setScheduleId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredEmployees(filtered);
    setPage(1);
  }, [search, employees]);

  async function fetchSchedule() {
    const { data } = await supabase
      .from("work_schedule")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setScheduleId(data.id);
      setStartTime(data.start_time);
      setEndTime(data.end_time);
      setGraceMinutes(data.grace_minutes);
      setOvertimeAfter(data.overtime_after);
    }
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    setEmployees(data || []);
  }

  async function saveSchedule() {
    if (scheduleId) {
      await supabase
        .from("work_schedule")
        .update({
          start_time: startTime,
          end_time: endTime,
          grace_minutes: graceMinutes,
          overtime_after: overtimeAfter,
        })
        .eq("id", scheduleId);
    } else {
      await supabase.from("work_schedule").insert({
        start_time: startTime,
        end_time: endTime,
        grace_minutes: graceMinutes,
        overtime_after: overtimeAfter,
      });
    }

    alert("Schedule Saved ✅");
  }

  async function updateRole(id: string, role: string) {
    await supabase.from("employees").update({ role }).eq("id", id);
    fetchEmployees();
  }

  async function deleteEmployee(id: string) {
    if (!confirm("Are you sure you want to delete this employee?"))
      return;

    await supabase.from("employees").delete().eq("id", id);
    fetchEmployees();
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white p-10 space-y-12">

      <h1 className="text-3xl font-bold text-center">
        Admin Setup Panel
      </h1>

      {/* ================= CENTERED SCHEDULE PANEL ================= */}
      <div className="flex justify-center">
        <div className="bg-[#1c1c24] p-8 rounded-2xl w-full max-w-xl shadow-lg">

          <h2 className="text-xl font-semibold mb-6 text-center">
            Work Schedule
          </h2>

          <div className="space-y-4">

            <Input label="Start Time" type="time" value={startTime} setValue={setStartTime} />
            <Input label="End Time" type="time" value={endTime} setValue={setEndTime} />
            <Input label="Grace Minutes" type="number" value={graceMinutes} setValue={setGraceMinutes} />
            <Input label="Overtime After" type="time" value={overtimeAfter} setValue={setOvertimeAfter} />

            <button
              onClick={saveSchedule}
              className="w-full bg-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Save Schedule
            </button>

          </div>
        </div>
      </div>

      {/* ================= ROLE MANAGEMENT ================= */}
      <div className="bg-[#1c1c24] p-8 rounded-2xl shadow-lg">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Employee Management
          </h2>

          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#2a2a35] px-4 py-2 rounded-lg w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="py-3 text-left">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedEmployees.map((emp) => (
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
                      className="bg-[#2a2a35] px-3 py-1 rounded"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  <td>
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1
                  ? "bg-blue-600"
                  : "bg-[#2a2a35]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
}

function Input({ label, type, value, setValue }: any) {
  return (
    <div>
      <label className="block text-gray-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) =>
          setValue(type === "number" ? Number(e.target.value) : e.target.value)
        }
        className="w-full bg-[#2a2a35] px-4 py-2 rounded-lg"
      />
    </div>
  );
}