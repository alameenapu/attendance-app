"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Map = dynamic(() => import("../attendance/map"), { ssr: false });

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  useEffect(() => {
    fetchSchedule();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  // 🔄 Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAttendance(selectedDate);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  async function fetchSchedule() {
    const { data } = await supabase
      .from("work_schedule")
      .select("*")
      .limit(1)
      .single();

    setSchedule(data);
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .neq("role", "admin");

    setEmployees(data || []);
  }

  async function fetchAttendance(date: string) {
    const { data } = await supabase
      .from("attendance")
      .select("*, employees(name,email,avatar_url)")
      .eq("attendance_date", date);

    setAttendance(data || []);
  }

  // 🟢 STATUS
  function calculateStatus(record: any) {
    if (!schedule || !record.time_in) return "-";

    const startTime = new Date(`${selectedDate}T${schedule.start_time}`);
    const graceTime = new Date(
      startTime.getTime() + schedule.grace_minutes * 60000
    );

    return new Date(record.time_in) > graceTime
      ? "Late"
      : "On-Time";
  }

  // ⏱ WORKING HOURS
  function calculateWorkingHours(record: any) {
    if (!record.time_out) return "-";

    const hours =
      (new Date(record.time_out).getTime() -
        new Date(record.time_in).getTime()) /
      (1000 * 60 * 60);

    return hours.toFixed(2);
  }

  // 🟡 OVERTIME
  function calculateOvertime(record: any) {
    if (!schedule || !record.time_out) return "-";

    const overtimeStart = new Date(
      `${selectedDate}T${schedule.overtime_after}`
    );

    if (new Date(record.time_out) <= overtimeStart)
      return "-";

    const overtime =
      (new Date(record.time_out).getTime() -
        overtimeStart.getTime()) /
      (1000 * 60 * 60);

    return overtime.toFixed(2);
  }

  // 🚫 ABSENT
  const presentIds = attendance.map((a) => a.employee_id);

  const absentEmployees = employees.filter(
    (emp) => !presentIds.includes(emp.id)
  );

  // 📊 COUNTS
  const lateCount = attendance.filter(
    (r) => calculateStatus(r) === "Late"
  ).length;

  const overtimeCount = attendance.filter(
    (r) => calculateOvertime(r) !== "-"
  ).length;

  // 📁 EXPORT EXCEL
  function exportToExcel() {
    const data = attendance.map((r) => ({
      Name: r.employees?.name,
      Email: r.employees?.email,
      TimeIn: r.time_in,
      TimeOut: r.time_out || "-",
      Status: calculateStatus(r),
      WorkingHours: calculateWorkingHours(r),
      Overtime: calculateOvertime(r),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([buffer], {
      type: "application/octet-stream",
    });

    saveAs(file, `Attendance-${selectedDate}.xlsx`);
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white p-8">

      <h1 className="text-3xl font-bold mb-6">
        Attendance Monitoring
      </h1>

      {/* DATE + EXPORT */}
      <div className="flex justify-between items-center mb-8">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(e.target.value)
          }
          className="bg-[#1c1c24] px-4 py-2 rounded"
        />

        <button
          onClick={exportToExcel}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        <Card title="Present" value={attendance.length} />
        <Card title="Late" value={lateCount} />
        <Card title="Overtime" value={overtimeCount} />
        <Card title="Absent" value={absentEmployees.length} />

      </div>

      {/* TABLE + MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TABLE */}
        <div className="bg-[#1c1c24] p-6 rounded-xl overflow-auto">

          <h2 className="text-xl mb-4 font-semibold">
            Employee Status
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th>Name</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
                <th>Hours</th>
                <th>OT</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 hover:bg-[#2a2a35]"
                >
                  <td>{r.employees?.name}</td>
                  <td>
                    {new Date(r.time_in).toLocaleTimeString()}
                  </td>
                  <td>
                    {r.time_out
                      ? new Date(r.time_out).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td
                    className={
                      calculateStatus(r) === "Late"
                        ? "text-red-400"
                        : "text-green-400"
                    }
                  >
                    {calculateStatus(r)}
                  </td>
                  <td>{calculateWorkingHours(r)}</td>
                  <td className="text-yellow-400">
                    {calculateOvertime(r)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* MAP */}
        <div className="bg-[#1c1c24] p-6 rounded-xl">

          <h2 className="text-xl mb-4 font-semibold">
            Live GPS Map
          </h2>

          <Map attendance={attendance} />

        </div>

      </div>

      {/* ABSENT LIST */}
      <div className="mt-8 bg-[#1c1c24] p-6 rounded-xl">
        <h2 className="text-xl mb-4 font-semibold">
          Absent Employees
        </h2>

        {absentEmployees.length === 0 ? (
          <p className="text-green-400">
            Everyone Present Today 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {absentEmployees.map((emp) => (
              <li
                key={emp.id}
                className="bg-[#2a2a35] p-3 rounded"
              >
                {emp.name} ({emp.email})
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="bg-[#1c1c24] p-6 rounded-xl">
      <div className="text-gray-400 text-sm mb-2">
        {title}
      </div>
      <div className="text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}