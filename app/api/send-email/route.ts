import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, message } = body;

    await resend.emails.send({
      from: "HR System <onboarding@resend.dev>",
      to,
      subject,
      html: `<div style="font-family:Arial;">
              <h2>${subject}</h2>
              <p>${message}</p>
             </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Email failed" },
      { status: 500 }
    );
  }
}