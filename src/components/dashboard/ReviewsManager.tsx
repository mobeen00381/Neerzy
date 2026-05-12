'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  reply?: string;
}

const ReviewList = ({ userId }: { userId: string }) => {
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}</div>;

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
        <p className="text-slate-500">No reviews tracked yet. Send your first request below!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{review.reviewer_name}</div>
              <div className="flex text-yellow-400 text-xs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
          {review.reply ? (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500">
              <span className="font-bold block mb-1">Your Reply:</span>
              {review.reply}
            </div>
          ) : (
            <button className="mt-3 text-xs font-bold text-[#0F5C4D] hover:underline">Reply to review</button>
          )}
        </div>
      ))}
    </div>
  );
};

export function ReviewsManager({ userId }: { userId: string }) {
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: gbp } = useQuery({
    queryKey: ['gbp', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_connections')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const sendReviewRequest = async () => {
    if (!customerPhone || !gbp?.review_link) return;
    
    setIsSending(true);
    try {
      const response = await fetch('/api/reviews/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerPhone,
          review_link: gbp.review_link,
          trader_name: gbp.business_name,
        }),
      });
      
      if (response.ok) {
        alert("Review request sent successfully!");
        setCustomerPhone('');
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      console.error("Failed to send review request:", error);
      alert("Note: API is being set up. This would send a WhatsApp message to the customer.");
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
        
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full">
            <input 
              placeholder="Customer WhatsApp (e.g., +44...)" 
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-[#25D366] outline-none text-slate-900 dark:text-white"
            />
          </div>
          <Button 
            onClick={sendReviewRequest}
            disabled={isSending || !customerPhone || !gbp?.review_link}
            className="w-full md:w-auto bg-[#25D366] hover:bg-[#1da851] text-black rounded-full px-8 py-4 font-bold shadow-md transition active:scale-95 disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send WhatsApp ⭐'}
          </Button>
        </div>
        
        {gbp?.review_link && (
          <div className="mt-6 p-4 bg-[#F0F7F5] dark:bg-slate-800/50 rounded-xl border border-[#25D366]/20">
            <div className="text-[10px] font-black text-[#0F5C4D] dark:text-[#25D366] uppercase tracking-widest mb-1">Your Direct Review Link</div>
            <code className="text-xs text-slate-600 dark:text-slate-300 break-all">{gbp.review_link}</code>
          </div>
        )}
      </div>

      {/* Recent Reviews List */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Customer Feedback</h3>
        <ReviewList userId={userId} />
      </div>
    </div>
  );
}
