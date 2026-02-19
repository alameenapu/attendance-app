"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import "../login/login.css";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created! Please login.");
      router.push("/login");
    }
  }

  return (
    <div className="wrapper">
      <form className="form" onSubmit={handleSignup}>
        <span className="title">SIGN UP</span>

        <div className="input-container">
          <input
            className="input"
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-container">
          <input
            className="input"
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="login-button">
          <input className="input" type="submit" value="Create Account" />
        </div>
      </form>
    </div>
  );
}
