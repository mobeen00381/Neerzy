import { MapPin, Phone, Star, Shield, Clock } from "lucide-react";
import { TEMPLATE_REGISTRY, TemplateId } from "@/lib/templates";

// Auto-detect template by service keywords
function guessTemplate(service: string): TemplateId {
  const s = service.toLowerCase();
  if (s.includes("plumb")) return "plumber";
  if (s.includes("electric") || s.includes("wiring")) return "electrician";
  if (s.includes("hvac") || s.includes("ac ") || s.includes("air") || s.includes("cool") || s.includes("heat") || s.includes("furnace")) return "hvac";
  if (s.includes("mechanic") || s.includes("auto") || s.includes("car")) return "mechanic";
  if (s.includes("dentist") || s.includes("teeth") || s.includes("dental")) return "dentist";
  if (s.includes("roof") || s.includes("shingle") || s.includes("gutter")) return "roofing";
  if (s.includes("handy") || s.includes("repair") || s.includes("fix")) return "handyman";
  if (s.includes("grocer") || s.includes("food") || s.includes("market") || s.includes("produce")) return "grocery";
  if (s.includes("hardware") || s.includes("tool") || s.includes("lumber") || s.includes("supply")) return "hardware";
  return "generic";
}

interface WebsitePreviewProps {
  businessName: string;
  serviceType: string;
  serviceArea: string;
  themeColor: string;
}

export default function WebsitePreview({ 
  businessName, 
  serviceType, 
  serviceArea, 
  themeColor 
}: WebsitePreviewProps) {
  
  const displayName = businessName || "Your Business Name";
  const displayService = serviceType || "Your Service";
  const displayArea = serviceArea || "Your City";

  const templateId = guessTemplate(serviceType);
  const TemplateComponent = TEMPLATE_REGISTRY[templateId].component || TEMPLATE_REGISTRY.generic.component;

  const templateData = {
    businessName: displayName,
    serviceArea: displayArea,
    // Provide some context-aware mock SEO titles for the preview
    seoTitle: templateId === 'dentist' 
      ? `Gentle, compassionate dental care for families in ${displayArea}. We specialize in everything from cleanings to cosmetic whitening.`
      : templateId === 'mechanic'
      ? `Honest mechanics serving ${displayArea}. Fair pricing and fast turnaround for all your auto repair needs.`
      : templateId === 'hvac'
      ? `Top-rated HVAC technicians in ${displayArea}. We keep your home cool and comfortable year-round.`
      : `Professional, reliable ${displayService.toLowerCase()} services in ${displayArea}. We deliver 5-star quality on every job.`
  };

  return (
    <div 
      className="w-full h-full bg-slate-100 rounded-xl overflow-hidden shadow-2xl flex flex-col relative transition-all duration-500 ease-in-out"
      style={{ 
        border: `6px solid ${themeColor || '#1e293b'}`,
        boxShadow: `0 25px 50px -12px ${themeColor}60`
      }}
    >
      {/* Browser Chrome */}
      <div 
        className="h-10 flex items-center px-4 gap-2 shrink-0 transition-colors duration-500"
        style={{ backgroundColor: themeColor || '#1e293b' }}
      >
        <div className="flex gap-1.5 opacity-80 mix-blend-screen">
          <div className="w-3 h-3 rounded-full bg-white/50 hover:bg-white/90 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-white/50 hover:bg-white/90 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-white/50 hover:bg-white/90 transition-colors" />
        </div>
        <div className="mx-auto bg-black/20 rounded shadow-inner text-[11px] text-white/90 px-8 py-1 font-bold tracking-wide flex items-center justify-center border border-white/10">
          {businessName ? businessName.toLowerCase().replace(/\s+/g, '') : 'yourwebsite'}.com
        </div>
      </div>

      {/* Website Content - Dynamically Loaded from Registry */}
      <div className="flex-1 overflow-y-auto bg-white pointer-events-none origin-top transition-all duration-300">
         <TemplateComponent data={templateData} />
      </div>

    </div>
  );
}
