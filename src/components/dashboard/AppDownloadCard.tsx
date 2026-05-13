// components/dashboard/AppDownloadCard.tsx
import { Smartphone, Download, ArrowUpRight } from "lucide-react";

export function AppDownloadCard() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 blur-3xl rounded-full" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
          <Smartphone className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black mb-2 leading-tight">Install the <br />Mobile App</h2>
        <p className="text-blue-100 text-sm font-medium opacity-80">
          Manage your posts on the go. Faster uploads, instant notifications.
        </p>
      </div>

      <div className="relative z-10 pt-8">
        <button className="w-full bg-white text-blue-700 py-4 px-6 rounded-2xl font-black flex items-center justify-between group hover:shadow-2xl transition-all">
          <span className="flex items-center gap-2">
            <Download className="w-5 h-5" /> Download Now
          </span>
          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
