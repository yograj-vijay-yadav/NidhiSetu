import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  FileText,
  Landmark,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";
import { DemoNotice } from "../components/ui";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Deterministic eligibility engine",
    body: "Income caps, age limits, project-cost thresholds and category matching are evaluated by data-driven rules — never by an LLM. Same input, same verdict, every time.",
  },
  {
    icon: Sparkles,
    title: "Multi-agent AI analysis",
    body: "Intake, eligibility, explanation and partner agents (LangGraph) turn your plain-language requirement into a clear, evidence-backed recommendation.",
  },
  {
    icon: FileText,
    title: "RAG-grounded evidence",
    body: "Retrieval-augmented citations surface the exact guideline sections behind each verdict — with graceful fallbacks when external services are offline.",
  },
  {
    icon: Calculator,
    title: "Pure EMI mathematics",
    body: "Loan amount, own contribution, monthly EMI and total repayment computed deterministically, including moratorium policies that are fully documented.",
  },
  {
    icon: SlidersHorizontal,
    title: "What-if simulator",
    body: "Drag income, project cost or age and watch eligibility change in real time — powered by the same deterministic engine that made the original call.",
  },
  {
    icon: Network,
    title: "Authorized partner matching",
    body: "NPA-flagged and inactive channelizing partners are never recommended. Match by scheme, category and location.",
  },
];

const FLOW_STEPS = [
  "Profile intake",
  "Eligibility engine",
  "RAG evidence",
  "Multi-agent analysis",
  "Scheme comparison",
  "Best-match recommendation",
  "EMI calculation",
  "What-if simulator",
  "Partner matching",
  "Application readiness",
  "Application tracking",
  "Analytics dashboard",
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-navy text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-saffron/20 blur-3xl" />
        <div className="absolute right-16 top-16 h-48 w-48 chakra-ring opacity-60 hidden md:block" />
        <div className="relative px-6 py-16 md:px-14 md:py-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 mb-6">
            <Workflow className="h-3.5 w-3.5" />
            AI-assisted · RAG-grounded · DEMO data
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Find the right government scheme.{" "}
            <span className="text-saffron">Understand your eligibility.</span> Plan your next
            step.
          </h1>
          <p className="mt-5 text-lg text-slate-200 max-w-2xl">
            AI-assisted scheme discovery grounded in configurable scheme rules and authoritative
            documents — with deterministic EMI math, evidence citations, what-if simulations and
            end-to-end application tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/intake" className="nidhi-btn nidhi-btn-saffron text-base">
              Check My Eligibility <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="nidhi-btn bg-white/10 text-white hover:bg-white/20 text-base"
            >
              Sign In / Demo Login
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-300">
            Final approval belongs to the relevant government agency, bank or authorized
            institution — NidhiSetu never claims to approve loans.
          </p>
        </div>
      </section>

      {/* PRODUCT FLOW */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
          From requirement to application — one guided pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step}
              className="nidhi-card px-4 py-3 flex items-center gap-3 hover:border-saffron transition-colors"
            >
              <span className="grid place-items-center h-7 w-7 rounded-full bg-navy text-white text-xs font-bold shrink-0">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-slate-700">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="nidhi-card p-6 hover:shadow-md transition-shadow">
            <feature.icon className="h-8 w-8 text-saffron mb-4" />
            <h3 className="font-bold text-slate-800">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.body}</p>
          </div>
        ))}
      </section>

      {/* DETERMINISTIC VS AI */}
      <section className="nidhi-card p-8">
        <div className="flex items-center gap-2 mb-6">
          <Landmark className="h-6 w-6 text-navy" />
          <h2 className="text-2xl font-bold text-slate-800">Why the split between deterministic and AI matters</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-5">
            <h3 className="font-bold text-emerald mb-2">Deterministic world (never AI)</h3>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• EMI / loan / interest / total-payment mathematics</li>
              <li>• Income caps, project-cost limits, age limits</li>
              <li>• Category and purpose matching</li>
              <li>• NPA filtering and application status transitions</li>
            </ul>
          </div>
          <div className="rounded-xl border border-saffron/40 bg-saffronsoft/50 p-5">
            <h3 className="font-bold text-saffron mb-2">AI world (narrates, never decides)</h3>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• Conversational intake and clarification</li>
              <li>• Reasoning over retrieved evidence</li>
              <li>• Scheme explanations and comparison narratives</li>
              <li>• Personalized, document-grounded answers</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-navy to-navy3 text-white px-8 py-12 text-center">
        <h2 className="text-3xl font-bold">Ready to find your scheme?</h2>
        <p className="mt-3 text-slate-200 max-w-xl mx-auto">
          Two minutes of intake — category, income, age and purpose — is all it takes to get a
          deterministic eligibility breakdown, indicative EMI and a readiness score.
        </p>
        <Link
          href="/intake"
          className="nidhi-btn nidhi-btn-saffron text-base mt-6 px-8 py-3"
        >
          Start Eligibility Check <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <DemoNotice />
    </div>
  );
}