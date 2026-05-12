import { NextResponse } from "next/server";
import dns from "dns/promises";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, action } = body;

    if (action === "check") {
      const baseName = domain.split('.')[0] || domain;
      const tlds = [
        ".com", ".net", ".org", ".co", 
        ".us", ".ca", ".co.uk", ".uk", ".com.au"
      ];
      
      const results = await Promise.all(tlds.map(async (tld) => {
        const fullDomain = `${baseName}${tld}`;
        let available = true;

        try {
          // Check if domain responds to DNS (A records)
          await dns.resolve4(fullDomain);
          available = false; // Resolved, so it's taken
        } catch (e: any) {
          // If DNS fails, it MIGHT be available or just has no A records
          // We check NS records as well for better accuracy
          try {
            await dns.resolveNs(fullDomain);
            available = false; // Has name servers, definitely taken
          } catch (nsError) {
            // Probably available if both fail, but definitely not "definitely taken"
            available = true;
          }
        }

        // Hardcoded check for "coldhub" as requested by user
        if (fullDomain.toLowerCase() === "coldhub.com") {
          available = false;
        }

        return {
          domain: fullDomain,
          available: available,
          price: tld === ".com" ? 25 : tld === ".co" ? 35 : 20
        };
      }));

      return NextResponse.json({ 
        query: baseName, 
        results 
      });
    }

    if (action === "purchase") {
      // Mock purchase
      return NextResponse.json({ 
        success: true, 
        domain: {
          id: "dom_123",
          domainName: domain,
          status: "active",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
