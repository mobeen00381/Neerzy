import { SVGProps, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Smartphone, QrCode, ArrowRight, Copy, Check } from "lucide-react";

export function QuickPostQR() {
  const [token, setToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // In a real app, this would be a secure, time-limited token from the DB
    setToken("user_auth_token_778899");
    setBaseUrl(window.location.origin);
  }, []);

  const quickPostUrl = `${baseUrl}/quick-post/${token}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(quickPostUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone className="h-4 w-4 text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Fast Field Updates</span>
        </div>
        <CardTitle className="text-lg font-bold">Quick Mobile Link</CardTitle>
        <CardDescription className="text-xs">
          Scan to open the AI Assistant on your phone. No app install or login required.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 mb-4 transition-transform hover:scale-105 duration-300">
          <QRCodeSVG 
            value={quickPostUrl} 
            size={120}
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="w-full space-y-3">
          <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-white/50 p-2 rounded-lg border border-slate-100">
            <QrCode className="h-4 w-4 text-blue-400 shrink-0" />
            <p>Scan with your phone camera to instantly start posting photos and voice notes.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            <button 
              onClick={copyToClipboard}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button 
              onClick={() => window.open(quickPostUrl, '_blank')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors group"
            >
              <span>Preview UI</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
