import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, RotateCcw, Music2, Headphones, BookOpen } from "lucide-react";

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: Music2,    label: "Recommend a Nasheed",      prompt: "Can you recommend a beautiful Nasheed for me?" },
  { icon: Headphones, label: "Islamic audio topics",    prompt: "What Islamic audio topics are available?" },
  { icon: BookOpen,  label: "Quran recitation tips",    prompt: "Give me tips on improving my Quran recitation listening." },
  { icon: Sparkles,  label: "Ramadan playlist ideas",   prompt: "Suggest a Ramadan playlist idea for me." },
];

// ─── Fake AI reply (replace with real API call) ───────────────────────────────
const getFakeReply = async (message) => {
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
  const lower = message.toLowerCase();
  if (lower.includes("nasheed"))
    return "I'd recommend starting with Maher Zain's 'Rahmatun Lil'Alameen' or Sami Yusuf's 'Al-Mu'allim' — both are spiritually uplifting and beautifully composed. 🌙";
  if (lower.includes("quran") || lower.includes("recitation"))
    return "For improving your Quran listening experience, try following along with a Mushaf while listening. Sheikh Mishary Rashid Alafasy and Sheikh Abdul Rahman Al-Sudais are highly recommended reciters. 📖";
  if (lower.includes("ramadan"))
    return "A perfect Ramadan playlist could start with Quranic recitations at Fajr, move to Nasheeds during the day, and end with peaceful du'a recordings before Iftar. 🌙✨";
  if (lower.includes("islamic") || lower.includes("audio"))
    return "QalbAudio features Quran recitations, Islamic Nasheeds, lectures, and du'a recordings. You can browse by category or search for specific scholars and reciters.";
  return "Assalamu Alaikum! I'm here to help you discover Islamic audio content on QalbAudio. Ask me about Nasheeds, Quran recitations, scholars, or anything Islamic! 🤲";
};

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(var(--app-accent-rgb),0.3)",
          marginBottom: 2,
        }}>
          <Bot size={14} color="#041307" />
        </div>
      )}

      <div style={{
        maxWidth: "78%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))"
          : "rgba(var(--app-accent-rgb),0.08)",
        border: isUser ? "none" : "1px solid rgba(var(--app-accent-rgb),0.14)",
        color: isUser ? "#041307" : "var(--app-text-main)",
        fontSize: 13.5,
        lineHeight: 1.55,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: isUser ? 600 : 400,
        boxShadow: isUser ? "0 6px 20px rgba(var(--app-accent-rgb),0.22)" : "none",
      }}>
        {msg.content}
      </div>
    </motion.div>
  );
};

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots = () => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}
  >
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Bot size={14} color="#041307" />
    </div>
    <div style={{
      padding: "12px 16px",
      borderRadius: "18px 18px 18px 4px",
      background: "rgba(var(--app-accent-rgb),0.08)",
      border: "1px solid rgba(var(--app-accent-rgb),0.14)",
      display: "flex", gap: 4, alignItems: "center",
    }}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--app-accent)", display: "block",
          }}
        />
      ))}
    </div>
  </motion.div>
);

