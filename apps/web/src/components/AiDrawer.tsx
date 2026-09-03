"use client";

import React, { useState } from "react";
import { X, Sparkles, Send, ShieldAlert, Code2, User, Bot } from "lucide-react";
import { api } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  context?: any;
}

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiDrawer: React.FC<AiDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your Sure-Savings Assistant. I'm here to explain how your savings advice, normal weekly pay, and emergency floor work. I only explain facts—I cannot move money without your explicit button click.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [lastContext, setLastContext] = useState<any>(null);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chatWithAi(textToSend);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          context: res.grounded_context,
        },
      ]);
      setLastContext(res.grounded_context);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble retrieving your savings numbers. Please check if the server is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Why is saving ₹900 recommended this week?",
    "How is my Financial Safety Score calculated?",
    "What is my Emergency Floor?",
    "Can you transfer ₹5,000 to my bank account?",
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-white border-l border-[#eae8e3] h-full flex flex-col shadow-2xl animate-slide-in">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#eae8e3] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5b45] to-[#f59e0b] flex items-center justify-center shadow-md shadow-[#ff5b45]/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827] flex items-center space-x-1.5">
                <span>Sure-Savings Assistant</span>
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              </h3>
              <p className="text-[11px] text-[#6b7280]">Explains facts about your savings and income</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {lastContext && (
              <button
                onClick={() => setShowContext(!showContext)}
                className="p-1.5 rounded-lg bg-[#f3f4f6] text-[#4b5563] hover:text-[#111827] border border-[#eae8e3] transition-colors"
                title="Inspect Grounded Fact Sheet"
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety Boundary Banner */}
        <div className="px-4 py-2 bg-[#fff5f3] border-b border-[#ffdad4] text-[11px] text-[#b91c1c] flex items-center space-x-2 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-[#ff5b45] shrink-0" />
          <span>Explains Your Numbers Only • Cannot Move Real Money Autonomously</span>
        </div>

        {/* Context Inspector Drawer Overlay */}
        {showContext && lastContext && (
          <div className="bg-[#fbfbfa] p-4 border-b border-[#eae8e3] text-xs text-[#374151] max-h-48 overflow-y-auto font-mono">
            <div className="flex items-center justify-between text-[#6b7280] mb-2">
              <span className="font-bold text-[#ff5b45]">Grounded Fact Sheet</span>
              <button onClick={() => setShowContext(false)} className="text-[11px] hover:text-[#111827]">
                Close
              </button>
            </div>
            <pre className="text-[10px] text-[#4b5563] whitespace-pre-wrap">
              {JSON.stringify(lastContext, null, 2)}
            </pre>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fbfbfa]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  m.role === "user" ? "bg-[#ff5b45] text-white" : "bg-white text-[#d97706] border border-[#eae8e3] shadow-sm"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-2xl p-3.5 text-xs leading-relaxed max-w-[85%] ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-[#ff5b45] to-[#f05138] text-white shadow-md shadow-[#ff5b45]/20 font-medium"
                    : "bg-white text-[#1f2937] border border-[#eae8e3] shadow-sm whitespace-pre-line font-normal"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-[#6b7280] text-xs p-3">
              <Sparkles className="w-4 h-4 text-[#ff5b45] animate-spin" />
              <span>Looking up your numbers...</span>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="p-3 border-t border-[#eae8e3] bg-white">
          <span className="text-[10px] text-[#6b7280] block mb-1.5 font-bold uppercase tracking-wider">Helpful questions:</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-[11px] bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#374151] hover:text-[#111827] px-2.5 py-1 rounded-lg border border-[#eae8e3] transition-all text-left shadow-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#eae8e3] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your savings, pay, or advice..."
              className="flex-1 bg-[#fbfbfa] text-xs text-[#111827] px-3.5 py-2.5 rounded-xl border border-[#eae8e3] focus:outline-none focus:ring-1 focus:ring-[#ff5b45]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff5b45] to-[#f05138] text-white disabled:opacity-50 transition-all shadow-md shadow-[#ff5b45]/30 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
