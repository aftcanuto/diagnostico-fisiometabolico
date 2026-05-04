import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => request.cookies.get(n)?.value,
        set: (n: string, v: string, o: any) => response.cookies.set({ name: n, value: v, ...o }),
        remove: (n: string, o: any) => response.cookies.set({ name: n, value: '', ...o })
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAuthPage = url.pathname.startsWith('/login');
  const isPublic =
    isAuthPage ||
    url.pathname.startsWith('/_next') ||
    url.pathname === '/' ||
    url.pathname.startsWith('/p/') ||            // portal público do paciente
    url.pathname.startsWith('/api/pdf/publico'); // PDF público via token

  if (!user && !isPublic) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api/pdf|_next/static|_next/image|favicon.ico).*)']
};
