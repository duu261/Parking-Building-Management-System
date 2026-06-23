import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, ArrowLeftRight } from "lucide-react";
import { publicApi } from "../lib/endpoints";
import { Button } from "./ui";

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
  const [side, setSide] = useState(() => localStorage.getItem("ai-chat-side") || "right");
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function flipSide() {
    const next = side === "right" ? "left" : "right";
    setSide(next);
    localStorage.setItem("ai-chat-side", next);
  }

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

  const isRight = side === "right";

  return (
    <>
      <div
        className={`fixed bottom-24 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out ${RADIUS} ${
          isRight ? "right-5" : "left-5"
        } ${open ? "translate-x-0" : isRight ? "translate-x-[120%]" : "-translate-x-[120%]"} ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <header className="flex items-center justify-between bg-accent px-4 py-3 text-accent-fg">
          <div className="flex items-center gap-2">
            <Bot size={18} />
            <div>
              <p className="text-sm font-semibold leading-tight">ParkMaster Assistant</p>
              <p className="text-xs opacity-70">Parking help, anytime</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={flipSide}
              aria-label={`Move to ${isRight ? "left" : "right"} side`}
              title={`Move to ${isRight ? "left" : "right"}`}
              className="rounded-full p-1 opacity-80 transition hover:bg-accent-fg/15 hover:opacity-100"
            >
              <ArrowLeftRight size={16} />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-full p-1 opacity-80 transition hover:bg-accent-fg/15 hover:opacity-100"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={`max-w-[85%] whitespace-pre-line px-3 py-2 text-sm ${RADIUS} ${
                  m.role === "user"
                    ? "bg-accent text-accent-fg"
                    : "border border-line bg-surface text-text shadow-[var(--shadow-card)]"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          {sending && <p className="text-xs text-muted">Assistant is typing…</p>}
          {messages.length <= 3 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted transition hover:bg-elevated hover:text-text"
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
          className="flex items-center gap-2 border-t border-line bg-surface px-3 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about parking…"
            className={`flex-1 border border-line bg-surface px-3 py-2 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-text/40 focus:ring-2 focus:ring-text/15 ${RADIUS}`}
          />
          <Button type="submit" disabled={sending || !input.trim()} aria-label="Send message">
            <Send size={16} />
          </Button>
        </form>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={`fixed bottom-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-pop)] transition-all duration-300 hover:opacity-90 active:translate-y-px ${
          isRight ? "right-5" : "left-5"
        }`}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
