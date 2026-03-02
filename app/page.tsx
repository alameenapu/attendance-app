"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/login");  // use replace instead of push
        return;
      }

      const user = userData.user;
      const email = user.email;

      const { data: existing } = await supabase
        .from("employees")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("employees").insert([
          {
            id: user.id,   // 🔥 VERY IMPORTANT
            name: email?.split("@")[0],
            email: email,
            avatar_url: user.user_metadata.avatar_url,
          },
        ]);
        if (error) {
          console.error("Insert failed:", error.message);
          return;
  }
      }

      router.replace("/attendance"); // safe redirect
    }

    checkUser();
  }, [router]);

  if (loading) return null;

  return null;
}


// https://attendance-app-ivory-three.vercel.app