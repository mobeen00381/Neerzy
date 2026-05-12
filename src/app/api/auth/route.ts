import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    // MOCK AUTHENTICATION
    // In a real app, this would use Supabase Auth or NextAuth
    
    if (action === "login") {
      if (email && password) {
        return NextResponse.json({ 
          user: { id: "1", email, name: "Test User", role: "customer" },
          token: "mock_jwt_token"
        });
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (action === "register") {
      return NextResponse.json({ 
        user: { id: "1", email, name: "New User", role: "customer" },
        token: "mock_jwt_token"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
