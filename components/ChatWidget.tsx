"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  MessageCircle, 
  X, 
  Send, 
  Phone, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  CheckCheck,
  User,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "CUSTOMER" | "STORE";
  text: string;
  createdAt: string;
  isRead: boolean;
}

const FAQ_SUGGESTIONS = [
  "🚚 สอบถามเรื่องจัดส่ง / ค่าจัดส่ง",
  "📦 สอบถามสินค้า / เช็คของในสต็อก",
  "⏰ เวลาเปิด-ปิด หน้าร้าน",
  "📍 ร้านตั้งอยู่ที่ไหน",
];

export function ChatWidget() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestId, setGuestId] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [unreadRepliesCount, setUnreadRepliesCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize persistent guest ID if not logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedGuestId = localStorage.getItem("chat_guest_id");
      if (!storedGuestId) {
        storedGuestId = "guest_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem("chat_guest_id", storedGuestId);
      }
      setGuestId(storedGuestId);

      const savedName = localStorage.getItem("chat_guest_name") || "";
      const savedPhone = localStorage.getItem("chat_guest_phone") || "";
      setGuestName(savedName);
      setGuestPhone(savedPhone);
    }
  }, []);

  // Fetch messages function
  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams();
      if (user?.id) {
        params.append("userId", user.id);
      }
      if (guestId) {
        params.append("guestId", guestId);
      }

      if (!user?.id && !guestId) return;

      const res = await fetch(`/api/chat/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const msgList: Message[] = data.messages || [];
        setMessages(msgList);

        // Count unread replies from store if closed
        if (!isOpen) {
          const unread = msgList.filter(m => m.sender === "STORE" && !m.isRead).length;
          setUnreadRepliesCount(unread);
        } else {
          setUnreadRepliesCount(0);
        }
      }
    } catch (err) {
      console.error("Error polling chat messages:", err);
    }
  };

  // Poll messages periodically
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    fetchMessages();

    // Poll every 4 seconds when chat is open, or 12 seconds when closed
    const intervalTime = isOpen ? 3500 : 12000;
    const interval = setInterval(fetchMessages, intervalTime);
    return () => clearInterval(interval);
  }, [isOpen, user?.id, guestId, pathname]);

  // Scroll to bottom when messages update or modal opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadRepliesCount(0);
    }
  }, [messages, isOpen]);

  // Listen for open-chat-widget event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-chat-widget", handleOpen);
    return () => window.removeEventListener("open-chat-widget", handleOpen);
  }, []);

  // Don't show chat widget on admin portal or rider pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/rider") || pathname.startsWith("/handheld")) {
    return null;
  }

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const optimisticMsg: Message = {
      id: "temp_" + Date.now(),
      sender: "CUSTOMER",
      text: textToSend.trim(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (!customText) setInputText("");
    setIsLoading(true);

    try {
      if (guestName && typeof window !== "undefined") {
        localStorage.setItem("chat_guest_name", guestName);
      }
      if (guestPhone && typeof window !== "undefined") {
        localStorage.setItem("chat_guest_phone", guestPhone);
      }

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend.trim(),
          userId: user?.id || null,
          guestId: guestId || null,
          guestName: user?.name || guestName || null,
          guestPhone: (user as any)?.phone || guestPhone || null,
        }),
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Modern Chat Popup Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-2 md:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 max-w-sm h-[540px] max-h-[82vh] bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#b90000] via-red-700 to-rose-700 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-inner ring-2 ring-white/50">
                  <img
                    src="/logo.png"
                    alt="ร้านเกษรบ้านป่าเวียง"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                  ร้านเกษรบ้านป่าเวียง
                  <span className="text-[10px] bg-red-900/60 px-1.5 py-0.2 rounded font-semibold text-amber-200">
                    เจ้าของร้าน
                  </span>
                </span>
                <span className="text-[11px] text-white/90 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  🟢 ออนไลน์ • พร้อมบริการตอบกลับ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href="tel:0898510807"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="โทรหาร้านค้า: 089-851-0807"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="ปิดหน้าต่างแชท"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Info & Call Banner */}
          <div className="bg-amber-50 px-3.5 py-1.5 border-b border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span>📞 โทรด่วน: <strong>089-851-0807</strong></span>
            <span>เปิดทุกวัน 07:00 - 20:00 น.</span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#f8f9fa]">
            
            {/* Automated Welcome Card */}
            <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-red-50 text-[#b90000] flex items-center justify-center shrink-0 font-bold text-xs ring-1 ring-red-100">
                🏪
              </div>
              <div className="flex-1 text-xs text-gray-700 leading-relaxed">
                <p className="font-bold text-gray-900 mb-1 flex items-center gap-1">
                  สวัสดีครับ ยินดีต้อนรับสู่ร้านเกษร!
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </p>
                <p>
                  สอบถามสินค้า เช็คสต็อก หรือติดตามพัสดุ พิมพ์ข้อความไว้ได้เลยครับ เจ้าของร้านจะรีบตอบกลับครับ 😊
                </p>
              </div>
            </div>

            {/* Quick Questions Chips */}
            {messages.length === 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                  คำถามที่พบบ่อย:
                </span>
                <div className="flex flex-col gap-1.5">
                  {FAQ_SUGGESTIONS.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(faq)}
                      className="text-left text-xs bg-white hover:bg-red-50 hover:text-[#b90000] text-gray-700 px-3 py-2 rounded-xl border border-gray-200 transition-colors shadow-2xs font-medium"
                    >
                      {faq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg, index) => {
              const isCustomer = msg.sender === "CUSTOMER";
              const timeString = new Date(msg.createdAt).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isCustomer
                        ? "bg-gradient-to-r from-[#b90000] to-red-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {!isCustomer && (
                      <div className="text-[10px] font-bold text-[#b90000] mb-0.5 flex items-center gap-1">
                        <span>ร้านเกษรบ้านป่าเวียง</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-gray-400">
                    <span>{timeString}</span>
                    {isCustomer && <CheckCheck className="w-3 h-3 text-red-500" />}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Guest Identity Optional Bar if not logged in */}
          {!user && (
            <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
              <span className="truncate">👤 แชทในฐานะลูกค้าทั่วไป</span>
              <Link 
                href="/login" 
                className="text-[#b90000] font-bold hover:underline shrink-0 flex items-center gap-0.5"
              >
                <span>เข้าสู่ระบบ</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Input Form */}
          <div className="p-2.5 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="พิมพ์ข้อความคุยกับเจ้าของร้าน..."
                className="flex-1 bg-gray-100 focus:bg-white border border-transparent focus:border-red-500 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="bg-[#b90000] hover:bg-red-800 disabled:opacity-40 text-white p-2.5 rounded-2xl transition-all flex items-center justify-center shrink-0 shadow-md active:scale-95"
                title="ส่งข้อความ"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
