"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  }

  return (
    <div className="wrapper">
      <form className="form" onSubmit={handleLogin}>
        <span className="title">LOGIN</span>

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
          <input className="input" type="submit" value="Login" />
        </div>

        <div className="divider">OR</div>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            width="20"
          />
          Sign in with Google
        </button>

        <div className="texture"></div>
      </form>
    </div>
  );
}
