import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Enforce MFA for authenticated users accessing the workspace.
  // getAuthenticatorAssuranceLevel reads AMR claims from the JWT (no network
  // call). If the user has a verified TOTP factor (nextLevel === aal2) but
  // hasn't completed the challenge yet (currentLevel === aal1), redirect them
  // to the MFA challenge page instead of letting them into the app.
  if (user && request.nextUrl.pathname.startsWith("/app")) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
      const mfaUrl = new URL("/auth/mfa", request.url);
      mfaUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }

  // Forward the request pathname so server components (e.g. app layout)
  // can construct proper ?next= redirects without access to the raw request.
  response.headers.set("x-next-pathname", request.nextUrl.pathname);

  return response;
}
