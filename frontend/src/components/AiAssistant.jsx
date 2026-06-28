import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { publicApi } from "../lib/endpoints";

const RADIUS = "rounded-[var(--radius)]";

const GREETING = {
  role: "assistant",
  text: "Hi! I'm the ParkMaster assistant. Ask me about availability, pricing, AI slot allocation, payments, or reservations.",
};

const SUGGESTIONS = [
  "How does AI allocation work?",
  "What are your prices?",
  "Are there free slots?",
  "How do I pay?",
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text) {
    const message = text.trim();
    if (!message || sending) return;
    setInput("");
    const history = messages.filter((m) => m !== GREETING);
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setSending(true);
    try {
      const res = await publicApi.assistantChat(message, history);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Sorry, I couldn't answer that (${err.message}).` },
      ]);
    } finally {
      setSending(false);
    }
  }

  const canSend = input.trim().length > 0 && !sending;

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 flex h-[min(36rem,calc(100vh-8rem))] w-[26rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-pop)] transition-all duration-300 ease-out ${RADIUS} ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between bg-accent px-4 py-3.5 text-accent-fg">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-fg/15">
              <Bot size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">ParkMaster Assistant</p>
              <p className="text-xs text-accent-fg/70">Parking help, anytime</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="flex h-7 w-7 items-center justify-center rounded-full opacity-70 transition hover:bg-accent-fg/15 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-sm leading-relaxed ${RADIUS} ${
                  m.role === "user"
                    ? "bg-accent text-accent-fg"
                    : "border border-line bg-surface text-text shadow-[var(--shadow-card)]"
                }`}
              >
                {m.role === "assistant" && messages.indexOf(m) === 0 && (
                  <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center align-middle">
                    <Bot size={12} className="text-accent" />
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <p className="max-w-[85%] whitespace-pre-line rounded-[var(--radius)] border border-line bg-surface px-3 py-2 text-xs text-muted shadow-[var(--shadow-card)]">
                Assistant is typing…
              </p>
            </div>
          )}
          {messages.length <= 3 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-text/30 hover:bg-elevated hover:text-text"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-line bg-surface px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about parking…"
            className={`flex-1 border border-line bg-bg px-3 py-2 text-sm text-text outline-none transition placeholder:text-muted/60 focus:border-text/30 focus:ring-2 focus:ring-text/10 ${RADIUS}`}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/30 ${
              canSend
                ? "bg-accent text-accent-fg shadow-[var(--shadow-card)] hover:bg-accent-strong hover:shadow-lg active:scale-95"
                : "bg-elevated text-muted cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-pop)] transition-all duration-300 hover:opacity-90 hover:shadow-xl active:scale-95 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}
