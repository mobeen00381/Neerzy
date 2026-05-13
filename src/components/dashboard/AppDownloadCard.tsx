// components/dashboard/AppDownloadCard.tsx
import { Smartphone, Apple, PlayCircle } from "lucide-react";

export function AppDownloadCard() {
  return (
    <div className="bg-slate-900 rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden group border border-white/5">
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-3xl rounded-full -mr-24 -mt-24 group-hover:bg-blue-600/40 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Smartphone className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Neerzy Mobile</h3>
        </div>
        
        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
          Manage posts on the go. Get instant notifications and schedule from anywhere.
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          <a 
            href="https://apps.apple.com" 
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <Apple className="w-4 h-4" /> Download for iOS
          </a>
          <a 
            href="https://play.google.com" 
            target="_blank"
            className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <PlayCircle className="w-4 h-4" /> Google Play
          </a>
        </div>
      </div>
    </div>
  );
}
