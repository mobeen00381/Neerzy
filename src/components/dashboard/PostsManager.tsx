'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Draft {
  id: string;
  service: string;
  address: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
}

const DraftCard = ({ draft }: { draft: Draft }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center shadow-sm">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
          {draft.status}
        </span>
        <span className="text-xs text-slate-400">
          {new Date(draft.created_at).toLocaleDateString()}
        </span>
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white">{draft.service}</h4>
      <p className="text-sm text-slate-500 truncate max-w-md">{draft.content || draft.address}</p>
    </div>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm">Edit</Button>
      <Button size="sm" className="bg-[#25D366] hover:bg-[#1da851] text-black">Publish</Button>
    </div>
  </div>
);

export function PostsManager({ userId }: { userId: string }) {
  const [newPost, setNewPost] = useState({ service: '', address: '', photo: '' });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const createPostDraft = async () => {
    if (!newPost.service) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/posts/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPost, trader_id: userId }),
      });
      
      if (!response.ok) throw new Error('Failed to generate draft');
      
      const draft = await response.json();
      setDrafts([draft, ...drafts]);
      setNewPost({ service: '', address: '', photo: '' });
    } catch (error) {
      console.error("Draft generation failed:", error);
      // Fallback for demo purposes if API isn't ready
      const mockDraft: Draft = {
        id: Math.random().toString(36).substr(2, 9),
        service: newPost.service,
        address: newPost.address,
        content: `Checking out this new ${newPost.service} job in ${newPost.address}! #Neerzy`,
        status: 'draft',
        created_at: new Date().toISOString()
      };
      setDrafts([mockDraft, ...drafts]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create New Post Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Generate New Google Post</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Service Provided</label>
            <input 
              placeholder="e.g., Emergency Boiler Repair" 
              value={newPost.service}
              onChange={(e) => setNewPost({...newPost, service: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-[#25D366] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Job Location</label>
            <input 
              placeholder="e.g., 123 Baker St, London" 
              value={newPost.address}
              onChange={(e) => setNewPost({...newPost, address: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-[#25D366] outline-none"
            />
          </div>
        </div>
        <Button 
          onClick={createPostDraft}
          disabled={isGenerating || !newPost.service}
          className="bg-[#25D366] hover:bg-[#1da851] text-black rounded-full px-8 py-6 text-lg font-bold shadow-lg transform transition active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? 'AI is working...' : 'Generate AI Draft →'}
        </Button>
      </div>

      {/* Drafts List Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Post Drafts</h3>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">
            {drafts.length} total
          </span>
        </div>
        
        {drafts.length > 0 ? (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">No active drafts</h4>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">
              Either use the tool above or just send a photo on WhatsApp to generate your next Google post automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
