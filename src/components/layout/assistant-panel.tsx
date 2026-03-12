"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { useAssistant } from "@/context/assistant-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Building2,
  BarChart3,
  Crosshair,
  Globe,
} from "lucide-react";

const suggestions = [
  { label: "Where are the gaps?", icon: Crosshair, description: "Sector exposure analysis", query: "Where are the gaps in our portfolio? What categories are we underweight in relative to our thesis, and where should we be looking for new investments?" },
  { label: "Best exits", icon: TrendingUp, description: "Top returning investments", query: "Rank our top 10 realized exits by MOIC and IRR. What patterns do you see in terms of sector, hold period, and entry timing that we should replicate?" },
  { label: "Fund comparison", icon: BarChart3, description: "Cross-fund benchmarking", query: "Compare all our funds side by side — TVPI, IRR, deployment pace, and number of investments. Which fund is tracking best relative to vintage year and how does our newer fund deployment look?" },
  { label: "Macro headwinds", icon: Globe, description: "Portfolio risk assessment", query: "Given the current macro environment, which portfolio companies face the most headwinds? Which are best positioned? Think about rates, consumer confidence, and input costs." },
  { label: "Consumer vs Tech", icon: Building2, description: "Strategy performance", query: "Compare our Consumer and Technology strategies — which has generated better returns, where are the concentration risks, and how do the active portfolios differ in maturity and category diversity?" },
  { label: "What would you do?", icon: Sparkles, description: "Investment thesis", query: "If you were a GP at VMG looking at our current portfolio and fund deployment, what would your top 3 priorities be for the next 12 months? Be specific about sectors, fund vehicles, and strategic rationale." },
];

export function AssistantPanel() {
  const { isOpen, messages, isLoading, toggle, sendMessage, clearMessages } =
    useAssistant();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Collapsed toggle button
  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-4 px-2 border-l border-border bg-card/50">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          aria-label="Open assistant"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
        <div className="mt-3 flex flex-col items-center gap-1">
          <Sparkles className="h-4 w-4 text-muted-foreground/80" />
          <span
            className="text-[10px] text-muted-foreground font-medium tracking-wider"
            style={{ writingMode: "vertical-lr" }}
          >
            COPILOT
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[380px] border-l border-border bg-card animate-fade-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">
            VMG Copilot
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-xl bg-secondary p-3 mb-4">
                <Sparkles className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                VMG Copilot
              </h3>
              <p className="text-xs text-muted-foreground mb-6 max-w-[240px]">
                Ask about portfolio companies, sectors, exits, or get investment insights.
              </p>

              <div className="w-full space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.query)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs hover:bg-accent transition-colors border border-border"
                  >
                    <s.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-foreground font-medium">{s.label}</span>
                      <span className="text-muted-foreground ml-1.5">{s.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2.5",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                {message.role === "assistant" ? (
                  <div className="shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-foreground" />
                  </div>
                ) : (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-foreground">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-2.5">
              <div className="shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-foreground animate-pulse" />
              </div>
              <div className="bg-secondary rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <Separator />
      <div className="p-3">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the portfolio..."
            className="min-h-[44px] max-h-[120px] pr-10 text-sm"
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 bottom-1.5 h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-1.5 text-center">
          AI-powered insights across the VMG portfolio
        </p>
      </div>
    </div>
  );
}
