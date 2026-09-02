import { NextResponse } from "next/server";
import { NeerzyEngine, fetchLocalKeywords, loadAEOTemplates, getGeoContext } from "@/lib/neerzy/engine";
import { supabase } from "@/lib/supabase";

/**
 * Mock helper: Fetch trader performance data
 */
async function getTraderPerformance(trader_id: string) {
  const { data } = await supabase
    .from('users')
    .select('past_performance')
    .eq('id', trader_id)
    .single();
  return data?.past_performance || { top_keywords: [] };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trader_id, trade, service, jobDescription, intent, address, target_region, location, category } = body;

    if (!trader_id || !trade || !service || !intent || !address || !target_region) {
      return NextResponse.json({ error: "Missing required fields for Layer 4" }, { status: 400 });
    }

    // 1. Get past performance data
    const pastData = await getTraderPerformance(trader_id);

    // 2. Call Neerzy Engine (which encapsulates Layer 1-5)
    const optimized = await NeerzyEngine.generate({
      trader_id,
      trade,
      service,
      // Trader's actual job text is the source of truth; when absent the prompt
      // degrades to a grounded minimal "job completed" post (never generic copy).
      jobDescription,
      intent,
      address,
      location,
      category,
      target_region,
      past_performance: pastData,
      geo_signals: await getGeoContext(address)
    });

    return NextResponse.json(optimized); 
  } catch (error: any) {
    console.error("Neerzy Engine API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
