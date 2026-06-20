import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { publicApi } from "../lib/endpoints";
import { Button } from "./ui";

const RADIUS = "rounded-[var(--radius)]";

const GREETING = {
  role: "assistant",
  text: "Hi! I'm the ParkMaster assistant. Ask me about availability, pricing, reservations, or monthly passes.",
};

const SUGGESTIONS = ["What are your prices?", "Are there free slots?", "How do I reserve?"];

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

  return (
    <>
      {open && (
        <div
          className={`fixed bottom-24 right-5 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden border border-line bg-surface shadow-[var(--shadow-pop)] ${RADIUS}`}
        >
          <header className="flex items-center justify-between bg-accent px-4 py-3 text-accent-fg">
            <div className="flex items-center gap-2">
              <Bot size={18} />
              <div>
                <p className="text-sm font-semibold leading-tight">ParkMaster Assistant</p>
                <p className="text-xs opacity-70">Parking help, anytime</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-full p-1 opacity-80 transition hover:bg-accent-fg/15 hover:opacity-100"
            >
              <X size={18} />
            </button>
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
            {messages.length === 1 && (
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
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-[var(--shadow-pop)] transition hover:opacity-90 active:translate-y-px"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
