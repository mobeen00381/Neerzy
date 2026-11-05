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
  /**
   * Normalized E.164 form of `phone` (lib/phone.ts), filled at capture time.
   * NULL = the raw number could not be parsed, so callers fall back to `phone`.
   */
  phone_e164?: string | null;
  /** ISO 3166-1 alpha-2 derived from the phone number; NULL = unknown. */
  country?: string | null;
  business_name: string | null;
  service_type: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: LeadStatus;
  /** Stamped by POST /api/admin/leads/[id] (action: log_contact). NULL = never contacted. */
  last_contacted_at?: string | null;
  notes: string | null;
  converted_user_id: string | null;
  created_at: string | null;
  /** gmb_audit leads only: Google Places id, last score and live report link. */
  place_id?: string | null;
  audit_score?: number | null;
  report_link?: string | null;
  /** Audit signals captured with the scan (see 20261104_leads_audit_signals). */
  website?: string | null;
  /** false = no website at the last audit, null = never checked. */
  hasWebsite?: boolean | null;
  reviewCount?: number | null;
  rating?: number | null;
  /** Derived by lib/lead-priority.ts; attached by /api/admin/leads. */
  priority?: { level: "hot" | "warm" | "cold"; score: number; reasons: string[] };
}

export interface AdminLeadList {
  leads: AdminLead[];
  total: number;
  page: number;
  pageSize: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
}

// ---- GET/POST /api/admin/leads/[id]: lead detail drawer ----

/** One row of public.lead_activity (see 20261105_lead_activity.sql). */
export type LeadActivityType =
  | "note"
  | "contacted_whatsapp"
  | "contacted_email"
  | "called"
  | "status_change"
  | "reviewed";

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: LeadActivityType;
  /** note text, the ticked checklist label, or "from -> to" for a status change. */
  body: string | null;
  created_by: string | null;
  created_at: string | null;
}

/** GET /api/admin/leads/[id] - one full lead plus its append-only timeline, newest first. */
export interface LeadDetail {
  lead: AdminLead;
  activity: LeadActivity[];
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

// ── /gmb-audit-tool reviews (public rating pipeline) ──
export type AuditReviewStatus = "pending" | "published" | "rejected";

export interface AdminAuditReview {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string | null;
  scan_place_id: string | null;
  status: AuditReviewStatus;
  moderated_at: string | null;
  created_at: string | null;
}

export interface AdminAuditReviewList {
  reviews: AdminAuditReview[];
  total: number;
  page: number;
  pageSize: number;
  byStatus: { pending: number; published: number; rejected: number };
}
