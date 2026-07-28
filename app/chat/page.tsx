"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Send, Plus, PanelLeftClose, PanelLeftOpen,
  MessageSquare, ChevronDown, Check, Bot, User,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MessageContent from "@/components/MessageContent";
import { generateResponse, suggestedPrompts } from "@/lib/chatResponses";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
}

const initialConversations: Conversation[] = [
  { id: "c1", title: "Critical runway alerts", preview: "ICAO State Letter on runway safety…" },
  { id: "c2", title: "A320 airworthiness directive", preview: "Flight control computer software…" },
  { id: "c3", title: "TCAS RA compliance", preview: "EUROCONTROL resolution advisory…" },
  { id: "c4", title: "Source coverage review", preview: "Categories with the most sources…" },
];

const models = [
  { id: "gpt-4o", name: "GPT-4o", desc: "Most capable, best for analysis" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", desc: "Faster, lightweight answers" },
  { id: "o1", name: "o1-preview", desc: "Advanced reasoning" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations] = useState<Conversation[]>(initialConversations);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [model, setModel] = useState(models[0]);
  const [modelOpen, setModelOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 180) + "px";
    }
  }, [input]);

  // Close model dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function streamResponse(full: string) {
    const id = "a" + Date.now();
    setMessages((m) => [...m, { id, role: "assistant", content: "", streaming: true }]);
    let idx = 0;
    const step = Math.max(2, Math.round(full.length / 140));
    const timer = setInterval(() => {
      idx += step;
      const chunk = full.slice(0, idx);
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, content: chunk } : msg)));
      if (idx >= full.length) {
        clearInterval(timer);
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, content: full, streaming: false } : msg)));
        setBusy(false);
      }
    }, 18);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setActiveConv((c) => c ?? "current");
    setMessages((m) => [...m, { id: "u" + Date.now(), role: "user", content: trimmed }]);
    setInput("");
    setBusy(true);
    const full = generateResponse(trimmed);
    const delay = 900 + Math.random() * 1100; // 0.9–2s "thinking"
    setTimeout(() => streamResponse(full), delay);
  }

  function newChat() {
    setMessages([]);
    setActiveConv(null);
    setInput("");
    textareaRef.current?.focus();
  }

  const empty = messages.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex h-screen flex-col pl-64">
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation history sidebar */}
          <div
            className={`flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
              sidebarOpen ? "w-72" : "w-0"
            } overflow-hidden`}
          >
            <div className="flex items-center justify-between p-3">
              <button
                onClick={newChat}
                className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" /> New chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recent
              </p>
              <div className="space-y-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c.id)}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-gray-50 ${
                      activeConv === c.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-700">{c.title}</span>
                      <span className="block truncate text-xs text-slate-400">{c.preview}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex flex-1 flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-gray-100"
                  aria-label="Toggle history"
                >
                  {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-slate-900">Safety Intelligence Assistant</div>
                    <div className="text-xs text-slate-500">
                      Ask questions about safety data, regulations, incidents, and more
                    </div>
                  </div>
                </div>
              </div>

              {/* Model selector */}
              <div className="relative" ref={modelRef}>
                <button
                  onClick={() => setModelOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-gray-50"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white">AI</span>
                  {model.name}
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition ${modelOpen ? "rotate-180" : ""}`} />
                </button>
                {modelOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m);
                          setModelOpen(false);
                        }}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50"
                      >
                        <span className="mt-0.5 h-4 w-4 shrink-0">
                          {model.id === m.id ? <Check className="h-4 w-4 text-blue-600" /> : null}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-slate-800">{m.name}</span>
                          <span className="block text-xs text-slate-400">{m.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {empty ? (
                <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">How can I help with safety today?</h2>
                  <p className="mt-1.5 max-w-md text-sm text-slate-500">
                    Ask about alerts, airworthiness directives, incident reports, regulations, or your source coverage.
                  </p>
                  <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    {suggestedPrompts.map((s) => (
                      <button
                        key={s.title}
                        onClick={() => send(s.prompt)}
                        className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
                      >
                        <div className="text-sm font-semibold text-slate-800">{s.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{s.subtitle}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
                  {messages.map((m) =>
                    m.role === "user" ? (
                      <div key={m.id} className="flex justify-end gap-3">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                          {m.content}
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-2 shadow-sm">
                          {m.content ? (
                            <MessageContent text={m.content} />
                          ) : (
                            <div className="flex items-center gap-1 py-2">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                            </div>
                          )}
                          {m.streaming && m.content ? (
                            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-blue-500 align-middle" />
                          ) : null}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-200 bg-white px-4 py-4">
              <div className="mx-auto max-w-3xl">
                {!empty && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {suggestedPrompts.slice(0, 3).map((s) => (
                      <button
                        key={s.title}
                        onClick={() => send(s.prompt)}
                        disabled={busy}
                        className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-blue-400">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    placeholder="Ask about aviation safety data, alerts, or regulations…"
                    className="max-h-44 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || busy}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Responses are simulated for demonstration and reference sample safety data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
