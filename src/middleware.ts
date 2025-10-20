import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // 로그인하지 않은 사용자가 접근할 수 있는 경로
  const publicPaths = [
    "/login",
    "/signup",
    "/auth/callback",
    "/forgot-password",
    "/reset-password",
  ];

  // 사용자가 로그인하지 않았고, 접근하려는 경로가 public 경로가 아닐 경우
  if (!session && !publicPaths.includes(pathname)) {
    // 로그인 페이지로 리디렉션
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 사용자가 로그인했고, 접근하려는 경로가 로그인 또는 회원가입 페이지일 경우
  if (session && (pathname === "/login" || pathname === "/signup")) {
    // 기본 페이지(챗봇)로 리디렉션
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - API routes (/api)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - image files (svg, png, jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
