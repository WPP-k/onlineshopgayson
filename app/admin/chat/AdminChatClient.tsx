"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  Search, 
  Send, 
  Phone, 
  User, 
  ShoppingBag, 
  Clock, 
  CheckCheck, 
  RefreshCw, 
  Sparkles,
  MapPin,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface Conversation {
  chatId: string;
  userId: string | null;
  guestId: string | null;
  customerName: string;
  customerPhone: string;
  isRegisteredUser: boolean;
  ordersCount: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  totalMessages: number;
}

interface Message {
  id: string;
  sender: "CUSTOMER" | "STORE";
  text: string;
  createdAt: string;
  isRead: boolean;
  user?: {
    id: string;
    name: string | null;
    phone: string | null;
    username: string;
    address: string | null;
    orders?: {
      id: string;
      totalAmount: number;
      status: string;
      createdAt: string;
    }[];
  };
}

const PRESET_REPLIES = [
  "สวัสดีครับ ยินดีให้บริการครับ มีอะไรให้ทางร้านดูแลสอบถามได้เลยครับ 😊",
  "สินค้ามีพร้อมจัดส่งครับ สามารถกดสั่งซื้อผ่านหน้าเว็บได้เลยครับ 🛒",
  "ทางร้านจัดส่งถึงหน้าบ้าน รวดเร็วแน่นอนครับ 🚚",
  "ขออนุญาตตรวจสอบสต็อกสินค้าให้สักครู่ครับ ⏳",
  "ร้านเปิดให้บริการทุกวัน 07:00 - 20:00 น. ครับ",
];

