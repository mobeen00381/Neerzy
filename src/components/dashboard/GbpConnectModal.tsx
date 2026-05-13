// components/dashboard/GbpConnectModal.tsx
import { useState } from "react";
import { Building2, Check, Globe, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GbpConnectModal() {
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");

  const handleConnect = () => {
    setStatus("connecting");
    // Simulate OAuth flow
    setTimeout(() => setStatus("success"), 2000);
  };

  return (
    <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/40 transition-all duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Google Business Profile</h2>
            <p className="text-slate-400 text-sm">Required for automation</p>
          </div>
        </div>

        {status === "success" ? (
          <div className="animate-in zoom-in duration-300">
             <div className="flex items-center gap-3 text-green-400 font-bold mb-6">
               <div className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center">
                 <Check className="w-4 h-4" />
               </div>
               Connected to Action Plumbers
             </div>
             <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white">
               Change Business
             </Button>
          </div>
        ) : (
          <>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              Connect your Google Business Profile to allow Neerzy to post updates automatically whenever you send a photo on WhatsApp.
            </p>
            <Button 
              onClick={handleConnect}
              disabled={status === "connecting"}
              className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-black rounded-2xl"
            >
              {status === "connecting" ? <Loader2 className="animate-spin" /> : "Connect Profile"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
