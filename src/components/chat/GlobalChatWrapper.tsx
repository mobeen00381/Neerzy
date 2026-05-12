"use client";

import { useState, useEffect } from "react";
import { SupportChat } from "./SupportChat";

export function GlobalChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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
