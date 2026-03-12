import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vmg-backend-production.up.railway.app";

const VMG_SYSTEM_PROMPT = `You are VMG Copilot — the senior investment analyst embedded in VMG Partners' portfolio intelligence platform. You think like a GP, speak like a trusted colleague, and back every insight with data.

ABOUT VMG PARTNERS:
VMG Partners is a leading consumer-focused investment firm founded in 2005, based in San Francisco. AUM ~$3.4B across 8 funds and 116 historical investments (52 exits, 49 active). The firm's name comes from the sailing term "Velocity Made Good" — direction matters more than speed.

TWO STRATEGIES:
1. VMG Consumer — Majority/significant minority investments in branded consumer companies across beauty & personal care, food & beverage, health & wellness, and pet. Typical check: $30M-$150M. Focus on brands that "anchor modern life."
2. VMG Technology (VMG Catalyst) — Meaningful minority positions in B2B software companies serving the consumer ecosystem. Typical check: $15M-$80M. Focus on the infrastructure layer powering consumer brands (MarTech, supply chain, vertical SaaS, commerce platforms).

YOUR CAPABILITIES:
- Deep portfolio analysis: sector exposure, concentration risk, vintage year analysis, category gaps
- Fund performance benchmarking: TVPI, DPI, RVPI, IRR attribution, deployment pacing
- Investment pattern recognition: entry valuations, hold periods, exit multiples, sector rotation
- Market landscape analysis: identify white space, competitive dynamics, emerging categories
- Macro impact assessment: how rates, inflation, and consumer confidence affect the portfolio
- Thesis development: connect portfolio patterns to investment hypotheses

HOW TO RESPOND:
- Lead with the insight, not the data dump. What does the data MEAN for VMG?
- Be specific: cite actual company names, fund metrics, dollar amounts, and MOICs from the live data
- When asked about gaps or opportunities, reason through what VMG's portfolio reveals about the firm's thesis, then identify logical adjacencies or underweight areas
- When comparing, use tables with markdown formatting
- Be direct and opinionated — GPs don't want hedged non-answers. Take a position backed by the data
- Keep responses focused: 150-300 words for simple questions, up to 500 for complex analysis
- If the data doesn't support a conclusion, say so clearly rather than speculating

IMPORTANT: The LIVE DATA section below is your single source of truth. Reference it directly. Do not hallucinate companies, metrics, or fund data that isn't in the live data.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages } = await req.json();

    // Fetch live context from the backend
    let liveContext = "";
    try {
      const ctxRes = await fetch(`${API_BASE}/api/assistant/context`, {
        next: { revalidate: 60 },
      });
      if (ctxRes.ok) {
        const ctx = await ctxRes.json();
        liveContext = `

--- LIVE DATA (as of ${ctx.timestamp}) ---

${ctx.portfolio_summary}

${ctx.company_data}

${ctx.fund_performance}

${ctx.top_holdings}

${ctx.exit_data}

${ctx.macro_context}

${ctx.funding_data}

--- END LIVE DATA ---`;
      }
    } catch {
      // Context fetch failed, proceed without it
    }

    const systemMessage = VMG_SYSTEM_PROMPT + liveContext;
    const recentMessages = messages.slice(-20);

    // Try Claude API first, then OpenAI, then mock
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey) {
      return await callClaude(anthropicKey, systemMessage, recentMessages);
    }

    if (openaiKey) {
      return await callOpenAI(openaiKey, systemMessage, recentMessages);
    }

    // No API key — use intelligent mock
    const lastMessage = messages[messages.length - 1]?.content || "";
    return NextResponse.json({
      content: generateMockResponse(lastMessage, liveContext),
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json(
      { content: "I encountered an error processing your request. Please try again." },
      { status: 500 }
    );
  }
}

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: { role: string; content: string }[]
) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude API error:", response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content =
    data.content?.[0]?.text || "No response generated.";

  return NextResponse.json({ content });
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  messages: { role: string; content: string }[]
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "No response generated.";
  return NextResponse.json({ content });
}

function generateMockResponse(query: string, liveContext: string): string {
  // If we have live context but no LLM key, give a helpful message
  // pointing users to set up the API key
  const hasContext = liveContext.length > 100;

  const q = query.toLowerCase();

  if (q.includes("overview") || q.includes("portfolio") || q.includes("summary")) {
    if (hasContext) {
      return "**VMG Copilot** is running in preview mode — I have access to your live portfolio data but need an AI API key to generate dynamic analysis.\n\nTo unlock full intelligence:\n1. Add `ANTHROPIC_API_KEY` (recommended) or `OPENAI_API_KEY` to your Vercel environment variables\n2. Redeploy\n\nOnce configured, I can provide deep portfolio analysis, sector gap identification, fund benchmarking, and investment thesis development — all grounded in your real data.\n\nFor now, explore the **Portfolio**, **Fund**, and **Industry** pages for pre-built analytics.";
    }
    return "**VMG Copilot** needs to be configured with an AI API key.\n\nAdd `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to your Vercel environment variables to enable intelligent portfolio analysis.\n\nI'll be able to analyze sector gaps, benchmark fund performance, identify investment patterns, and develop thesis-driven insights — all from your live portfolio data.";
  }

  return `**VMG Copilot** is running in preview mode.\n\nYou asked: *"${query}"*\n\nTo get a thoughtful, data-driven answer to this question, add an \`ANTHROPIC_API_KEY\` or \`OPENAI_API_KEY\` to your Vercel environment variables and redeploy.\n\nOnce configured, I'll analyze your live portfolio data (${hasContext ? "which I can already access" : "companies, funds, exits, and macro indicators"}) to provide specific, actionable insights.`;
}
