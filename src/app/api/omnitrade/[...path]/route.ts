import { NextRequest, NextResponse } from 'next/server';

const OMNITRADE_PORT = '8000';

async function proxy(request: NextRequest, path: string) {
  const targetUrl = `http://localhost:${OMNITRADE_PORT}${path}`;
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) init.body = body;
    }

    const res = await fetch(targetUrl, init);
    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Omnitrade backend unreachable', status: 'offline' },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/omnitrade', '') || '/';
  const queryString = url.searchParams.toString();
  return proxy(request, queryString ? `${path}?${queryString}` : path);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/omnitrade', '') || '/';
  return proxy(request, path);
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/omnitrade', '') || '/';
  return proxy(request, path);
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/omnitrade', '') || '/';
  return proxy(request, path);
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/omnitrade', '') || '/';
  return proxy(request, path);
}
