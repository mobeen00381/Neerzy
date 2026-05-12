'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsStats {
  total_reviews: number;
  review_growth: number;
  posts_published: number;
  post_growth: number;
  avg_ctr: number;
  ctr_change: number;
  review_conversion: number;
  conversion_change: number;
  reviews_timeline: { date: string; count: number }[];
  post_performance: { label: string; views: number; clicks: number }[];
}

const MetricCard = ({ title, value, trend, icon }: { title: string; value: string | number; trend?: number; icon: string }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
    <div className="flex justify-between items-start mb-4">
      <div className="text-2xl">{icon}</div>
      {trend !== undefined && (
        <div className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
  </div>
);

const LineChart = ({ data }: { data?: any[] }) => {
  const chartData = {
    labels: data?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Reviews',
        data: data?.map(d => d.count) || [],
        borderColor: '#25D366',
        backgroundColor: 'rgba(37, 211, 102, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />;
};

const BarChart = ({ data }: { data?: any[] }) => {
  const chartData = {
    labels: data?.map(d => d.label) || [],
    datasets: [
      {
        label: 'Views',
        data: data?.map(d => d.views) || [],
        backgroundColor: '#0F5C4D',
        borderRadius: 6,
      },
      {
        label: 'Clicks',
        data: data?.map(d => d.clicks) || [],
        backgroundColor: '#25D366',
        borderRadius: 6,
      },
    ],
  };

  return <Bar data={chartData} options={{ responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />;
};

export function AnalyticsPanel({ userId }: { userId: string }) {
  const { data: stats, isLoading } = useQuery<AnalyticsStats>({
    queryKey: ['analytics', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trader_analytics', { trader_id: userId });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        ))}
        <div className="md:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        <div className="md:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Metric Cards */}
      <MetricCard 
        title="Total Reviews" 
        value={stats?.total_reviews || 0} 
        trend={stats?.review_growth} 
        icon="⭐"
      />
      <MetricCard 
        title="Posts Published" 
        value={stats?.posts_published || 0} 
        trend={stats?.post_growth} 
        icon="📝"
      />
      <MetricCard 
        title="Avg. CTR" 
        value={`${stats?.avg_ctr || 0}%`} 
        trend={stats?.ctr_change} 
        icon="👆"
      />
      <MetricCard 
        title="Review Conversion" 
        value={`${stats?.review_conversion || 0}%`} 
        trend={stats?.conversion_change} 
        icon="🎯"
      />

      {/* Chart: Reviews Over Time */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Reviews Received (Last 30 Days)</h3>
        <LineChart data={stats?.reviews_timeline} />
      </div>

      {/* Chart: Post Performance */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6">Post Engagement</h3>
        <BarChart data={stats?.post_performance} />
      </div>
    </div>
  );
}
