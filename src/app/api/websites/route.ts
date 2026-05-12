import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessId, domainId, theme } = body;

    // MOCK WEBSITE GENERATION
    // Real implementation: Create records in Supabase and trigger background job to structure Next.js dynamic pages

    const defaultPages = [
      { path: "/", title: "Home" },
      { path: "/services", title: "Services" },
      { path: "/gallery", title: "Gallery" },
      { path: "/blog", title: "Blog" },
      { path: "/contact", title: "Contact" }
    ];

    return NextResponse.json({ 
      success: true, 
      website: {
        id: "web_123",
        businessId,
        domainId,
        theme: theme || "light",
        primaryColor: "#4F9CF9", // blue-500
        secondaryColor: "#34D399", // green-400
        isPublished: true,
        pages: defaultPages
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
