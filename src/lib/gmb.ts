import { google } from "googleapis";
import { oauth2Client } from "./google-auth";

/**
 * Phase 9 - GMB Posting Engine
 * This service takes a generated post and pushes it to the 
 * Google Business Profile "Local Posts" API for a specific location.
 */

export async function postToGMB(refreshToken: string, locationId: string, content: string, mediaUrl?: string) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    // We use the mybusinessbusinesscalls or mybusinessplaceactions in modern GMB APIs
    // But for "Local Posts" (Posts/Updates), we use the 'mybusiness' or 'businessprofileperformance' APIs
    // Note: The specific API endpoint for posts is: locations/{locationId}/localPosts
    
    console.log(`📡 [GMB API] Posting to Location: ${locationId}`);
    console.log(`📝 Content Preview: ${content.substring(0, 50)}...`);

    // In Production: 
    const gmb = (google as any).mybusiness({ version: 'v4', auth: oauth2Client });
    
    // We attempt to push it. Google requires locationId which we get from the user's connected account.
    await gmb.accounts.locations.localPosts.create({
      parent: `accounts/-/locations/${locationId}`, // Use the dash to infer from the auth token's account
      requestBody: {
        languageCode: 'en-US',
        summary: content,
        callToAction: {
          actionType: 'LEARN_MORE',
          url: 'https://www.neerzy.com'
        },
        media: mediaUrl ? [{
          mediaFormat: 'PHOTO',
          sourceUrl: mediaUrl
        }] : []
      }
    });

    console.log("✅ [GMB API] Post successfully published to Google!");
    return { success: true };
  } catch (error: any) {
    console.error("❌ GMB Posting Error:", error);
    throw error;
  }
}
