"use client";

import { use, useEffect, useState, useRef } from "react";
import { Camera, Mic, ShieldCheck, CheckCircle2, Square } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function QuickPostPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Validate token by checking with the server — no hardcoded bypass
    const validateToken = async () => {
      try {
        const res = await fetch("/api/posts/validate-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setIsValidToken(data.valid === true);
      } catch {
        setIsValidToken(false);
      }
      setIsAuthenticating(false);
    };
    validateToken();
  }, [token]);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Could not access microphone.");
    }
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsSubmitting(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voicenote.webm');
          const transcribeRes = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await transcribeRes.json();
          const transcribedText = data.text || "Voice message update";
          await handleSubmit('voice', transcribedText);
        } catch (e) {
          console.error("Failed to transcribe:", e);
          await handleSubmit('voice', "Voice message update (transcription failed)");
        }
      };
      recorder.stop();
      recorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async (type: 'photo' | 'voice', content: string = "") => {
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          type,
          content,
          isDemoMessage: false
        }),
      });

      if (!res.ok) throw new Error("Failed to post update");

      setIsDone(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong connecting to the AI.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full text-red-500 mb-4">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Session expired</h1>
        <p className="text-slate-600 mb-8">Scan the QR code on your dashboard to post a new update.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-500 text-white p-4 rounded-full mb-6 shadow-xl shadow-emerald-200">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-black text-emerald-900 mb-2">Uploaded!</h1>
        <p className="text-emerald-700 font-medium text-lg mb-10">We are updating your website and Google profile.</p>
        <Button 
          variant="outline" 
          className="border-emerald-200 text-emerald-700 bg-white"
          onClick={() => setIsDone(false)}
        >
          Send another update
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 text-center">
        <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">Send your work update<br/>in 5 seconds</h1>
        <p className="text-slate-500 mb-8">Tap a button below to update your website.</p>

        <div className="grid gap-4 w-full">
          <button 
            onClick={() => handleSubmit('photo')} 
            disabled={isSubmitting}
            className="flex items-center justify-center gap-4 bg-slate-900 hover:bg-slate-800 text-white h-20 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-7 h-7" /> Upload Photo
              </>
            )}
          </button>

          {isRecording ? (
            <button 
              onClick={stopVoiceRecording} 
              className="flex items-center justify-center gap-4 bg-red-500 hover:bg-red-600 text-white h-20 rounded-2xl font-bold text-lg shadow-xl shadow-red-500/20 transition-transform active:scale-95 animate-pulse"
            >
              <Square className="w-7 h-7 fill-current" /> Stop Recording
            </button>
          ) : (
            <button 
              onClick={startVoiceRecording} 
              disabled={isSubmitting}
              className="flex items-center justify-center gap-4 bg-blue-500 hover:bg-blue-600 text-white h-20 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Mic className="w-7 h-7" /> Record Voice
                </>
              )}
            </button>
          )}
        </div>
        
        <p className="text-xs font-semibold text-slate-400 mt-8 uppercase tracking-widest">
          Secure connection • acmeplumbing.com
        </p>
      </div>
    </div>
  );
}