// ─── Main ChatBotPopup ────────────────────────────────────────────────────────
const ChatBotPopup = ({ onClose, user }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Assalamu Alaikum${user?.username ? `, ${user.username}` : ""}! 🌙\nI'm your QalbAudio assistant. How can I help you discover Islamic audio today?`,
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 600 : false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setIsTyping(true);
    const reply = await getFakeReply(trimmed);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: `Assalamu Alaikum${user?.username ? `, ${user.username}` : ""}! 🌙\nI'm your QalbAudio assistant. How can I help you discover Islamic audio today?`,
    }]);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        .chatbot-popup-input::placeholder {
          color: var(--app-text-muted);
          opacity: 0.7;
        }
        .chatbot-popup-input:focus {
          outline: none;
        }
        .chatbot-send-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 8px 20px rgba(var(--app-accent-rgb),0.36) !important;
        }
        .chatbot-send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none !important;
        }
        .chatbot-suggestion-btn:hover {
          background: rgba(var(--app-accent-rgb),0.14) !important;
          border-color: rgba(var(--app-accent-rgb),0.45) !important;
          transform: translateY(-1px);
        }
        .chatbot-clear-btn:hover {
          background: rgba(var(--app-accent-rgb),0.1) !important;
          color: var(--app-text-main) !important;
        }
        .chatbot-messages-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .chatbot-messages-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-messages-scroll::-webkit-scrollbar-thumb {
          background: rgba(var(--app-accent-rgb),0.22);
          border-radius: 4px;
        }
      `}</style>

      {/* Backdrop (mobile) */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            zIndex: 200, backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Popup panel */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: isMobile ? "50%" : 80,
          right: isMobile ? "50%" : 28,
          transform: isMobile ? "translate(50%,-50%)" : "none",
          width: isMobile ? "min(94vw, 420px)" : 400,
          height: isMobile ? "min(88vh, 600px)" : 560,
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          borderRadius: 24,
          background: "var(--app-surface-solid)",
          border: "1px solid rgba(var(--app-accent-rgb),0.22)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.36), 0 0 0 1px rgba(var(--app-accent-rgb),0.06)",
          overflow: "hidden",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: "16px 18px",
          background: "linear-gradient(135deg,rgba(var(--app-accent-rgb),0.12) 0%,rgba(var(--app-accent-rgb),0.04) 100%)",
          borderBottom: "1px solid rgba(var(--app-accent-rgb),0.12)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          position: "relative",
        }}>
          {/* Top accent line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg,transparent,rgba(var(--app-accent-rgb),0.6) 40%,var(--app-accent) 50%,rgba(var(--app-accent-rgb),0.6) 60%,transparent)",
          }} />

          {/* Bot icon */}
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 22px rgba(var(--app-accent-rgb),0.35)",
            }}
          >
            <Bot size={20} color="#041307" strokeWidth={2.2} />
          </motion.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15,
              color: "var(--app-text-main)",
            }}>
              QalbAudio Assistant
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                display: "inline-block",
              }} />
              <span style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 11.5,
                color: "var(--app-text-muted)", fontWeight: 500,
              }}>
                Online · Islamic Audio Guide
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="chatbot-clear-btn"
              onClick={clearChat}
              title="Clear chat"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(var(--app-accent-rgb),0.06)",
                border: "1px solid rgba(var(--app-accent-rgb),0.16)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--app-text-muted)", transition: "all 0.2s ease",
              }}
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#f87171", transition: "all 0.2s ease",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div
          className="chatbot-messages-scroll"
          style={{
            flex: 1, overflowY: "auto",
            padding: "16px 16px 8px",
            display: "flex", flexDirection: "column",
          }}
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          <AnimatePresence>
            {isTyping && <TypingDots />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ── SUGGESTIONS ── */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                padding: "0 14px 10px",
                display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0,
              }}
            >
              {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  className="chatbot-suggestion-btn"
                  onClick={() => sendMessage(prompt)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 11px",
                    borderRadius: 999,
                    background: "rgba(var(--app-accent-rgb),0.07)",
                    border: "1px solid rgba(var(--app-accent-rgb),0.2)",
                    color: "var(--app-text-main)",
                    fontSize: 12, fontWeight: 600,
                    fontFamily: "'DM Sans',sans-serif",
                    cursor: "pointer", transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={11} color="var(--app-accent)" />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INPUT BAR ── */}
        <div style={{
          padding: "12px 14px 14px",
          borderTop: "1px solid rgba(var(--app-accent-rgb),0.1)",
          background: "rgba(var(--app-accent-rgb),0.03)",
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(var(--app-accent-rgb),0.06)",
            border: "1px solid rgba(var(--app-accent-rgb),0.18)",
            borderRadius: 999,
            padding: "8px 8px 8px 16px",
            transition: "border-color 0.2s ease",
          }}>
            <input
              ref={inputRef}
              className="chatbot-popup-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Islamic audio..."
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "var(--app-text-main)",
                fontFamily: "'DM Sans',sans-serif", fontSize: 13.5,
                fontWeight: 500, minWidth: 0,
              }}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", flexShrink: 0,
                background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(var(--app-accent-rgb),0.28)",
                transition: "all 0.2s ease",
              }}
            >
              <Send size={15} color="#041307" strokeWidth={2.2} />
            </motion.button>
          </div>
          <div style={{
            textAlign: "center", marginTop: 8,
            fontFamily: "'DM Sans',sans-serif", fontSize: 10.5,
            color: "var(--app-text-muted)", opacity: 0.6,
          }}>
            Powered by QalbAudio AI · Bismillah 🤲
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ChatBotPopup;