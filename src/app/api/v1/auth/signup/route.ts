import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SignUpResponse, SignUpPendingResponse, AuthErrorResponse } from "@/lib/auth/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_DIGIT = /[0-9]/;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SignUpResponse | SignUpPendingResponse | AuthErrorResponse>> {
  let body: { email?: unknown; password?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 422 });
  }
  if (
    password.length < 8 ||
    !HAS_LETTER.test(password) ||
    !HAS_DIGIT.test(password)
  ) {
    return NextResponse.json({ error: "password_too_weak" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists") || error.status === 422) {
      return NextResponse.json({ error: "email_already_registered" }, { status: 409 });
    }
    if (msg.includes("password")) {
      return NextResponse.json({ error: "password_too_weak" }, { status: 400 });
    }
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }

  if (!data.session) {
    return NextResponse.json(
      { requiresConfirmation: true, userId: data.user.id, email: data.user.email! },
      { status: 202 },
    );
  }

  return NextResponse.json(
    {
      userId: data.user.id,
      email: data.user.email!,
      token: data.session.access_token,
      expiresIn: data.session.expires_in,
    },
    { status: 201 },
  );
}
