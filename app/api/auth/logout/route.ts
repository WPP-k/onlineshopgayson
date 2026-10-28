import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get('scope'); // 'admin', 'user', or all

  const response = NextResponse.json({ success: true });
  
  if (scope === 'admin') {
    response.cookies.set({
      name: 'admin_token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });
  } else if (scope === 'user') {
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });
  } else {
    // Clear both
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });
    response.cookies.set({
      name: 'admin_token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });
  }

  return response;
}
