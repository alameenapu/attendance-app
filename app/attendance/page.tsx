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
  const [loading, setLoading] = useState(false);

  // 🔐 Check logged in user
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

  // 📍 Get GPS Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        alert("Location permission required!");
      }
    );
  }, []);

  // 📷 Start Camera
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

    // 🛑 CLEANUP CAMERA (VERY IMPORTANT)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 📸 Capture Image
  async function captureImage(): Promise<Blob | null> {
    if (!videoRef.current) return null;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  }

  // ✅ Mark Attendance
  async function markAttendance() {

    console.log("Auth UID:", user.id);
    if (!location) {
      alert("Location not detected");
      return;
    }

    setLoading(true);

    const blob = await captureImage();

    if (!blob) {
      alert("Failed to capture image");
      setLoading(false);
      return;
    }

    const fileName = `${user.id}-${Date.now()}.jpg`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("attendance-photos")
      .upload(fileName, blob);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("attendance-photos")
      .getPublicUrl(fileName);

    // Insert into attendance table
    const { error: insertError } = await supabase.from("attendance").insert([
      {
        employee_id: user.id,
        photo_url: publicUrlData.publicUrl,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    ]);

    if (insertError) {
      alert(insertError.message);
      setLoading(false);
      return;
    }

    alert("Attendance Marked Successfully ✅");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">
        Welcome {user?.email}
      </h1>

      <div className="mb-4">
        {location ? (
          <p>📍 Location Ready</p>
        ) : (
          <p>Detecting Location...</p>
        )}
      </div>

      <div className="mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded-lg w-80"
        />
      </div>

      <button
        onClick={markAttendance}
        disabled={loading}
        className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold hover:scale-105 transition"
      >
        {loading ? "Processing..." : "Mark Attendance"}
      </button>
    </div>
  );
}
