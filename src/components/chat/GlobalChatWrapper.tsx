"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isTraderSitePath } from "@/lib/routes";

/**
 * The chat widget (launcher buttons + panel) is not needed to paint the page,
 * so its bundle is code-split and only requested once the page has finished
 * loading — it must never compete with the hero image for bandwidth.
 */
const SupportChat = dynamic(
  () => import("./SupportChat").then((mod) => mod.SupportChat),
  { ssr: false }
);

export function GlobalChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);
  const pathname = usePathname();

  // Fetch the chat chunk after the page load event (or immediately when the
  // user arrives on an already-loaded document).
  useEffect(() => {
    if (document.readyState === "complete") {
      setIsChatReady(true);
      return;
    }

    const handleLoad = () => setIsChatReady(true);
    window.addEventListener("load", handleLoad, { once: true });
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  useEffect(() => {
    // Check if the user has a stored preference 
    const stored = localStorage.getItem("seo_junction_chat_interacted");
    if (stored) {
      setHasInteracted(true);
      return; 
    }

    // Auto-pop the chat after 5 seconds if they haven't interacted yet
    const timer = setTimeout(() => {
      if (!hasInteracted && !hasAutoOpened) {
        setIsOpen(true);
        setHasAutoOpened(true);
      }
    }, 5000);

    const handleCustomOpen = () => {
      setIsOpen(true);
      setHasInteracted(true);
      localStorage.setItem("seo_junction_chat_interacted", "true");
    };

    window.addEventListener("open-ai-chat", handleCustomOpen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("open-ai-chat", handleCustomOpen);
    };
  }, [hasInteracted, hasAutoOpened]);

  // When the user explicitly closes or opens the chat, mark it as interacted
  const handleOpenStatusChange = (newStatus: boolean) => {
    setIsOpen(newStatus);
    setHasInteracted(true);
    localStorage.setItem("seo_junction_chat_interacted", "true");
  };

  // A trader's own website never shows Neerzy's support chat.
  if (isTraderSitePath(pathname)) return null;

  // Nothing to render (or fetch) until the page has loaded.
  if (!isChatReady) return null;

  return (
    <>
      <SupportChat 
        isOpen={isOpen} 
        setIsOpen={handleOpenStatusChange} 
        showBadge={!isOpen && hasAutoOpened && !hasInteracted}
      />
    </>
  );
}
