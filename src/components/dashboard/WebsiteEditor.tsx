"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TEMPLATE_REGISTRY } from "@/lib/templates";
import { Loader2, X, Plus, Trash2, ArrowUp, ArrowDown, Save, Upload } from "lucide-react";

/**
 * "Make it yours" editor — content only.
 *
 * Customer-writable: words, photos, look (palette), business info.
 * LOCKED (never shown, never sent, stripped server-side): SEO title/description,
 * keywords, FAQs, structured data, rating/reviews, domain.
 */

type Props = {
  siteId: string;
  initialContent: any;
  onClose: () => void;
  onSaved: () => void;
};

const TABS = ["Words", "Photos", "Look", "Info"] as const;
type Tab = (typeof TABS)[number];

const LIMITS = { tagline: 60, headline: 90, subheadline: 200, about: 1000, serviceTitle: 60, serviceDesc: 140 };

export default function WebsiteEditor({ siteId, initialContent, onClose, onSaved }: Props) {
  const c0 = initialContent || {};
  const [tab, setTab] = useState<Tab>("Words");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  const [tagline, setTagline] = useState<string>(c0.tagline || "");
  const [headline, setHeadline] = useState<string>(c0.hero?.headline || "");
  const [subheadline, setSubheadline] = useState<string>(c0.hero?.subheadline || "");
  const [about, setAbout] = useState<string>(c0.about || "");
  const [services, setServices] = useState<{ title: string; description: string }[]>(
    Array.isArray(c0.services)
      ? c0.services.map((s: any) => ({ title: s.title || "", description: s.description || "" }))
      : []
  );
  const [photos, setPhotos] = useState<string[]>(Array.isArray(c0.photos) ? c0.photos : []);
  const [phone, setPhone] = useState<string>(c0.phone || "");
  const [address, setAddress] = useState<string>(c0.address || "");
  const [hours, setHours] = useState<string[]>(Array.isArray(c0.hours) ? c0.hours : []);
  const [reviewLink, setReviewLink] = useState<string>(c0.reviewLink || "");
  const [mapUrl, setMapUrl] = useState<string>(c0.mapUrl || "");
  const [showHours, setShowHours] = useState<boolean>(c0.showHours !== false);
  const [showReviews, setShowReviews] = useState<boolean>(c0.showReviews !== false);
  const [showGallery, setShowGallery] = useState<boolean>(c0.showGallery !== false);
  const [templateId, setTemplateId] = useState<string>(c0.templateId || "generic");
  // Colour variation of the chosen template (TEMPLATE_LOOKS variations).
  const [templateVariation, setTemplateVariation] = useState<string>(
    c0.templateVariation || "classic"
  );

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          action: "save_content",
          patch: {
            tagline,
            hero: { headline, subheadline },
            about,
            services,
            photos,
            phone,
            address,
            hours,
            reviewLink,
            mapUrl,
            showHours,
            showReviews,
            showGallery,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Could not save your changes.");
        return;
      }
      setNotice("✅ Saved! Your website is updated.");
      setPreviewKey((k) => k + 1);
      onSaved();
    } catch {
      setError("Could not save your changes.");
    } finally {
      setBusy(false);
    }
  };

  // Choose a template, and optionally one of its colour variations
  // (TEMPLATE_LOOKS). Picking a different template resets to its default.
  const applyTemplate = async (id: string, variation?: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    const nextVariation =
      variation || (id === templateId ? templateVariation : "classic");
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          action: "set_template",
          templateId: id,
          variation: nextVariation,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Could not change the look.");
        return;
      }
      setTemplateId(id);
      setTemplateVariation(nextVariation);
      setNotice("🎨 New look applied!");
      setPreviewKey((k) => k + 1);
      onSaved();
    } catch {
      setError("Could not change the look.");
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("websiteId", siteId);
      const res = await fetch("/api/websites/media", {
        method: "POST",
        headers: await authHeader(),
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        setError(json?.error || "Could not upload that photo.");
        return;
      }
      setPhotos((p) => [...p, json.url].slice(0, 8));
      setNotice("📷 Photo added — press Save to publish it.");
    } catch {
      setError("Could not upload that photo.");
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    setServices((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start md:items-center justify-center overflow-y-auto p-3 md:p-6">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Make it yours</h3>
            <p className="text-xs text-slate-400 font-bold">
              Changes go live when you save — nothing here can break your website.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50"
            aria-label="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 text-red-800 rounded-2xl border border-red-100 text-sm font-semibold">
            {error}
          </div>
        )}
        {notice && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-100 text-sm font-semibold">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* ── Editor column ── */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── WORDS ── */}
            {tab === "Words" && (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Tagline <span className="font-bold normal-case">({tagline.length}/{LIMITS.tagline})</span>
                  </span>
                  <input
                    value={tagline}
                    maxLength={LIMITS.tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Main headline <span className="font-bold normal-case">({headline.length}/{LIMITS.headline})</span>
                  </span>
                  <input
                    value={headline}
                    maxLength={LIMITS.headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Sub-headline{" "}
                    <span className="font-bold normal-case">({subheadline.length}/{LIMITS.subheadline})</span>
                  </span>
                  <textarea
                    value={subheadline}
                    maxLength={LIMITS.subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    About <span className="font-bold normal-case">({about.length}/{LIMITS.about})</span>
                  </span>
                  <textarea
                    value={about}
                    maxLength={LIMITS.about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={5}
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>


                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Services ({services.length}/6 — minimum 2)
                  </span>
                  {services.map((s, i) => (
                    <div key={i} className="p-3 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={s.title}
                          maxLength={LIMITS.serviceTitle}
                          placeholder="Service name"
                          onChange={(e) =>
                            setServices((prev) => prev.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))
                          }
                          className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400"
                        />
                        <button onClick={() => move(i, -1)} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50" aria-label="Move up">
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button onClick={() => move(i, 1)} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50" aria-label="Move down">
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setServices((prev) => prev.filter((_, k) => k !== i))}
                          className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          aria-label="Remove service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        value={s.description}
                        maxLength={LIMITS.serviceDesc}
                        placeholder="Short description (optional)"
                        onChange={(e) =>
                          setServices((prev) => prev.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)))
                        }
                        className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
                      />
                    </div>
                  ))}
                  {services.length < 6 && (
                    <button
                      onClick={() => setServices((prev) => [...prev, { title: "", description: "" }])}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:text-slate-900 hover:border-emerald-300 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add a service
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-bold">
                  💡 Your search-engine details (title, description, FAQs) are written and protected automatically — you never need to touch them.
                </p>
              </div>
            )}

            {/* ── PHOTOS ── */}
            {tab === "Photos" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 font-medium">
                  Show off your work. Up to 8 photos — the first one is the biggest.
                </p>
                <label className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:text-slate-900 hover:border-emerald-300 transition-all cursor-pointer">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload a photo (JPG/PNG, max 5MB)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPhoto(f);
                      e.target.value = "";
                    }}
                  />
                </label>

                {photos.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold">
                    No photos yet — we&apos;ll use the ones from your Google listing until you add your own.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((p, i) => (
                      <div key={i} className="relative rounded-2xl overflow-hidden border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover" />
                        <button
                          onClick={() => setPhotos((prev) => prev.filter((_, k) => k !== i))}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* ── LOOK ── */}
            {tab === "Look" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 font-medium">
                  Pick the style that fits your trade, then choose a colour way. Your words and
                  photos stay the same.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(TEMPLATE_REGISTRY).map((tpl: any) => {
                    const active = templateId === tpl.id;
                    return (
                      <div key={tpl.id} className="space-y-2">
                        <button
                          onClick={() => applyTemplate(tpl.id)}
                          disabled={busy}
                          className={`w-full p-2.5 rounded-2xl border-2 text-left transition-all disabled:opacity-60 ${
                            active ? "border-emerald-500 bg-emerald-50/40" : "border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          {/* Live mini preview — the real template component,
                              scaled down, so the trader can see the look
                              before choosing it. */}
                          <div className="relative w-full h-24 mb-2 rounded-xl overflow-hidden border border-slate-200 bg-white pointer-events-none">
                            <div
                              className="absolute top-0 left-0 origin-top-left"
                              style={{ transform: "scale(0.185)", width: "540%", height: "540%" }}
                            >
                              <tpl.component
                                data={{
                                  businessName: "Your Business",
                                  seoTitle: "Licensed, insured and trusted locally.",
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-1.5 mb-1">
                            <span className="w-5 h-5 rounded-lg" style={{ backgroundColor: tpl.colorPalette.primary }} />
                            <span className="w-5 h-5 rounded-lg" style={{ backgroundColor: tpl.colorPalette.secondary }} />
                          </div>
                          <p className="text-xs font-black text-slate-900">{tpl.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold leading-snug">{tpl.description}</p>
                          {active && <p className="text-[10px] font-black text-emerald-700 mt-1">✓ Current look</p>}
                        </button>

                        {/* Colour ways — only for the chosen template */}
                        {active && Array.isArray(tpl.variations) && (
                          <div className="pl-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Colour
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {tpl.variations.map((v: any) => {
                                const on = templateVariation === v.id;
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => applyTemplate(tpl.id, v.id)}
                                    disabled={busy}
                                    title={v.name}
                                    className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full border-2 transition-all disabled:opacity-60 ${
                                      on ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                                    }`}
                                  >
                                    <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: v.primary }} />
                                    <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: v.secondary }} />
                                    <span className="text-[10px] font-bold text-slate-600">{v.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* ── INFO ── */}
            {tab === "Info" && (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone number</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                  <span className="text-[11px] text-slate-400 font-bold">This powers your Call and WhatsApp buttons.</span>
                </label>

                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Address shown on site</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Opening hours</span>
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-500">
                      <input type="checkbox" checked={showHours} onChange={(e) => setShowHours(e.target.checked)} />
                      Show on site
                    </label>
                  </div>
                  {hours.map((h, i) => (
                    <input
                      key={i}
                      value={h}
                      maxLength={60}
                      onChange={(e) => setHours((prev) => prev.map((x, k) => (k === i ? e.target.value : x)))}
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
                    />
                  ))}
                  {hours.length < 7 && (
                    <button
                      onClick={() => setHours((prev) => [...prev, ""])}
                      className="text-[11px] font-black text-emerald-700 hover:underline"
                    >
                      + Add a day
                    </button>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500">
                    <input type="checkbox" checked={showReviews} onChange={(e) => setShowReviews(e.target.checked)} />
                    Show Google reviews section
                  </label>
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500">
                    <input type="checkbox" checked={showGallery} onChange={(e) => setShowGallery(e.target.checked)} />
                    Show photo gallery
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Google review link</span>
                  <input
                    value={reviewLink}
                    onChange={(e) => setReviewLink(e.target.value)}
                    placeholder="https://g.page/r/..."
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Map / directions link</span>
                  <input
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="mt-1.5 w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                  />
                </label>

                <p className="text-[11px] text-slate-400 font-bold">
                  🔒 Your domain, hosting and search-engine settings are managed by Neerzy and can&apos;t be changed here.
                </p>
              </div>
            )}
          </div>


          {/* ── Live preview column ── */}
          <div className="hidden lg:flex flex-col border-l border-slate-100 bg-slate-50">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Live preview</span>
              <a
                href={`/site/preview/${siteId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-black text-emerald-700 hover:underline"
              >
                Open full size ↗
              </a>
            </div>
            <iframe
              key={previewKey}
              src={`/site/preview/${siteId}`}
              title="Website preview"
              className="flex-1 w-full min-h-[420px] bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <p className="text-[11px] text-slate-400 font-bold">
            🔒 SEO, FAQs and structured data are generated and protected automatically.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-xs font-black text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              Close
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

