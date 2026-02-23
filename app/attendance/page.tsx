"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  const today = new Date().toISOString().split("T")[0];

  const isChecked = todayRecord && !todayRecord.time_out;

  // 🔐 Check user
  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
    }
    checkUser();
  }, [router]);

  // 🕒 Live clock
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 📍 Get location (not shown in UI)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {}
    );
  }, []);

  // 📷 Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.log("Camera error:", error);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 🔎 Fetch today record
  useEffect(() => {
    if (!user) return;

    async function fetchToday() {
      setLoadingAttendance(true);

      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", user.id)
        .eq("attendance_date", today)
        .maybeSingle();

      setTodayRecord(data);
      setLoadingAttendance(false);
    }

    fetchToday();
  }, [user]);

  async function captureImage(): Promise<Blob | null> {
    if (!videoRef.current) return null;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  }

  // 🟢 Time In
  async function handleTimeIn() {
    if (!location) return alert("Location not ready");

    setLoading(true);

    const blob = await captureImage();
    if (!blob) return alert("Image capture failed");

    const fileName = `${user.id}-${Date.now()}.jpg`;

    await supabase.storage
      .from("attendance-photos")
      .upload(fileName, blob);

    const { data: urlData } = supabase.storage
      .from("attendance-photos")
      .getPublicUrl(fileName);

    const { data } = await supabase
      .from("attendance")
      .insert([
        {
          employee_id: user.id,
          attendance_date: today,
          time_in: new Date(),
          time_in_photo: urlData.publicUrl,
          time_in_lat: location.latitude,
          time_in_lng: location.longitude,
        },
      ])
      .select()
      .single();

    setTodayRecord(data);
    setLoading(false);
  }

  // 🔴 Time Out
  async function handleTimeOut() {
    if (!location) return alert("Location not ready");

    setLoading(true);

    const { data } = await supabase
      .from("attendance")
      .update({
        time_out: new Date(),
        time_out_lat: location.latitude,
        time_out_lng: location.longitude,
      })
      .eq("employee_id", user.id)
      .eq("attendance_date", today)
      .select()
      .single();

    setTodayRecord(data);
    setLoading(false);
  }

  function PowerButton({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) {
    return (
      <div className="power-container">
        <input
          id="power-checkbox"
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <label className="power-button" htmlFor="power-checkbox">
          <span className="icon">
            <svg viewBox="0 0 30.143 30.143">
              <g>
                <path d="M20.034,2.357v3.824c3.482,1.798,5.869,5.427,5.869,9.619c0,5.98-4.848,10.83-10.828,10.83c-5.982,0-10.832-4.85-10.832-10.83c0-3.844,2.012-7.215,5.029-9.136V2.689C4.245,4.918,0.731,9.945,0.731,15.801c0,7.921,6.42,14.342,14.34,14.342c7.924,0,14.342-6.421,14.342-14.342C29.412,9.624,25.501,4.379,20.034,2.357z" />
                <path d="M14.795,17.652c1.576,0,1.736-0.931,1.736-2.076V2.08c0-1.148-0.16-2.08-1.736-2.08c-1.57,0-1.732,0.932-1.732,2.08v13.496C13.062,16.722,13.225,17.652,14.795,17.652z" />
              </g>
            </svg>
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#0f0f13] via-[#12121a] to-[#0a0a0f] text-white flex overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-[420px] bg-[#181821]/80 backdrop-blur-xl border-r border-white/5 p-8 flex flex-col justify-between">

        <div className="flex flex-col items-center">

          {/* Profile */}
          <div className="w-28 h-28 rounded-full overflow-hidden mb-6 border-2 border-blue-500/40 shadow-lg">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#2a2a35] text-2xl font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Greeting */}
          <h2 className="text-xl font-semibold tracking-wide mb-6 text-gray-200">
            Good Morning, {user?.email?.split("@")[0]}
          </h2>

          {/* Camera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="rounded-xl w-72 h-48 object-cover shadow-xl border border-white/10"
          />

          {/* Power Button */}
          <div className="mt-10 flex flex-col items-center">
            <PowerButton
              checked={todayRecord && !todayRecord.time_out}
              onChange={() => {
                if (!todayRecord) {
                  handleTimeIn();
                } else if (!todayRecord.time_out) {
                  handleTimeOut();
                }
              }}
            />

            <p className="mt-4 text-sm text-gray-400 tracking-wide">
              {!todayRecord
                ? "Tap to Time In"
                : !todayRecord.time_out
                  ? "Tap to Time Out"
                  : "Attendance Completed"}
            </p>
          </div>

          {/* Clock */}
          <p className="mt-6 text-gray-400 text-sm">
            {currentTime}
          </p>

          {/* Leave Button */}
          <button
            onClick={() => router.push("/leave")}
            className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 transition text-white px-6 py-2 rounded-lg font-medium shadow-lg"
          >
            Apply Leave
          </button>
        </div>

        {/* Logo Bottom */}
        <div className="flex justify-center pt-6 border-t border-white/5">
          <img
            src="/company-logo.png"
            alt="Company Logo"
            className="max-w-[140px] opacity-70"
          />
        </div>
      </div>


      {/* RIGHT PANEL */}
      <div className="flex-1 p-12 overflow-y-auto">

        <h1 className="text-3xl font-bold mb-8 tracking-wide">
          Attendance Summary
        </h1>

        <div className="bg-[#1c1c24] border border-white/5 rounded-2xl p-8 shadow-2xl">

          {!todayRecord ? (
            <p className="text-gray-400">
              No attendance record for today.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-6 text-center">

              <div className="bg-[#23232d] p-6 rounded-xl">
                <p className="text-gray-400 text-sm">Date</p>
                <p className="mt-2 text-lg font-semibold">{today}</p>
              </div>

              <div className="bg-[#23232d] p-6 rounded-xl">
                <p className="text-gray-400 text-sm">Time In</p>
                <p className="mt-2 text-lg font-semibold">
                  {todayRecord.time_in
                    ? new Date(todayRecord.time_in).toLocaleTimeString()
                    : "-"}
                </p>
              </div>

              <div className="bg-[#23232d] p-6 rounded-xl">
                <p className="text-gray-400 text-sm">Time Out</p>
                <p className="mt-2 text-lg font-semibold">
                  {todayRecord.time_out
                    ? new Date(todayRecord.time_out).toLocaleTimeString()
                    : "-"}
                </p>
              </div>

              <div className="bg-[#23232d] p-6 rounded-xl">
                <p className="text-gray-400 text-sm">Working Hours</p>
                <p className="mt-2 text-lg font-semibold text-blue-400">
                  {todayRecord.time_out
                    ? (
                      (new Date(todayRecord.time_out).getTime() -
                        new Date(todayRecord.time_in).getTime()) /
                      (1000 * 60 * 60)
                    ).toFixed(2) + " hrs"
                    : "-"}
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}