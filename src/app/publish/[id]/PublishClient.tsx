"use client";

import React, { useState } from "react";

export default function PublishClient({ job }: { job: any }) {
  const [isMarking, setIsMarking] = useState(false);

  const handleCopy = () => {
    const text = `${job.title}\n\n${job.content}\n\n${job.hashtags?.join(' ')}`;
    navigator.clipboard.writeText(text);
    alert('✅ Post copied! Paste it in Google Business Profile.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto font-sans">
      <h1 className="text-xl font-bold mb-4 text-slate-900">📝 Ready to Publish</h1>
      
      {/* Post Preview */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="font-bold text-lg text-slate-800">{job.title}</h2>
        <p className="text-slate-600 mt-3 whitespace-pre-wrap leading-relaxed">{job.content}</p>
        {job.hashtags && job.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {job.hashtags.map((t: string) => (
              <span key={t} className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* 1. Copy Post */}
        <button 
          onClick={handleCopy}
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 transition-colors text-white rounded-2xl font-black shadow-lg shadow-teal-600/20 active:scale-[0.98]"
        >
          📋 Copy Full Post
        </button>

        {/* 2. Download Images */}
        {job.media_urls && job.media_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {job.media_urls.map((url: string, i: number) => (
              <a 
                key={i}
                href={`/api/download-image?url=${encodeURIComponent(url)}&name=neerzy-job-${i+1}.jpg`}
                download
                className="py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-center rounded-2xl font-bold text-sm shadow-md active:scale-[0.98]"
              >
                💾 Save Image {i+1}
              </a>
            ))}
          </div>
        )}

        {/* 3. Open GBP */}
        <a 
          href="https://business.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-2xl font-black text-center block shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          🌐 Open Google Business Profile
        </a>

        {/* 4. Mark Published & Request Review */}
        <button 
          onClick={async () => {
            if (!confirm("Did you publish the post on Google? This will send a review request to your customer!")) return;
            setIsMarking(true);
            try {
              const res = await fetch('/api/jobs/mark-published', {
                method: 'POST',
                body: JSON.stringify({ jobId: job.id })
              });
              const data = await res.json();
              if (data.success) {
                alert("🎉 Awesome! A review request has been sent to the customer via WhatsApp!");
              } else {
                alert("⚠️ " + (data.error || "Failed to mark as published."));
              }
            } catch (err) {
              alert("⚠️ Error connecting to server.");
            } finally {
              setIsMarking(false);
            }
          }}
          disabled={isMarking}
          className="w-full py-4 mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white rounded-2xl font-black shadow-lg shadow-green-500/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isMarking ? "⏳ Sending..." : "✅ I Published It! Send Review Request"}
        </button>
      </div>

      <p className="text-sm font-medium text-slate-500 mt-8 text-center leading-relaxed">
        Paste content + upload saved images → Click Publish.<br/>We'll notify you when reviews come in!
      </p>
    </div>
  );
}
