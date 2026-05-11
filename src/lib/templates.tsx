import { ComponentType } from "react";
import { Wrench, Zap, Snowflake, Car, Stethoscope, Sparkles, Home, Phone, MapPin, Calculator, Calendar, Star, Shield, Clock, Flame, Droplets, Settings, ThermometerSun, Lightbulb, Plug, BatteryCharging, HardHat, Hammer, PaintBucket, TreePine, ShoppingCart, Apple, Beef, CakeSlice, Leaf, Truck, Package, Scissors, Ruler } from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. PLUMBER — Trust-first blue
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const PlumberTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-slate-50 flex flex-col font-sans relative overflow-hidden text-slate-900 border-2 border-slate-200 rounded-xl shadow-lg animate-in zoom-in-95 duration-500">
    <div className="absolute top-0 w-full h-2 bg-blue-600" />
    <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight text-blue-900">
        <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Wrench className="w-5 h-5" /></div>
        {data.businessName || "Your Plumbing Co"}
      </div>
      <div className="text-sm font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"><Phone className="w-4 h-4"/> 24/7 Service</div>
    </header>
    <main className="flex-1 p-6 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="max-w-md">
        <h1 className="text-4xl font-black mb-4 leading-tight text-slate-900">Emergency leak? We'll be there in <span className="text-blue-600 underline decoration-blue-200">20 minutes.</span></h1>
        <p className="text-slate-500 mb-6 font-medium leading-relaxed">{data.seoTitle}</p>
        <div className="flex gap-3">
           <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">Call Now</button>
           <button className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold">Our Services</button>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {[
          { icon: Wrench, title: "Leak Repair", sub: "Fast emergency fixes" },
          { icon: Droplets, title: "Drain Cleaning", sub: "Clear clogs fast" },
          { icon: Flame, title: "Water Heater", sub: "Install & repair" },
          { icon: Settings, title: "Sewer Line", sub: "Full inspection" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><s.icon className="w-5 h-5"/></div>
            <div><h3 className="font-bold text-sm">{s.title}</h3><p className="text-xs text-slate-400">{s.sub}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4 text-xs text-slate-400 font-bold">
        <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500"/>Licensed & Insured</span>
        <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500"/>4.9 ★ (230+ Reviews)</span>
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. HVAC — Icy blue / warm orange
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const HVACTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-white flex flex-col font-sans relative overflow-hidden text-slate-900 border-2 border-slate-200 rounded-xl shadow-lg animate-in fade-in duration-700">
    <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight">
        <div className="bg-gradient-to-br from-sky-400 to-orange-400 p-1.5 rounded-lg text-white"><Snowflake className="w-5 h-5" /></div>
        <span className="text-slate-800">{data.businessName || "Cool Comfort HVAC"}</span>
      </div>
      <nav className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span className="text-sky-600">Home</span><span>Services</span><span>Reviews</span>
      </nav>
    </header>
    <main className="flex-1 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-sky-50 via-white to-orange-50 -z-10" />
      <div className="p-8 max-w-lg">
        <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest">
          <ThermometerSun className="w-3 h-3"/> Top-Rated HVAC
        </div>
        <h1 className="text-4xl font-black mb-4 leading-tight">Keep Your Home <span className="bg-gradient-to-r from-sky-500 to-orange-400 bg-clip-text text-transparent">Cool & Comfortable</span> Year-Round</h1>
        <p className="text-slate-500 mb-6 leading-relaxed">{data.seoTitle}</p>
        <button className="bg-gradient-to-r from-sky-500 to-sky-600 text-white px-8 py-3.5 rounded-full font-bold shadow-xl shadow-sky-200 hover:shadow-2xl transition-all">Get Free Quote</button>
      </div>
      <div className="px-8 grid grid-cols-4 gap-3">
        {[
          { icon: Snowflake, title: "AC Repair", color: "sky" },
          { icon: Flame, title: "Furnace Install", color: "orange" },
          { icon: Settings, title: "Maintenance", color: "slate" },
          { icon: Clock, title: "Emergency 24/7", color: "red" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <div className={`mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center ${s.color === 'sky' ? 'bg-sky-50 text-sky-500' : s.color === 'orange' ? 'bg-orange-50 text-orange-500' : s.color === 'red' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}><s.icon className="w-5 h-5"/></div>
            <h3 className="font-bold text-xs">{s.title}</h3>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. ELECTRICIAN — Yellow / blue
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const ElectricianTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-slate-900 flex flex-col font-sans relative overflow-hidden text-white border-2 border-slate-700 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
    <div className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-400 rounded-full blur-[120px] opacity-20 pointer-events-none" />
    <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 z-10">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight">
        <div className="bg-yellow-400 p-1.5 rounded-lg text-slate-900"><Zap className="w-5 h-5" /></div>
        <span className="text-white">{data.businessName || "Volt Electric"}</span>
      </div>
      <button className="bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide">Free Estimate</button>
    </header>
    <main className="flex-1 p-8 relative z-10 flex flex-col justify-center">
      <div className="max-w-lg">
        <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest border border-yellow-400/20">
          <Shield className="w-3 h-3"/> Licensed & Certified
        </div>
        <h1 className="text-4xl font-black mb-4 leading-tight">Power Your Home <span className="text-yellow-400">Safely</span></h1>
        <p className="text-slate-400 mb-8 leading-relaxed">{data.seoTitle || "Licensed electricians serving your area. Panel upgrades, lighting, outlets, and EV charger installation."}</p>
        <div className="flex gap-3">
          <button className="bg-yellow-400 text-slate-900 px-6 py-3 rounded-lg font-black shadow-lg shadow-yellow-400/20">Free Estimate</button>
          <button className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold border border-slate-700">Our Work</button>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-4 gap-3">
        {[
          { icon: Zap, title: "Panel Upgrades" },
          { icon: Lightbulb, title: "Lighting" },
          { icon: Plug, title: "Outlets & Wiring" },
          { icon: BatteryCharging, title: "EV Chargers" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center backdrop-blur">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center"><s.icon className="w-5 h-5"/></div>
            <h3 className="font-bold text-[11px] text-slate-300">{s.title}</h3>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. ROOFING — Earthy red / gray
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const RoofingTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-stone-50 flex flex-col font-sans relative overflow-hidden text-slate-900 border-2 border-stone-200 rounded-xl shadow-lg animate-in zoom-in-95 duration-500">
    <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-red-600 to-stone-600" />
    <header className="px-6 py-4 flex items-center justify-between border-b border-stone-200 bg-white">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight text-stone-800">
        <div className="bg-red-600 p-1.5 rounded-lg text-white"><HardHat className="w-5 h-5" /></div>
        {data.businessName || "Apex Roofing"}
      </div>
      <div className="flex items-center gap-3 text-xs font-bold text-stone-500">
        <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-red-500"/>25yr Warranty</span>
      </div>
    </header>
    <main className="flex-1 p-8 relative">
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-40 -z-10" />
      <div className="max-w-lg">
        <h1 className="text-4xl font-black mb-4 leading-tight">Durable Roofs <span className="text-red-600">Built to Last</span></h1>
        <p className="text-stone-500 mb-6 leading-relaxed">{data.seoTitle || "Expert roofing in your area. Free inspections, storm damage repair, and full replacements with warranty."}</p>
        <div className="flex gap-3 mb-8">
          <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg">Free Inspection</button>
          <button className="bg-white border-2 border-stone-200 text-stone-700 px-6 py-3 rounded-lg font-bold">View Gallery</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: HardHat, title: "Roof Repairs", sub: "Shingle, tile & more" },
          { icon: Home, title: "Full Replacement", sub: "Complete re-roofing" },
          { icon: Shield, title: "Storm Damage", sub: "Insurance claims help" },
          { icon: Settings, title: "Metal Roofing", sub: "Modern & durable" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex items-start gap-3">
            <div className="bg-red-50 p-2 rounded-lg text-red-600"><s.icon className="w-5 h-5"/></div>
            <div><h3 className="font-bold text-sm text-stone-800">{s.title}</h3><p className="text-xs text-stone-400">{s.sub}</p></div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. HANDYMAN — Versatile green / gray
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const HandymanTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-white flex flex-col font-sans relative overflow-hidden text-slate-900 border-2 border-slate-200 rounded-xl shadow-lg animate-in fade-in duration-500">
    <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight text-emerald-900">
        <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><Hammer className="w-5 h-5" /></div>
        {data.businessName || "Fix-It Pro"}
      </div>
      <button className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Book Service</button>
    </header>
    <main className="flex-1 p-8 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -z-10" />
      <div className="max-w-md">
        <h1 className="text-4xl font-black mb-4 leading-tight">Your Trusted <span className="text-emerald-600">Handyman</span> — Fix It Right the First Time</h1>
        <p className="text-slate-500 mb-6 leading-relaxed">{data.seoTitle || "Professional handyman services. Painting, assembly, repairs, and yard work."}</p>
        <button className="bg-emerald-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-emerald-200">Book Service</button>
      </div>
      <div className="mt-8 grid grid-cols-4 gap-3">
        {[
          { icon: PaintBucket, title: "Painting" },
          { icon: Package, title: "Assembly" },
          { icon: Wrench, title: "Repairs" },
          { icon: TreePine, title: "Yard Work" },
        ].map((s, i) => (
          <div key={i} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><s.icon className="w-5 h-5"/></div>
            <h3 className="font-bold text-[11px]">{s.title}</h3>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        {[{n:"5-Star Reviews",v:"230+"},{n:"Years Experience",v:"12+"},{n:"Jobs Completed",v:"1,400+"}].map((s,i)=>(
          <div key={i} className="bg-slate-50 px-4 py-3 rounded-xl text-center flex-1">
            <div className="font-black text-lg text-emerald-700">{s.v}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{s.n}</div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. DENTIST — Calm mint / white
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const DentistTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-white flex flex-col font-serif relative overflow-hidden text-slate-800 border-2 border-slate-100 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
    <header className="px-8 py-5 flex items-center justify-between border-b border-teal-50 bg-white/50 backdrop-blur z-10">
      <div className="flex items-center gap-2 font-bold text-2xl tracking-wide text-teal-950">
        <Stethoscope className="w-6 h-6 text-teal-500" />
        {data.businessName || "Family Dental Clinic"}
      </div>
      <nav className="flex gap-6 text-sm font-medium text-slate-500">
        <span className="text-teal-600 border-b-2 border-teal-600 pb-1">Home</span>
        <span>Services</span>
        <span>Patients</span>
      </nav>
    </header>
    <main className="flex-1 p-10 flex flex-col items-center justify-center text-center z-10 relative">
      <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
        <Star className="w-3 h-3 fill-teal-700" /> Accepting New Patients
      </div>
      <h1 className="text-5xl font-bold mb-6 leading-tight text-teal-950 max-w-lg">A brighter smile for the <span className="text-teal-500 italic">whole family.</span></h1>
      <p className="text-slate-500 mb-10 text-lg max-w-md mx-auto">{data.seoTitle}</p>
      <button className="bg-teal-600 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-teal-200 flex items-center gap-2">
        <Calendar className="w-5 h-5" /> Book an Appointment
      </button>
      <div className="w-full grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-slate-100 text-left">
        <div className="flex flex-col"><h4 className="font-bold text-teal-900 mb-1">Teeth Whitening</h4><span className="text-xs text-slate-400">Professional cosmetic care</span></div>
        <div className="flex flex-col"><h4 className="font-bold text-teal-900 mb-1">Invisalign</h4><span className="text-xs text-slate-400">Clear, comfortable aligners</span></div>
        <div className="flex flex-col"><h4 className="font-bold text-teal-900 mb-1">Cleanings & Exams</h4><span className="text-xs text-slate-400">Preventive dental care</span></div>
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. GROCERY STORE — Vibrant green / white
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const GroceryTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-white flex flex-col font-sans relative overflow-hidden text-slate-900 border-2 border-green-100 rounded-xl shadow-lg animate-in zoom-in-95 duration-500">
    <header className="px-6 py-4 flex items-center justify-between border-b border-green-50 bg-green-600">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight text-white">
        <Leaf className="w-6 h-6" />
        {data.businessName || "Fresh Market"}
      </div>
      <div className="flex items-center gap-3">
        <button className="bg-white text-green-700 px-4 py-1.5 rounded-full text-xs font-bold">Weekly Deals</button>
        <button className="bg-green-700 text-white px-4 py-1.5 rounded-full text-xs font-bold border border-green-500"><ShoppingCart className="w-4 h-4 inline mr-1"/>Order</button>
      </div>
    </header>
    <main className="flex-1 relative">
      <div className="bg-gradient-to-br from-green-50 to-white p-8">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest">
            <Leaf className="w-3 h-3"/> Shop Local, Eat Better
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">Fresh <span className="text-green-600">Neighborhood</span> Groceries</h1>
          <p className="text-slate-500 mb-6 leading-relaxed">{data.seoTitle || "Farm-fresh produce, artisan bakery, premium meats — all from local partners."}</p>
          <div className="flex gap-3">
            <button className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg">Browse Deals</button>
            <button className="bg-white border-2 border-green-200 text-green-700 px-6 py-3 rounded-full font-bold flex items-center gap-2"><Truck className="w-4 h-4"/>Delivery</button>
          </div>
        </div>
      </div>
      <div className="px-8 pb-6 grid grid-cols-4 gap-3">
        {[
          { icon: Apple, title: "Fresh Produce", color: "green" },
          { icon: CakeSlice, title: "Bakery", color: "amber" },
          { icon: Beef, title: "Premium Meats", color: "red" },
          { icon: Leaf, title: "Organic", color: "emerald" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
            <div className={`mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center ${s.color === 'green' ? 'bg-green-50 text-green-600' : s.color === 'amber' ? 'bg-amber-50 text-amber-600' : s.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}><s.icon className="w-5 h-5"/></div>
            <h3 className="font-bold text-xs">{s.title}</h3>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. HARDWARE STORE — Industrial orange / black
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const HardwareTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-zinc-900 flex flex-col font-sans relative overflow-hidden text-white border-2 border-zinc-700 rounded-xl shadow-2xl animate-in slide-in-from-right duration-500">
    <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-yellow-500" />
    <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900">
      <div className="flex items-center gap-2 font-black text-xl tracking-tight uppercase">
        <div className="bg-orange-500 p-1.5 rounded-lg text-white"><Hammer className="w-5 h-5" /></div>
        {data.businessName || "BuildRight Hardware"}
      </div>
      <button className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide">Shop Now</button>
    </header>
    <main className="flex-1 p-8 relative flex flex-col justify-center">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-10 -z-10" />
      <div className="max-w-lg">
        <h1 className="text-4xl font-black mb-4 leading-tight uppercase tracking-tight">Tools & Supplies for <span className="text-orange-400">Every Project</span></h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">{data.seoTitle || "Power tools, lumber, paint, rentals — plus expert advice from our team."}</p>
        <button className="bg-orange-500 text-white px-8 py-3.5 rounded-lg font-black shadow-lg shadow-orange-500/20 uppercase tracking-wide">Shop Now</button>
      </div>
      <div className="mt-8 grid grid-cols-4 gap-3">
        {[
          { icon: Zap, title: "Power Tools" },
          { icon: Ruler, title: "Lumber" },
          { icon: PaintBucket, title: "Paint" },
          { icon: Package, title: "Rentals" },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 text-center">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center"><s.icon className="w-5 h-5"/></div>
            <h3 className="font-bold text-[11px] text-zinc-300">{s.title}</h3>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// MECHANIC — Dark industrial
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const MechanicTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-[#111] flex flex-col font-mono relative overflow-hidden text-zinc-300 border-2 border-zinc-800 rounded-xl shadow-2xl animate-in slide-in-from-right duration-500">
    <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
    <header className="px-6 py-5 flex items-center justify-between border-b border-zinc-900/50 bg-[#161616]">
      <div className="flex items-center gap-3 font-bold text-xl uppercase tracking-widest text-white">
        <Car className="w-6 h-6 text-red-500" />
        {data.businessName || "Torque Auto"}
      </div>
      <button className="border border-red-900/30 bg-red-950/20 text-red-500 px-4 py-1.5 rounded text-xs font-bold uppercase">Get an Estimate</button>
    </header>
    <main className="flex-1 flex flex-col justify-end p-8 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-0"/>
      <div className="z-10 bg-zinc-900/80 backdrop-blur-md p-6 rounded border border-zinc-800 max-w-lg mb-8">
        <h1 className="text-3xl font-black mb-3 text-white uppercase tracking-tight">{data.seoTitle || "Honest mechanics. Fair pricing. Fast turnaround."}</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">Foreign and domestic. We diagnose it right the first time.</p>
        <div className="flex bg-black p-1 rounded">
           <div className="flex-1 bg-zinc-800 text-white text-center py-2 text-xs font-bold rounded shadow uppercase">Oil Change</div>
           <div className="flex-1 text-zinc-500 text-center py-2 text-xs font-bold rounded uppercase">Brake Repair</div>
           <div className="flex-1 text-zinc-500 text-center py-2 text-xs font-bold rounded uppercase">Diagnostics</div>
        </div>
      </div>
      <div className="z-10 flex items-center justify-between border-t border-zinc-800 pt-6">
         <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 tracking-wider"><MapPin className="w-4 h-4"/> {data.serviceArea || "ENGINE ROAD, TX"}</div>
         <div className="flex gap-1">{[1,2,3,4,5].map(i=><Star key={i} className="w-4 h-4 fill-yellow-600 text-yellow-600"/>)}</div>
      </div>
    </main>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// GENERIC FALLBACK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
const GenericTemplate = ({ data }: any) => (
  <div className="w-full h-full bg-slate-50 flex flex-col font-sans p-10 border border-slate-200 rounded-xl justify-center items-center text-center shadow">
    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6"><Sparkles className="w-8 h-8"/></div>
    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{data.businessName || "Your Local Business"}</h1>
    <p className="text-lg text-slate-500 max-w-md">{data.seoTitle || "Professional services dedicated to excellence and community satisfaction."}</p>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGISTRY & TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━
export type TemplateId = 
  | "plumber" 
  | "electrician" 
  | "hvac" 
  | "mechanic" 
  | "dentist" 
  | "roofing"
  | "handyman"
  | "grocery"
  | "hardware"
  | "generic";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  component: ComponentType<{ data: any }>;
  colorPalette: { primary: string; secondary: string };
}

export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateDefinition> = {
  plumber:     { id: "plumber",     name: "The Plumber Pro",     description: "Trust-first, emergency-focused design.",       component: PlumberTemplate,     colorPalette: { primary: "#3B82F6", secondary: "#1E3A8A" } },
  hvac:        { id: "hvac",        name: "Arctic HVAC",         description: "Icy blue to warm orange gradient.",             component: HVACTemplate,        colorPalette: { primary: "#4F9CF9", secondary: "#F97316" } },
  electrician: { id: "electrician", name: "Volt Electric",       description: "Yellow energetic, dark safety theme.",          component: ElectricianTemplate, colorPalette: { primary: "#FCD34D", secondary: "#1E293B" } },
  roofing:     { id: "roofing",     name: "Apex Roofing",        description: "Earthy red/gray, storm damage ready.",          component: RoofingTemplate,     colorPalette: { primary: "#EF4444", secondary: "#44403C" } },
  handyman:    { id: "handyman",    name: "Fix-It Handyman",     description: "Versatile green, card-based layout.",           component: HandymanTemplate,    colorPalette: { primary: "#10B981", secondary: "#064E3B" } },
  dentist:     { id: "dentist",     name: "Smile Dental",        description: "Calm mint, elegant family-friendly.",           component: DentistTemplate,     colorPalette: { primary: "#14B8A6", secondary: "#042F2E" } },
  grocery:     { id: "grocery",     name: "Fresh Market",        description: "Vibrant green, farm-fresh product focus.",      component: GroceryTemplate,     colorPalette: { primary: "#16A34A", secondary: "#14532D" } },
  hardware:    { id: "hardware",    name: "BuildRight Hardware", description: "Industrial orange/black, rugged & bold.",       component: HardwareTemplate,    colorPalette: { primary: "#F97316", secondary: "#0A0A0A" } },
  mechanic:    { id: "mechanic",    name: "Torque Auto",         description: "Industrial dark theme for auto shops.",         component: MechanicTemplate,    colorPalette: { primary: "#334155", secondary: "#0F172A" } },
  generic:     { id: "generic",     name: "Modern Business",     description: "Flexible fallback for any local service.",      component: GenericTemplate,     colorPalette: { primary: "#64748B", secondary: "#1E293B" } },
};

export function getTemplateComponent(templateId: TemplateId | string): ComponentType<{ data: any }> {
  if (!TEMPLATE_REGISTRY[templateId as TemplateId]) {
    return TEMPLATE_REGISTRY.generic.component;
  }
  return TEMPLATE_REGISTRY[templateId as TemplateId].component;
}
