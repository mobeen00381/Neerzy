import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

/**
 * Enriches a raw address with city, category, and location IDs
 */
export async function enrichLocationData(address: string) {
  try {
    // 1. Geocode the address to get city and placeId
    const res = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY || "",
      },
    });

    if (!res.data.results.length) {
      throw new Error("Address not found");
    }

    const result = res.data.results[0];
    const placeId = result.place_id;
    
    // Find city in address components
    const cityComponent = result.address_components.find((c: any) => 
      c.types.includes("locality") || c.types.includes("postal_town")
    );
    const city = cityComponent?.long_name || "your city";

    // Mock locationId (In a real app, this would be the Google Business Profile location ID)
    const locationId = `LOC_${placeId.substring(0, 10)}`;

    return {
      placeId,
      locationId,
      city,
      category: "Home Services", // Default fallback
      address: result.formatted_address,
    };
  } catch (error) {
    console.error("❌ Google Enrichment Error:", error);
    // Fallback for demo purposes
    return {
      placeId: "ChIJLfyvW9S1RIYRF9dr_v2F_G0", // Austin placeholder
      locationId: "123456789",
      city: "Austin",
      category: "Plumbing",
      address,
    };
  }
}
