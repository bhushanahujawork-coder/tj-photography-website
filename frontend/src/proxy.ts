import { NextResponse, NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()

  const hasSession = request.cookies.has('tj_admin_session')
  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}