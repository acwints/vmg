import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://vmg-backend-production.up.railway.app";

const VMG_SYSTEM_PROMPT = `You are VMG Copilot, an AI assistant for VMG Partners' internal portfolio intelligence platform.

VMG Partners is a consumer-focused investment firm with two strategies:
1. VMG Technology - Meaningful minority positions in B2B software companies serving the consumer ecosystem ($4M-$40M revenue, early stage through Series C)
2. VMG Consumer - Consumer brands across food & beverage, beauty & personal care, wellness & fitness, and pet

Key philosophy: "Velocity Made Good" - direction matters more than speed. Named after the sailing term measuring speed toward a destination, not just raw speed.

You have access to live portfolio data, fund performance metrics, macroeconomic indicators, and funding history. The LIVE DATA section below contains the current state of the portfolio — always reference specific numbers, company counts, TVPI, IRR, and other metrics from that data when answering questions. Do not guess or use outdated figures; rely on what the live data provides.

You help the VMG team analyze portfolio performance, compare companies, identify trends, and generate investment insights. Be concise, data-driven, and professional. Use the nautical/sailing metaphors when appropriate.`;

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
      const ctxRes = await fetch(`${API_BASE}/api/assistant/context`);
      if (ctxRes.ok) {
        const ctx = await ctxRes.json();
        liveContext = `

LIVE DATA (as of ${ctx.timestamp}):

${ctx.portfolio_summary}

${ctx.fund_performance}

${ctx.macro_context}

${ctx.funding_data}`;
      }
    } catch {
      // Context fetch failed, proceed without it
    }

    // If no OpenAI key, return a helpful mock response
    if (!process.env.OPENAI_API_KEY) {
      const lastMessage = messages[messages.length - 1]?.content || "";
      const mockResponse = generateMockResponse(lastMessage);
      return NextResponse.json({ content: mockResponse });
    }

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: VMG_SYSTEM_PROMPT + liveContext },
          ...messages.slice(-10),
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json(
      { content: "I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}

function generateMockResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("portfolio overview") || q.includes("overview")) {
    return "**VMG Partners Portfolio Overview**\n\nAcross both strategies, VMG manages 55 portfolio companies:\n\n- **Technology**: 23 companies (22 active, 1 realized) across Software and Marketplace sectors\n- **Consumer**: 32 companies (14 active, 18 realized) spanning Beauty, Food & Bev, Wellness, and Pet\n\nNotable realized exits include KIND (acquired by Mars), Drunk Elephant (Shiseido), Sun Bum (SC Johnson), and Quest Nutrition (Simply Good Foods).\n\n*Connect data sources on individual company pages for live financial metrics.*";
  }

  if (q.includes("growth") || q.includes("analysis")) {
    return "**Portfolio Analysis**\n\nTo surface growth metrics and financial performance data, connect external data sources on each company's detail page. Available integrations include:\n\n- **Crunchbase** — Funding history and market intel\n- **SimilarWeb** — Web traffic and digital analytics\n- **Clearbit** — Company enrichment data\n- **LinkedIn / Glassdoor** — Talent and employer data\n\nOnce connected, I'll be able to provide detailed growth analysis across the portfolio.";
  }

  if (q.includes("sector") || q.includes("breakdown")) {
    return "**Sector Breakdown**\n\n**Technology** (2 sectors):\n- Software: 18 companies (MarTech, supply chain, vertical SaaS)\n- Marketplaces: 5 companies (e-commerce, workforce, grocery)\n\n**Consumer** (4 sectors):\n- Beauty & Personal Care: 12 companies (6 active)\n- Food & Beverage: 11 companies (3 active)\n- Wellness & Fitness: 5 companies (2 active)\n- Pet: 4 companies (2 active)\n\nBeauty has the most active investments, while Food & Bev has the most realized exits.";
  }

  if (q.includes("macro") || q.includes("economic") || q.includes("environment")) {
    return "**Macro Environment Summary**\n\nKey indicators as of early 2026:\n\n- **Fed Funds Rate**: 3.75% (easing cycle continuing)\n- **10Y Treasury**: 4.12%\n- **CPI YoY**: 2.4% (trending toward target)\n- **Consumer Confidence**: 68.4 (recovering)\n- **GDP Growth**: 2.1% (moderate)\n\n**Portfolio Implications:**\n- Easing rates support higher exit multiples for consumer brands\n- Moderating inflation benefits CPG portfolio companies' margins\n- Consumer confidence recovery is a tailwind for VMG's consumer thesis\n- Tech valuations stabilizing as rate cuts continue\n\nVisit the **Macro** dashboard for detailed charts and time series.";
  }

  if (q.includes("fund") || q.includes("tvpi") || q.includes("irr") || q.includes("performance")) {
    return "**Fund Performance Summary** *(simulated data)*\n\n| Fund | Vintage | TVPI | Net IRR | Status |\n|------|---------|------|---------|--------|\n| VMG Partners I | 2007 | 3.96x | 23.1% | Closed |\n| VMG Partners II | 2010 | 4.18x | 22.9% | Closed |\n| VMG Partners III | 2014 | 2.59x | 14.6% | Closed |\n| VMG Partners V | 2021 | 2.75x | 28.5% | Active |\n| VMG Catalyst I | 2019 | 2.52x | 30.7% | Harvesting |\n| VMG Catalyst II | 2022 | 3.11x | 12.1% | Active |\n\n**Weighted TVPI**: 3.09x | **Weighted Net IRR**: 22.0%\n\nAll closed funds are performing in the **top quartile** for consumer PE. VMG Partners V is on a strong trajectory with 72% deployment.\n\nSee the **Fund Model** page for deal-level economics and portfolio construction analysis.";
  }

  if (q.includes("exit") || q.includes("realized")) {
    return "**Realized Investments**\n\nNotable exits by acquirer:\n\n- **Drunk Elephant** → Shiseido\n- **KIND** → Mars\n- **Sun Bum** → SC Johnson\n- **Quest Nutrition** → Simply Good Foods\n- **Briogeo** → Wella\n- **Justin's** → Hormel\n- **Pirate's Booty** → B&G Foods\n- **Lily's Sweets** → Hershey\n- **Natural Balance** → J.M. Smucker\n- **Vega** → Danone\n\nVisit each company's detail page for more information on investment and exit timelines.";
  }

  return "I'm VMG Copilot, ready to help you navigate the portfolio. You can ask me about:\n\n- **Portfolio overview** — Summary across Technology & Consumer\n- **Sector breakdown** — Distribution across categories\n- **Realized investments** — Exit history and acquirers\n\nFor live financial metrics, connect data sources on individual company pages.\n\nWhat would you like to explore?";
}
