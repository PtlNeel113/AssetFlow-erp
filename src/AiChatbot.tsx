import React, { useState, useEffect, useRef } from "react";
import { Employee, UserRole } from "../types";
import { AssetFlowStore } from "../mockData";
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Minimize2, 
  Bot, 
  User, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface AiChatbotProps {
  currentUser: Employee;
  onNavigate: (tab: string) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AiChatbot({ currentUser, onNavigate }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice Command / Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-IN"; // Set English (India) to recognize Indian accents perfectly!
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send voice input if it's clear
        if (transcript.trim()) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setMessages(prev => [
            ...prev,
            {
              id: "mic-error-" + Date.now(),
              role: "assistant",
              content: "🎤 **Microphone Access Blocked:** Microphone access is restricted or denied in this sandbox. Please click the button in your browser address bar to allow microphone access, or open this application in a new tab to use voice commands! 🙏",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Namaste ${currentUser.name} Ji! 🙏 I am your intelligent AssetFlow ERP assistant. I can help you search the directory, check your department allocations, raise maintenance requests, and even schedule bookings. Try saying: "Book 11 to 12 for laptop asset" or "Go to the Reports tab". How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const executeAction = (action: any, queryText: string) => {
    if (!action) return;

    if (action.type === "navigate" && action.targetTab) {
      onNavigate(action.targetTab);
      setMessages(prev => [
        ...prev,
        {
          id: "act-" + Date.now(),
          role: "assistant",
          content: `🔄 Switched view to *${action.targetTab.toUpperCase()}* module.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if (action.type === "book_asset" && action.bookingDetails) {
      const { assetId, date, startTime, endTime } = action.bookingDetails;
      
      // Load shared resources from AssetFlowStore
      const assets = AssetFlowStore.getAssets();
      
      // Robust fuzzy matching for asset tag/ID or natural name in the query text
      let targetAsset = assets.find(a => 
        a.id === assetId || 
        a.tag.toLowerCase() === assetId?.toLowerCase() ||
        (assetId && a.name.toLowerCase().includes(assetId.toLowerCase()))
      );

      if (!targetAsset && queryText) {
        const text = queryText.toLowerCase();
        if (text.includes("smart board") || text.includes("smartboard") || text.includes("board")) {
          targetAsset = assets.find(a => a.id === "as-4");
        } else if (text.includes("tesla") || text.includes("car") || text.includes("vehicle") || text.includes("model y")) {
          targetAsset = assets.find(a => a.id === "as-5");
        } else if (text.includes("macbook") || text.includes("laptop")) {
          targetAsset = assets.find(a => a.id === "as-1");
        } else if (text.includes("thinkpad") || text.includes("lenovo")) {
          targetAsset = assets.find(a => a.id === "as-2");
        }
      }
      
      if (!targetAsset) {
        setMessages(prev => [
          ...prev,
          {
            id: "act-error-" + Date.now(),
            role: "assistant",
            content: `⚠️ Sorry Ji! I could not locate a bookable asset matching "${assetId}". Please verify the Asset Tag in the directory.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      // Check double booking conflict at core level
      const bookings = AssetFlowStore.getBookings();
      const hasConflict = bookings.some(
        b => b.resourceId === targetAsset.id &&
             b.bookingDate === date &&
             b.status === "Upcoming" &&
             ((startTime >= b.startTime && startTime < b.endTime) ||
              (endTime > b.startTime && endTime <= b.endTime) ||
              (startTime <= b.startTime && endTime >= b.endTime))
      );

      if (hasConflict) {
        setMessages(prev => [
          ...prev,
          {
            id: "act-conflict-" + Date.now(),
            role: "assistant",
            content: `❌ Booking Overlap Conflict: ${targetAsset.name} (${targetAsset.tag}) is already reserved for ${date} during that interval. AssetFlow blocked this double allocation.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      // Register Booking in State
      const newBooking = {
        id: "bk-" + Date.now(),
        resourceId: targetAsset.id,
        resourceName: `${targetAsset.name} (${targetAsset.location})`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        bookingDate: date || new Date().toISOString().split("T")[0],
        startTime: startTime || "11:00",
        endTime: endTime || "12:00",
        status: "Upcoming" as const
      };

      AssetFlowStore.saveBookings([...bookings, newBooking]);
      window.dispatchEvent(new Event("assetflow_bookings_updated"));
      AssetFlowStore.addActivityLog(currentUser.name, `Booked ${targetAsset.tag} via AI voice control`, "Booking");
      AssetFlowStore.addNotification(
        "AI Booking Registered",
        `Automated booking of ${targetAsset.tag} for ${newBooking.bookingDate} (${newBooking.startTime}-${newBooking.endTime}) confirmed.`,
        "success"
      );

      setMessages(prev => [
        ...prev,
        {
          id: "act-success-" + Date.now(),
          role: "assistant",
          content: `✅ Done Ji! I have successfully booked ${targetAsset.name} (${targetAsset.tag}) for you on **${newBooking.bookingDate}** from **${newBooking.startTime}** to **${newBooking.endTime}**. Booking has been saved to the database.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Clear text input
    if (!textToSend) setInput("");

    const userMsg: Message = {
      id: "usr-" + Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // --- Direct Local Interceptor for 100% Reliable Voice / Text Navigation & Bookings ---
    const normalizedQuery = query.toLowerCase().trim();
    let intercepted = false;

    const quickHelp = [
      "profile",
      "employee profile",
      "show my profile",
      "open profile",
      "my id",
      "employee id"
    ];

    if (quickHelp.some((entry) => normalizedQuery.includes(entry))) {
      onNavigate("profile");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-profile-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Employee Profile:** I’ve opened your complete profile center with your ID, QR code, and asset records.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery === "open booking" || normalizedQuery === "open bookings" || 
        normalizedQuery === "go to booking" || normalizedQuery === "go to bookings" || 
        normalizedQuery === "show booking" || normalizedQuery === "show bookings" || 
        normalizedQuery === "bookings" || normalizedQuery === "open resources" ||
        normalizedQuery === "booking") {
      
      onNavigate("bookings");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Bookings Module:** I’ve opened the booking calendar and scheduling view for you. 📅",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery.includes("open asset directory") || normalizedQuery === "open directory" || 
               normalizedQuery === "go to directory" || normalizedQuery === "show directory" || 
               normalizedQuery.includes("asset directory") || normalizedQuery === "directory") {
      
      onNavigate("directory");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Asset Directory:** I’ve opened the directory so you can inspect assets and use the QR scan workflow. 📋",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery === "open dashboard" || normalizedQuery === "go to dashboard" || normalizedQuery === "dashboard") {
      onNavigate("dashboard");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Dashboard:** Navigated to your primary ERP console. 📊",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery.includes("open allocation") || normalizedQuery.includes("go to allocation") || 
               normalizedQuery.includes("show allocation") || normalizedQuery === "allocations") {
      onNavigate("allocations");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Allocations & Transfers:** Navigated to allocations panel. 🔄",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery.includes("open maintenance") || normalizedQuery.includes("go to maintenance") || 
               normalizedQuery.includes("show maintenance") || normalizedQuery === "maintenance") {
      onNavigate("maintenance");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Maintenance:** Navigated to maintenance board. 🔧",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery.includes("open audit") || normalizedQuery.includes("go to audit") || 
               normalizedQuery.includes("show audit") || normalizedQuery === "audits") {
      onNavigate("audits");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Audits:** Navigated to enterprise asset audit cycles. 📝",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery.includes("open report") || normalizedQuery.includes("go to report") || 
               normalizedQuery.includes("show report") || normalizedQuery === "reports") {
      onNavigate("reports");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Reports:** Navigated to analytics and report subscriptions. 📈",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    } else if (normalizedQuery.includes("open log") || normalizedQuery.includes("go to log") || 
               normalizedQuery.includes("show log") || normalizedQuery === "logs") {
      onNavigate("logs");
      setMessages(prev => [
        ...prev,
        userMsg,
        {
          id: "act-nav-" + Date.now(),
          role: "assistant",
          content: "🔄 **Opening Logs:** Navigated to Activity Logs tracker. 📃",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      intercepted = true;
    }

    // B. Direct Booking Short-circuit (e.g. "book smart board for 12 to 14" or "book smart board for 13 to 14")
    if (!intercepted) {
      const bookRegex = /(?:book|reserve|schedule)\s+([a-zA-Z0-9\s_\-]+?)\s+(?:for|from)?\s*(\d{1,2})(?::\d{2})?\s*(?:to|until|-)\s*(\d{1,2})(?::\d{2})?/i;
      const match = normalizedQuery.match(bookRegex);
      if (match) {
        const assetSearch = match[1].trim();
        const startHour = parseInt(match[2], 10);
        const endHour = parseInt(match[3], 10);

        // Find match in our bookable assets list
        const assets = AssetFlowStore.getAssets();
        let targetAsset = assets.find(a => 
          a.isBookable && (
            a.name.toLowerCase().includes(assetSearch) || 
            a.tag.toLowerCase() === assetSearch || 
            assetSearch.includes(a.name.toLowerCase())
          )
        );

        // Fallback fuzzy overrides
        if (!targetAsset && (assetSearch.includes("smart board") || assetSearch.includes("smartboard") || assetSearch.includes("board"))) {
          targetAsset = assets.find(a => a.id === "as-4");
        } else if (!targetAsset && (assetSearch.includes("tesla") || assetSearch.includes("car") || assetSearch.includes("model y") || assetSearch.includes("vehicle"))) {
          targetAsset = assets.find(a => a.id === "as-5");
        } else if (!targetAsset && (assetSearch.includes("macbook") || assetSearch.includes("laptop"))) {
          targetAsset = assets.find(a => a.id === "as-1");
        } else if (!targetAsset && (assetSearch.includes("thinkpad") || assetSearch.includes("lenovo"))) {
          targetAsset = assets.find(a => a.id === "as-2");
        }

        if (targetAsset) {
          const formatTime = (hour: number) => {
            const h = hour < 0 ? 0 : hour > 23 ? 23 : hour;
            return `${String(h).padStart(2, "0")}:00`;
          };

          const startTimeStr = formatTime(startHour);
          const endTimeStr = formatTime(endHour);
          const todayDate = new Date().toISOString().split("T")[0];

          // Check conflict
          const bookings = AssetFlowStore.getBookings();
          const hasConflict = bookings.some(
            b => b.resourceId === targetAsset!.id &&
                 b.bookingDate === todayDate &&
                 b.status === "Upcoming" &&
                 ((startTimeStr >= b.startTime && startTimeStr < b.endTime) ||
                  (endTimeStr > b.startTime && endTimeStr <= b.endTime) ||
                  (startTimeStr <= b.startTime && endTimeStr >= b.endTime))
          );

          if (hasConflict) {
            setMessages(prev => [
              ...prev,
              userMsg,
              {
                id: "act-conflict-" + Date.now(),
                role: "assistant",
                content: `❌ **Booking Overlap:** The **${targetAsset!.name}** is already reserved for today (${todayDate}) during the requested slot **${startTimeStr}-${endTimeStr}**. Please choose a different timing, Ji.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          } else {
            const newBooking = {
              id: "bk-" + Date.now(),
              resourceId: targetAsset.id,
              resourceName: `${targetAsset.name} (${targetAsset.location})`,
              employeeId: currentUser.id,
              employeeName: currentUser.name,
              bookingDate: todayDate,
              startTime: startTimeStr,
              endTime: endTimeStr,
              status: "Upcoming" as const
            };

            AssetFlowStore.saveBookings([...bookings, newBooking]);
            window.dispatchEvent(new Event("assetflow_bookings_updated"));

            AssetFlowStore.addActivityLog(currentUser.name, `Booked ${targetAsset.tag} via instant voice control shortcut`, "Booking");
            AssetFlowStore.addNotification(
              "AI Booking Registered",
              `Automated booking of ${targetAsset.tag} for ${newBooking.bookingDate} (${newBooking.startTime}-${newBooking.endTime}) confirmed.`,
              "success"
            );

            setMessages(prev => [
              ...prev,
              userMsg,
              {
                id: "act-success-" + Date.now(),
                role: "assistant",
                content: `✅ **Booking Successful!** Namaste! I have successfully reserved the **${targetAsset!.name} (${targetAsset!.tag})** for you on **today (${todayDate})** from **${startTimeStr}** to **${endTimeStr}**. I have also navigated you to the bookings section! 🙏`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);

            onNavigate("bookings");
          }
          intercepted = true;
        }
      }
    }

    if (intercepted) {
      return; // Stop execution, skip server-side call!
    }

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Map existing messages to API body schema
      const historyToSend = messages.concat(userMsg).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyToSend,
          userProfile: {
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            departmentName: currentUser.departmentName
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact the chatbot gateway.");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // If there is a voice navigated action shortcut
      if (data.action) {
        executeAction(data.action, query);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "Sorry Ji! There seems to be a connection delay with our server. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FLOATING CHAT BUTTON */}
      <button
        id="btn-ai-chat-bubble"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#714B67] hover:bg-[#714B67]/95 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-40 group border border-white/20"
      >
        <Sparkles className="w-6 h-6 animate-pulse text-[#FCF1DA]" />
        <span className="absolute -top-1 -right-1 bg-teal-500 w-3 h-3 rounded-full border border-white" />
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div 
          id="ai-chat-window"
          className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-32px)] h-[500px] bg-white rounded-2xl border border-[#E5E4EA] shadow-2xl flex flex-col overflow-hidden z-50 animate-fadeIn"
        >
          {/* Header */}
          <div className="bg-[#714B67] px-4 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-[#FCF1DA]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs">AssetFlow Indian AI ERP</h4>
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-[8px] font-mono rounded font-bold uppercase text-white tracking-widest">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-[#F1E9EE]/85 mt-0.5">Role: {currentUser.role} | {currentUser.departmentName}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white/80 hover:text-white font-bold p-1 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* User Role Banner for Employee with clear visual warning */}
          {currentUser.role === UserRole.EMPLOYEE && (
            <div className="bg-[#FCF1DA] px-3.5 py-1.5 border-b border-[#D89614]/25 flex items-center gap-1.5 text-[10px] text-[#D89614] font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-[#D89614] shrink-0" />
              <span>Employee Mode: approvals and audit creations are locked.</span>
            </div>
          )}

          {/* Messages Frame */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F5FA]/40">
            {messages.map((m) => (
              <div 
                key={m.id}
                className={`flex space-x-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded bg-[#714B67]/10 flex items-center justify-center text-[#714B67] shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs shadow-sm border ${
                  m.role === "user" 
                    ? "bg-[#714B67] text-white border-transparent" 
                    : "bg-white text-gray-800 border-[#E5E4EA]/80"
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <span className={`block text-[8px] mt-1.5 text-right ${
                    m.role === "user" ? "text-white/70" : "text-gray-400 font-semibold"
                  }`}>
                    {m.timestamp}
                  </span>
                </div>

                {m.role === "user" && (
                  <div className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex space-x-2.5 justify-start">
                <div className="w-7 h-7 rounded bg-[#714B67]/10 flex items-center justify-center text-[#714B67] shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white text-gray-500 rounded-xl px-3.5 py-2.5 text-xs border border-[#E5E4EA]/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input Panel */}
          <div className="p-3.5 border-t border-[#E5E4EA] bg-white space-y-2">
            <div className="flex items-center space-x-2">
              {/* Mic Icon */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isListening 
                    ? "bg-red-500 text-white border-red-500 animate-pulse" 
                    : "bg-[#F4F5FA] hover:bg-[#F1E9EE] hover:text-[#714B67] text-gray-500 border-[#E5E4EA]"
                }`}
                title={isListening ? "Listening... Speak now!" : "Click to give voice commands (Hindi/English)"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening... speak now..." : "Type custom task or commands..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isListening}
                className="flex-1 px-3 py-2 bg-[#F4F5FA] border border-[#E5E4EA] rounded-lg text-xs text-[#6B6675] focus:outline-none focus:border-[#714B67] focus:bg-white transition-all"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isListening}
                className="p-2 bg-[#714B67] hover:bg-[#714B67]/90 text-white rounded-lg cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Disclaimer */}
            <div className="flex items-center justify-between text-[9px] text-[#6B6675]/60 px-0.5">
              <span>Supports voice navigation & booking</span>
              <div className="flex items-center gap-0.5 text-[#714B67] hover:underline cursor-help">
                <HelpCircle className="w-3 h-3" />
                <span>Odoo AI Helper</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
