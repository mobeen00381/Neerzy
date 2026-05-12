"use client";

import { useState } from "react";
import { Send, Image as ImageIcon, Mic, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "bot";
  type: "text" | "image" | "audio";
  content: string;
}

export default function WhatsAppSimulator() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", type: "text", content: "Hey! 👷‍♂️ Ready to update your website and Google My Business? Just send me a quick text, photo, or voice note of your latest job!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // The generated SEO/GMB data returned from the API
  const [generatedData, setGeneratedData] = useState<{seoTitle?: string, gmbPost?: string, websiteHtmlParagraphs?: string} | null>(null);

  const handleSendText = async (text: string) => {
    if (!text) return;
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: "user", type: "text", content: text }]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate sending data like Twilio does (FormData)
      const formData = new FormData();
      formData.append("From", "whatsapp:+1234567890");
      formData.append("Body", text);
      formData.append("NumMedia", "0");

      const response = await fetch("/api/whatsapp", {
        method: "POST",
        body: formData
      });

      const xmlText = await response.text();
      
      // Basic XML parsing to extract the TwiML <Message> text
      const replyMatch = xmlText.match(/<Message>([\s\S]*?)<\/Message>/);
      const botReply = replyMatch ? replyMatch[1] : "Sorry, I didn't catch that.";

      setMessages(prev => [...prev, { role: "bot", type: "text", content: botReply }]);
      
      // Mock parsing the generated data from the webhook for the visual dashboard on the right
      setGeneratedData({
         seoTitle: "Emergency Leak Repair and Valve Replacement in Austin, TX",
         websiteHtmlParagraphs: "Whenever you experience a sudden leak, quick action is essential. Today, our team responded to an emergency call in downtown Austin. We quickly identified a burst main line valve in the master bathroom. We successfully replaced the copper piping, installed a durable new shut-off valve, and verified there were no further leaks. Our 24/7 rapid response ensures your property stays safe from water damage.",
         gmbPost: "🚨 Bathroom leak? We just finished an emergency master bathroom repair in Austin! Valve replaced and leak stopped. Calls us today for 24/7 service! ☎️"
      });

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", type: "text", content: "Error connecting to AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMockMedia = async (type: "image" | "audio") => {
    const text = type === "image" ? "📸 Sent an image" : "🎤 Sent a voice note (0:14)";
    setMessages(prev => [...prev, { role: "user", type, content: text }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("From", "whatsapp:+1234567890");
      formData.append("Body", "");
      formData.append("NumMedia", "1");
      formData.append("MediaUrl0", "https://mock-image-url.com");
      formData.append("MediaContentType0", type === "image" ? "image/jpeg" : "audio/ogg");

      const response = await fetch("/api/whatsapp", {
        method: "POST",
        body: formData
      });

      const xmlText = await response.text();
      const replyMatch = xmlText.match(/<Message>([\s\S]*?)<\/Message>/);
      const botReply = replyMatch ? replyMatch[1] : "Sorry, I didn't catch that.";

      setMessages(prev => [...prev, { role: "bot", type: "text", content: botReply }]);
      
      setGeneratedData({
         seoTitle: type === "image" ? "New Split AC HVAC Unit Installation" : "Emergency Leak Repair and Valve Replacement in Austin, TX",
         websiteHtmlParagraphs: type === "image" 
           ? "Today we completed a full installation of a modern, energy-efficient HVAC split system on a residential roof in Austin. Proper ductwork and elevated mounting ensure maximum longevity and cooling power for the extreme Texas summers." 
           : "Whenever you experience a sudden leak, quick action is essential...",
         gmbPost: type === "image" 
           ? "We love installing these beautiful new HVAC units! ❄️ Perfect cooling for residential homes. Need an AC upgrade before summer? Call us today! 📞" 
           : "🚨 Bathroom leak? We just finished an emergency master bathroom repair in Austin! Valve replaced and leak stopped. Calls us today for 24/7 service! ☎️"
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col md:flex-row gap-8">
      
      {/* LEFT: WhatsApp Phone Simulator */}
      <div className="flex-1 max-w-sm mx-auto w-full flex flex-col items-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">💬 Interactive AI Demo</h2>
        
        <div className="w-full h-[700px] bg-[#efeae2] rounded-[40px] border-[12px] border-slate-900 shadow-2xl flex flex-col overflow-hidden relative">
          {/* Phone Header */}
          <div className="bg-[#075e54] text-white p-4 flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">AI</div>
             <div>
               <div className="font-bold">Neerzy Bot</div>
               <div className="text-xs text-green-100">online</div>
             </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg shadow-sm text-sm ${
                    msg.role === "user" ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none whitespace-pre-wrap"
                  }`}>
                    {msg.type === "image" && <div className="w-full h-32 bg-slate-300 rounded mb-2 flex items-center justify-center text-slate-500"><ImageIcon /></div>}
                    {msg.type === "audio" && <div className="w-full h-10 bg-green-500/20 rounded mb-2 flex flex-col justify-center px-4 rounded-full border border-green-500/30 text-green-800 font-bold text-xs"><Mic className="w-4 h-4 inline mr-2"/> Voice Note</div>}
                    {msg.content}
                  </div>
                </div>
             ))}
             {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-slate-500 flex items-center gap-2">
                   <RefreshCw className="w-4 h-4 animate-spin" /> Thinking...
                 </div>
               </div>
             )}
          </div>

          {/* Message Input */}
          <div className="bg-[#f0f0f0] p-3 flex items-center gap-2">
             <div className="flex-1 bg-white rounded-full flex items-center px-4 py-2 gap-3 shadow-sm">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendText(input)}
                  placeholder="Type a message"
                  className="flex-1 outline-none border-none text-sm bg-transparent"
                  disabled={isLoading}
                />
             </div>
             {input ? (
               <button onClick={() => handleSendText(input)} className="w-10 h-10 bg-[#128c7e] rounded-full flex items-center justify-center text-white shrink-0 hover:bg-[#075e54] transition-colors">
                  <Send className="w-4 h-4 ml-1" />
               </button>
             ) : (
               <>
                 <button onClick={() => handleSendMockMedia("image")} title="Simulate sending a photo" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 shrink-0 shadow-sm hover:text-blue-500">
                    <ImageIcon className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleSendMockMedia("audio")} title="Simulate sending a voice note" className="w-10 h-10 bg-[#128c7e] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm hover:bg-[#075e54]">
                    <Mic className="w-5 h-5" />
                 </button>
               </>
             )}
          </div>
        </div>
      </div>

      {/* RIGHT: Live Generated Result Simulator */}
      <div className="flex-2 w-full lg:max-w-3xl flex flex-col gap-6">
         <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Live Website Post Preview</h2>
            <p className="text-slate-500 mb-8 border-b border-slate-100 pb-4">This is how the AI automatically translates your quick WhatsApp text into a beautiful, SEO-optimized website post.</p>
            
            {generatedData ? (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-blue-600 font-bold mb-2">Blog / Recent Projects</div>
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">{generatedData.seoTitle}</h1>
                  <div className="prose prose-slate max-w-none mb-8 text-slate-700 leading-relaxed text-lg bg-slate-50 p-6 rounded-xl border border-slate-100">
                     {generatedData.websiteHtmlParagraphs}
                  </div>
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <RefreshCw className="w-8 h-8 mb-4 text-slate-300" />
                  <p>Send a message in the phone simulator to see the AI generation.</p>
               </div>
            )}
         </div>

         <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-xl font-black text-slate-900 mb-2">Google My Business API Preview</h2>
            <p className="text-slate-500 mb-6">Optimized specifically for local map rankings.</p>
            
            {generatedData ? (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 border border-slate-200 rounded-xl overflow-hidden max-w-sm shadow-sm">
                  <div className="bg-slate-100 h-40 w-full flex items-center justify-center text-slate-400"><ImageIcon className="w-8 h-8 opacity-50"/></div>
                  <div className="p-4 bg-white">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>
                        <span className="font-bold text-sm text-slate-900">Your Business Name</span>
                     </div>
                     <p className="text-sm text-slate-800 leading-relaxed">{generatedData.gmbPost}</p>
                     <div className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 font-bold text-center rounded-full text-xs">Learn More</div>
                  </div>
               </div>
            ) : (
               <div className="p-4 text-sm text-slate-400">Awaiting input...</div>
            )}
         </div>
      </div>

    </div>
  );
}
