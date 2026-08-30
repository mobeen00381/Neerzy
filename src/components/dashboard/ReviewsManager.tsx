'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Send, Loader2, Clock, CheckCheck, MessageSquare, Smartphone } from 'lucide-react';
import { FallbackReviewModal } from '@/components/dashboard/FallbackReviewModal';

interface ReviewRequest {
  id: string;
  user_id: string;
  business_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  message_text: string | null;
  review_link: string;
  status: 'sent' | 'opened' | 'review_received' | 'manual_fallback';
  sent_via: string;
  sent_at: string;
  converted_at: string | null;
  created_at: string;
}

const statusConfig = {
  sent: { label: 'Sent', icon: Send, color: 'text-blue-600 bg-blue-50' },
  opened: { label: 'Opened', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  review_received: { label: 'Review Received', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  manual_fallback: { label: 'Device Link', icon: Smartphone, color: 'text-slate-600 bg-slate-100' },
};

const ReviewRequestList = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<ReviewRequest[]>({
    queryKey: ['review-requests', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_requests')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const markReceived = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/reviews/mark-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ request_id: requestId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to mark as received');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-requests', userId] });
    },
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}</div>;
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No review requests sent yet.</p>
        <p className="text-slate-400 text-sm mt-1">Send your first request above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const config = statusConfig[req.status];
        const Icon = config.icon;
        return (
          <div key={req.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {req.customer_name || 'Unknown Customer'}
                  </span>
                  {req.customer_phone && (
                    <span className="text-xs text-slate-400 font-mono truncate">{req.customer_phone}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">{req.message_text}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                  <span>{new Date(req.sent_at).toLocaleDateString()} {new Date(req.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </span>
                </div>
              </div>
              {req.status !== 'review_received' && (
                <button
                  onClick={() => markReceived.mutate(req.id)}
                  disabled={markReceived.isPending}
                  className="shrink-0 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {markReceived.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  Mark Received
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function ReviewsManager({ userId, businessProfile, userPhone }: { userId: string; businessProfile?: any; userPhone?: string }) {
  const queryClient = useQueryClient();
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<{
    customerName: string;
    customerPhone: string;
    reviewLink: string;
  } | null>(null);

  // Use the already-loaded business profile from the dashboard (resolved via service-role API)
  // instead of broken client-side lookups that matched on userId (UUID) ≠ user_phone
  const reviewLink = businessProfile?.review_link || null;
  const businessName = businessProfile?.business_name || null;

  const sendReviewRequest = async () => {
    if (!customerPhone || !reviewLink) return;
    
    setIsSending(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/reviews/send-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          to: customerPhone,
          review_link: reviewLink,
          trader_name: businessName,
          customer_name: customerName || undefined,
          user_id: userId,
          user_phone: userPhone || '', // now sent so the API can link business_id
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.whatsapp_sent === false) {
          // Open the fallback modal when Meta could not deliver the message.
          setFallback({
            customerName: customerName || 'Customer',
            customerPhone,
            reviewLink,
          });
        } else {
          alert("✅ Review request sent successfully!");
          setCustomerPhone('');
          setCustomerName('');
        }
        // Invalidate review-requests query so the list refreshes immediately
        queryClient.invalidateQueries({ queryKey: ['review-requests', userId] });
      } else {
        setError(result.error || 'Failed to send request');
      }
    } catch (error) {
      console.error("Failed to send review request:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Send Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Send Review Request</h3>
        <p className="text-slate-500 text-sm mb-6">Send a branded WhatsApp message with your direct Google review link.</p>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 w-full">
              <input 
                placeholder="Customer name (optional)" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-[#25D366] outline-none text-slate-900 dark:text-white mb-3"
              />
              <input 
                placeholder="Customer WhatsApp (e.g., +44...)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-[#25D366] outline-none text-slate-900 dark:text-white"
              />
            </div>
            <Button 
              onClick={sendReviewRequest}
              disabled={isSending || !customerPhone || !reviewLink}
              className="w-full md:w-auto bg-[#25D366] hover:bg-[#1da851] text-black rounded-full px-8 py-4 font-bold shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2 justify-center"
            >
              {isSending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send WhatsApp ⭐</>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>
        
        {reviewLink && (
          <div className="mt-6 p-4 bg-[#F0F7F5] dark:bg-slate-800/50 rounded-xl border border-[#25D366]/20">
            <div className="text-[10px] font-black text-[#0F5C4D] dark:text-[#25D366] uppercase tracking-widest mb-1">Your Direct Review Link</div>
            <code className="text-xs text-slate-600 dark:text-slate-300 break-all">{reviewLink}</code>
          </div>
        )}
      </div>

      {/* Review Requests History */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Review Requests Sent</h3>
        <ReviewRequestList userId={userId} />
      </div>

      <FallbackReviewModal
        isOpen={!!fallback}
        onClose={() => setFallback(null)}
        customerName={fallback?.customerName || 'Customer'}
        customerPhone={fallback?.customerPhone || ''}
        reviewLink={fallback?.reviewLink || ''}
      />
    </div>
  );
}
