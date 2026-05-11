import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Lazy initialization — safe for builds without env vars
function getOAuth2Client() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export const oauth2Client = new Proxy({} as OAuth2Client, {
  get(_, prop) {
    return (getOAuth2Client() as any)[prop];
  },
});

export const GMB_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getGoogleAuthUrl(state?: string) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: GMB_SCOPES,
    prompt: "consent",
    state,
  });
}
