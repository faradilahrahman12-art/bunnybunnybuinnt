
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.EMAIL_TEST_SECRET;
  const recipient = process.env.EMAIL_TEST_TO;
  const provided = request.headers.get("x-test-secret") || "";

  if (!secret || !recipient) {
    return NextResponse.json(
      { error: "Email test configuration missing" },
      { status: 500 }
    );
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await sendEmail({
      to: recipient,
      subject: "BUNNY TICKET | Email Test",
      html: `
        <div style="font-family:Arial;padding:30px">
          <h1 style="color:#7c3aed">BUNNY TICKET</h1>
          <h2>Email Connection Successful!</h2>
          <p>Your Resend integration is working.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      emailId: result?.id,
    });
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { error: "Unable to send email" },
      { status: 500 }
    );
  }
}
