import { NextResponse } from "next/server";
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from "@/lib/openai";

// Lazy init — only runs when an API call is made, not during build
function getOpenAI() {
  return getOpenAIClient();
}

export async function POST(req: Request) {
  try {
    const { businessName, serviceType, city } = await req.json();

    if (!businessName || !serviceType || !city) {
      return NextResponse.json(
        { error: "Missing required fields (businessName, serviceType, city)" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      response_format: { type: "json_object" }, // Forces OpenAI to return valid JSON
      messages: [
        {
          role: "system",
          content: `You are an expert SEO copywriter for local service businesses.
          Generate high-converting website copy for a business based on the user's details.
          
          You MUST reply with ONLY a JSON object exactly exactly matching this structure:
          {
            "templateType": "A single exact string chosen from: ['plumber', 'electrician', 'hvac', 'mechanic', 'dentist', 'cleaning', 'roofing', 'landscaping', 'generic'] based on what this business is.",
            "hero": {
              "headline": "...",
              "subheadline": "..."
            },
            "about": "A 3-sentence paragraph explaining why they are the best local choice...",
            "services": [
              { "title": "...", "description": "..." },
               // Exactly 3 services
            ],
            "seoMeta": {
              "title": "...",
              "description": "..."
            }
          }`
        },
        {
          role: "user",
          content: `Create a website for a ${serviceType} business called "${businessName}" located in ${city}.`
        }
      ]
    });

    // Step 2: Parse the OpenAI response
    const generatedDataString = response.choices[0].message.content;
    
    // Safely parse the JSON string back into a Javascript object
    const websiteData = generatedDataString ? JSON.parse(generatedDataString) : null;

    // Step 3: Return the generated site data to the frontend
    return NextResponse.json({ success: true, websiteData });

  } catch (error) {
    console.error("OpenAI Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate website copy" },
      { status: 500 }
    );
  }
}
