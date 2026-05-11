export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  createdAt: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  serviceType: string;
  serviceArea: string;
  whatsappNumber: string;
  googleBusinessUrl: string | null;
}

export interface Domain {
  id: string;
  userId: string;
  domainName: string;
  registeredAt: string;
  expiresAt: string;
  status: "active" | "expired" | "pending";
}

export interface Subscription {
  id: string;
  userId: string;
  planId: "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled";
  trialEndsAt: string;
  currentPeriodEnd: string;
}

export interface Website {
  id: string;
  userId: string;
  domainId: string;
  theme: "light";
  primaryColor: string;
  secondaryColor: string;
  isPublished: boolean;
  pages: { path: string; title: string }[];
}
