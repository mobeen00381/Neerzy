// src/lib/admin-types.ts
// Shared API payload shapes for the /admin dashboard (used by both the
// /api/admin/* route handlers and the client-side admin components).

export type PlanTier = "free" | "pro" | "growth" | "agency";

export interface CycleInfo {
  /** Start of the current 30-day billing cycle. */
  startIso: string;
  /** When the quota resets (start of the NEXT cycle). */
  resetIso: string;
  daysLeft: number;
  postsUsed: number;
  postsLimit: number;
  postsPct: number;
  reviewsUsed: number;
  reviewsLimit: number;
  reviewsPct: number;
}

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  selected_plan: string;
  status: "active" | "trial" | "free" | "agency";
  gbp_connected: boolean;
  agencyClients: number;
  signup_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string | null;
  onboarded_at: string | null;
  plan_started_at: string | null;
  trial_started_at: string | null;
  last_active_at: string | null;
  cycle: CycleInfo;
  totalPostsAllTime: number;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  planBreakdown: { plan: string; count: number }[];
}

export interface AdminTransaction {
  id: string;
  email: string | null;
  plan: string | null;
  amount: number | null;
  currency: string | null;
  event_type: string | null;
  origin: string | null;
  status: string | null;
  paddle_subscription_id: string | null;
  occurred_at: string | null;
}

export interface AdminTransactionList {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totals: {
    revenue: number;
    revenueThisMonth: number;
    currency: string;
  };
}

export type LeadStatus = "new" | "contacted" | "trial_started" | "converted" | "lost";

export interface AdminLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  service_type: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: LeadStatus;
  notes: string | null;
  converted_user_id: string | null;
  created_at: string | null;
}

export interface AdminLeadList {
  leads: AdminLead[];
  total: number;
  page: number;
  pageSize: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export interface PlanBucket {
  plan: string;
  count: number;
}

export interface SourceBucket {
  source: string;
  count: number;
}

export interface MonthBucket {
  month: string; // 'YYYY-MM'
  revenue: number;
  count: number;
}

export interface DayBucket {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

export interface ActivityPost {
  id: string;
  text: string;
  source: "whatsapp" | "webapp";
  platform: "google" | "facebook" | "instagram" | null;
  author: string;
  date: string;
  time: string;
  status: string;
  image: string | null;
}

export interface AdminOverview {
  totals: {
    users: number;
    usersThisMonth: number;
    payingUsers: number;
    mrr: number;
    revenueAllTime: number;
    revenueThisMonth: number;
    postsAllTime: number;
    postsToday: number;
    gbpConnected: number;
    agencyClients: number;
    leadsTotal: number;
    leadsNew: number;
    conversionRate: number; // converted leads / total leads
  };
  planBreakdown: PlanBucket[];
  signupSources: SourceBucket[];
  leadsBySource: SourceBucket[];
  leadsByStatus: { status: string; count: number }[];
  revenueSeries: MonthBucket[];
  signupSeries: DayBucket[]; // last 14 days
  recentTransactions: AdminTransaction[];
  recentLeads: AdminLead[];
  recentActivity: ActivityPost[];
}

export interface UserDetail {
  user: AdminUser;
  activity: {
    posts: { id: string; text: string; platform: string | null; created_at: string | null }[];
    reviews: { customer_name: string | null; status: string | null; sent_at: string | null; converted_at: string | null }[];
  };
  transactions: AdminTransaction[];
}
