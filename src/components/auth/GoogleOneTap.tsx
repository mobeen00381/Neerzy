'use client';
import { useEffect } from 'react';

interface GoogleOneTapProps {
  onCredentialResponse: (res: any) => void;
}

export default function GoogleOneTap({ onCredentialResponse }: GoogleOneTapProps) {
  useEffect(() => {
    // Check if the script is loaded
    const checkGoogle = setInterval(() => {
      // @ts-ignore
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        clearInterval(checkGoogle);
        
        // @ts-ignore
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: onCredentialResponse,
          auto_select: true,
          itp_support: true,
        });
        
        // @ts-ignore
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log("One Tap not displayed:", notification.getNotDisplayedReason());
          }
          if (notification.isSkippedMoment()) {
            console.log("One Tap skipped:", notification.getSkippedReason());
          }
        });
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, [onCredentialResponse]);

  return null; // Invisible component
}
