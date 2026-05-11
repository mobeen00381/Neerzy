import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // MOCK USER FETCH
  // In a real app, this would verify admin token and fetch from Supabase
  const users = [
    { id: "1", email: "john@acmeplumbing.com", name: "Acme Plumbing", role: "customer" },
    { id: "2", email: "sarah@texaselectric.com", name: "Texas Electric", role: "customer" },
  ];
  
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // MOCK USER CREATION
    return NextResponse.json({ 
      success: true, 
      user: { id: "3", ...body, role: "customer" } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