export function AdminChatClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "MEMBER" | "GUEST">("ALL");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    try {
      const res = await fetch("/api/admin/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        const list: Conversation[] = data.conversations || [];
        setConversations(list);

        // Auto select first conversation if none selected
        if (!activeChatId && list.length > 0 && !silent) {
          setActiveChatId(list[0].chatId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/messages?chatId=${encodeURIComponent(chatId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);

        // Also update unread count in conversations state
        setConversations(prev => prev.map(c => c.chatId === chatId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Poll conversations every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // When active chat changes, load its messages
  useEffect(() => {
    if (activeChatId) {
      setIsLoadingMessages(true);
      fetchMessages(activeChatId).finally(() => setIsLoadingMessages(false));

      // Poll active conversation messages every 3.5 seconds
      const msgInterval = setInterval(() => {
        fetchMessages(activeChatId);
      }, 3500);
      return () => clearInterval(msgInterval);
    }
  }, [activeChatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Send Reply
  const handleSendReply = async (customText?: string) => {
    const textToSend = customText || replyText;
    if (!textToSend.trim() || !activeChatId || isSending) return;

    const optimisticMsg: Message = {
      id: "admin_temp_" + Date.now(),
      sender: "STORE",
      text: textToSend.trim(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    if (!customText) setReplyText("");
    setIsSending(true);

    try {
      const res = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChatId,
          text: textToSend.trim()
        })
      });

      if (res.ok) {
        fetchMessages(activeChatId);
        fetchConversations(true);
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = 
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerPhone.includes(searchQuery) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "UNREAD") return c.unreadCount > 0;
    if (filterType === "MEMBER") return c.isRegisteredUser;
    if (filterType === "GUEST") return !c.isRegisteredUser;
    return true;
  });

  const activeConv = conversations.find(c => c.chatId === activeChatId);
  const activeUser = messages.find(m => m.user)?.user;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 -m-6 sm:-m-8">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#b90000] flex items-center justify-center shadow-xs">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              แชทติดต่อกับลูกค้า (Live Customer Chat)
              <span className="text-xs bg-red-100 text-[#b90000] px-2 py-0.5 rounded-full font-bold">
                {conversations.length} การสนทนา
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              ตอบคำถามและพูดคุยกับลูกค้าที่เข้ามาติดต่อสอบถามข้อมูลร้านค้า
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchConversations();
            if (activeChatId) fetchMessages(activeChatId);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#b90000] bg-gray-100 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Conversations List */}
        <div className="w-80 md:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0">
          
          {/* Search Box */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, ข้อความ..."
                className="w-full bg-gray-50 pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:bg-white focus:border-red-500 outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px] font-bold">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "ALL" ? "bg-[#b90000] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ทั้งหมด ({conversations.length})
              </button>
              <button
                onClick={() => setFilterType("UNREAD")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "UNREAD" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ยังไม่อ่าน ({conversations.filter(c => c.unreadCount > 0).length})
              </button>
              <button
                onClick={() => setFilterType("MEMBER")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  filterType === "MEMBER" ? "bg-red-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                สมาชิก ({conversations.filter(c => c.isRegisteredUser).length})
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">ไม่มีรายการแชทที่ตรงกับการค้นหา</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.chatId === activeChatId;
                const timeString = new Date(conv.lastMessageAt).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div
                    key={conv.chatId}
                    onClick={() => setActiveChatId(conv.chatId)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-red-50/80 border-l-4 border-[#b90000]"
                        : "hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                        conv.isRegisteredUser
                          ? "bg-red-100 text-[#b90000] ring-2 ring-red-200"
                          : "bg-gray-100 text-gray-600 ring-2 ring-gray-200"
                      }`}>
                        {conv.customerName.slice(0, 1).toUpperCase()}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Chat Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate ${
                          isSelected ? "text-[#b90000]" : "text-gray-900"
                        }`}>
                          {conv.customerName}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                          {timeString}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          conv.isRegisteredUser
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {conv.isRegisteredUser ? "👤 สมาชิก" : "ลูกค้าทั่วไป"}
                        </span>
                        {conv.customerPhone !== "-" && (
                          <span className="text-[10px] text-gray-500 truncate">
                            {conv.customerPhone}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs truncate ${
                        conv.unreadCount > 0 ? "font-bold text-gray-900" : "text-gray-500"
                      }`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {activeConv ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                    activeConv.isRegisteredUser
                      ? "bg-red-100 text-[#b90000]"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {activeConv.customerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-gray-900">
                        {activeConv.customerName}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeConv.isRegisteredUser 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {activeConv.isRegisteredUser ? `สมาชิก • ${activeConv.ordersCount} คำสั่งซื้อ` : "ลูกค้าทั่วไป"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {activeConv.customerPhone !== "-" && (
                        <a 
                          href={`tel:${activeConv.customerPhone}`}
                          className="flex items-center gap-1 hover:text-[#b90000] font-medium transition-colors"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{activeConv.customerPhone}</span>
                        </a>
                      )}
                      {activeUser?.address && (
                        <span className="flex items-center gap-1 truncate max-w-xs text-[11px]">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{activeUser.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions for registered user */}
                {activeConv.isRegisteredUser && (
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(activeConv.customerPhone)}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#b90000] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>ดูคำสั่งซื้อของลูกค้ารายนี้</span>
                  </Link>
                )}
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3.5">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    กำลังโหลดข้อความ...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                    <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-semibold">ยังไม่มีข้อความในการสนทนานี้</p>
                    <p className="text-xs text-gray-400 mt-1">พิมพ์ข้อความตอบกลับเพื่อเริ่มการพูดคุยกับลูกค้า</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isStore = msg.sender === "STORE";
                    const timeString = new Date(msg.createdAt).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isStore ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-bold text-gray-600">
                            {isStore ? "ร้านเกษรบ้านป่าเวียง (คุณ)" : activeConv.customerName}
                          </span>
                          <span className="text-[10px] text-gray-400">{timeString}</span>
                        </div>

                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isStore
                              ? "bg-gradient-to-r from-[#b90000] to-red-700 text-white rounded-tr-none"
                              : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Preset Replies */}
              <div className="px-6 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap flex items-center gap-1 mr-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  ข้อความด่วน:
                </span>
                {PRESET_REPLIES.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendReply(reply)}
                    className="whitespace-nowrap px-3 py-1 bg-gray-100 hover:bg-red-50 hover:text-[#b90000] text-gray-700 rounded-full text-xs font-medium transition-colors border border-gray-200"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendReply();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`พิมพ์ข้อความตอบกลับ ${activeConv.customerName}...`}
                    className="flex-1 bg-gray-50 focus:bg-white border border-gray-200 focus:border-red-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 shadow-2xs"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="bg-[#b90000] hover:bg-red-800 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 shadow-md shrink-0 active:scale-95"
                  >
                    <span>ส่งข้อความ</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-8">
              <MessageCircle className="w-16 h-16 mb-3 opacity-20 text-[#b90000]" />
              <h3 className="text-base font-bold text-gray-700">เลือกรายการแชทเพื่อเริ่มสนทนา</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                เลือกการสนทนาของลูกค้าจากคอลัมน์ทางซ้าย เพื่อดูข้อความที่ส่งมาและพิมพ์ตอบกลับ
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
