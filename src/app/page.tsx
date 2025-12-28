"use client";

import { useMemo, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import {
  AgentEvent,
  AgentState,
  BrandProfile,
  Campaign,
  ContentDraft,
  ContentIdea,
  PipelineStage,
  Platform,
} from "./types";
import {
  createId,
  draftsFromIdea,
  generateIdeas,
  scoreDraft,
} from "./utils/agent";

const PLATFORMS: Platform[] = ["Instagram", "LinkedIn", "TikTok", "X"];

const today = new Date();
const horizon = new Date();
horizon.setDate(today.getDate() + 14);

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const defaultBrand: BrandProfile = {
  name: "Orbit Studio",
  mission: "help lean marketing teams ship audience-resonant stories every week",
  tone: "energised strategist with clear playbooks and accountable follow-through",
  pillars: ["Audience intelligence", "Creative ops", "Conversion storytelling"],
  hashtags: ["#orbitstudio", "#contentops", "#socialplaybooks"],
  callToAction: "Book an async audit today",
  primaryAudience: "B2B marketing leads building creator-led funnels",
};

const defaultCampaign: Campaign = {
  id: createId(),
  title: "Launch Playbook Sprint",
  objective: "Pipeline activation",
  audience: "Revenue-focused marketing leads",
  offer: "Free Notion system to operationalise social loops",
  platforms: ["Instagram", "LinkedIn", "X"],
  timeline: {
    start: toDateInputValue(today),
    end: toDateInputValue(horizon),
  },
};

const initialState: AgentState = {
  brand: defaultBrand,
  campaigns: [defaultCampaign],
  ideas: [],
  drafts: [],
  events: [],
};

const stageLabels: Record<PipelineStage, string> = {
  ideas: "Idea Vault",
  drafts: "Draft Studio",
  scheduled: "Scheduled Drops",
  published: "Shipped & Live",
};

const stageAccent: Record<PipelineStage, string> = {
  ideas: "border-slate-500/40",
  drafts: "border-amber-400/50",
  scheduled: "border-emerald-400/60",
  published: "border-blue-400/60",
};

const stageOrder: PipelineStage[] = ["drafts", "scheduled", "published"];

const nextStage: Record<PipelineStage, PipelineStage | null> = {
  ideas: "drafts",
  drafts: "scheduled",
  scheduled: "published",
  published: null,
};

const prevStage: Record<PipelineStage, PipelineStage | null> = {
  ideas: null,
  drafts: null,
  scheduled: "drafts",
  published: "scheduled",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const toLocalInput = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoFromInput = (value: string) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() + tzOffset).toISOString();
};

const SectionCard = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_30px_120px_-50px_rgba(15,118,110,0.55)] backdrop-blur">
    <div className="flex flex-col gap-2 border-b border-white/5 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-slate-300/80">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2 md:mt-0">{action}</div> : null}
    </div>
    <div className="pt-4">{children}</div>
  </section>
);

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
    <span className="font-medium text-white">{value}</span>
    <span className="ml-2 text-slate-300/80">{label}</span>
  </div>
);

export default function Home() {
  const [agentState, setAgentState] = useLocalStorage<AgentState>(
    "agentic-state-v1",
    initialState,
  );
  const [activeCampaignId, setActiveCampaignId] = useLocalStorage<string>(
    "agentic-active-campaign",
    defaultCampaign.id,
  );
  const [ideaQuantity, setIdeaQuantity] = useState(4);
  const [creativeBrief, setCreativeBrief] = useState("");

  const activeCampaign =
    agentState.campaigns.find((campaign) => campaign.id === activeCampaignId) ??
    agentState.campaigns[0];

  const activeIdeas = useMemo(
    () =>
      agentState.ideas.filter(
        (idea) => idea.campaignId === activeCampaign?.id,
      ),
    [agentState.ideas, activeCampaign?.id],
  );

  const activeDrafts = useMemo(
    () =>
      agentState.drafts.filter(
        (draft) => draft.campaignId === activeCampaign?.id,
      ),
    [agentState.drafts, activeCampaign?.id],
  );

  const scheduledDrafts = activeDrafts.filter(
    (draft) => draft.stage === "scheduled",
  );
  const publishedDrafts = activeDrafts.filter(
    (draft) => draft.stage === "published",
  );

  const commit = (
    updater: (prev: AgentState) => AgentState,
    event?: Omit<AgentEvent, "id" | "timestamp">,
  ) => {
    setAgentState((previous) => {
      const working = updater(previous);

      if (!event) {
        return working;
      }

      const entry: AgentEvent = {
        id: createId(),
        timestamp: new Date().toISOString(),
        tone: event.tone,
        label: event.label,
        details: event.details,
      };

      return {
        ...working,
        events: [entry, ...working.events].slice(0, 60),
      };
    });
  };

  const updateBrand = (patch: Partial<BrandProfile>, label: string) => {
    commit(
      (prev) => ({
        ...prev,
        brand: {
          ...prev.brand,
          ...patch,
        },
      }),
      {
        label: "Brand System Updated",
        details: label,
        tone: "info",
      },
    );
  };

  const updateCampaign = (
    campaignId: string,
    patch: Partial<Campaign>,
    label: string,
  ) => {
    commit(
      (prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, ...patch }
            : campaign,
        ),
      }),
      {
        label: "Campaign Blueprint Tweaked",
        details: label,
        tone: "info",
      },
    );
  };

  const handleGenerateIdeas = () => {
    if (!activeCampaign) return;

    commit(
      (prev) => {
        const payload = generateIdeas(
          prev.brand,
          activeCampaign,
          ideaQuantity,
          creativeBrief.trim() || undefined,
        );

        const merged = [...payload, ...prev.ideas];
        const unique: ContentIdea[] = [];
        const seen = new Set<string>();

        merged.forEach((idea) => {
          if (seen.has(idea.id)) return;
          seen.add(idea.id);
          unique.push(idea);
        });

        return {
          ...prev,
          ideas: unique.slice(0, 40),
        };
      },
      {
        label: "Ideation Sprint Complete",
        details: `Generated ${ideaQuantity} angles for ${activeCampaign.title}`,
        tone: "success",
      },
    );
  };

  const handlePromoteToDrafts = (idea: ContentIdea) => {
    if (!activeCampaign) return;

    commit(
      (prev) => {
        const existingDrafts = prev.drafts.filter(
          (draft) => draft.ideaId === idea.id,
        );

        if (existingDrafts.length) {
          return prev;
        }

        const newDrafts = draftsFromIdea(
          idea,
          prev.brand,
          activeCampaign,
          prev.drafts.length,
        );

        return {
          ...prev,
          drafts: [...newDrafts, ...prev.drafts].slice(0, 60),
        };
      },
      {
        label: "Draft Pack Created",
        details: `Idea “${idea.headline}” materialised into platform-ready scripts`,
        tone: "success",
      },
    );
  };

  const mutateDraft = (
    draftId: string,
    patch: Partial<ContentDraft>,
    label: string,
    tone: AgentEvent["tone"] = "info",
  ) => {
    commit(
      (prev) => ({
        ...prev,
        drafts: prev.drafts.map((draft) =>
          draft.id === draftId ? { ...draft, ...patch } : draft,
        ),
      }),
      {
        label,
        details: patch.stage
          ? `Moved to ${stageLabels[patch.stage]}`
          : label,
        tone,
      },
    );
  };

  const createCampaign = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 10);

    const newCampaign: Campaign = {
      id: createId(),
      title: "New Growth Wave",
      objective: "Visibility uplift",
      audience: agentState.brand.primaryAudience,
      offer: "Deep-dive thread + resource bundle",
      platforms: ["LinkedIn", "X"],
      timeline: {
        start: toDateInputValue(start),
        end: toDateInputValue(end),
      },
    };

    commit(
      (prev) => ({
        ...prev,
        campaigns: [newCampaign, ...prev.campaigns],
      }),
      {
        label: "Campaign Added",
        details: `Spun up ${newCampaign.title}`,
        tone: "success",
      },
    );

    setActiveCampaignId(newCampaign.id);
  };

  const resetCampaignAssets = () => {
    if (!activeCampaign) return;

    commit(
      (prev) => ({
        ...prev,
        ideas: prev.ideas.filter(
          (idea) => idea.campaignId !== activeCampaign.id,
        ),
        drafts: prev.drafts.filter(
          (draft) => draft.campaignId !== activeCampaign.id,
        ),
      }),
      {
        label: "Pipeline Reset",
        details: `Cleared artefacts for ${activeCampaign.title}`,
        tone: "warning",
      },
    );
  };

  const exportPlan = async () => {
    if (!activeCampaign) return;
    const payload = {
      brand: agentState.brand,
      campaign: activeCampaign,
      ideas: activeIdeas,
      drafts: activeDrafts,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      commit((prev) => prev, {
        label: "Plan Copied",
        details: "JSON blueprint copied to clipboard",
        tone: "success",
      });
    } catch (error) {
      console.error(error);
      commit((prev) => prev, {
        label: "Clipboard Blocked",
        details: "Grant clipboard access to export plan",
        tone: "warning",
      });
    }
  };

  const brand = agentState.brand;

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-slate-100">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-12 md:px-6 lg:px-8">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 p-8 shadow-[0_40px_140px_-80px_rgba(16,185,129,0.9)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                Social Content Agent
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Orbit Control: Social Media Content Manager
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300">
                Orchestrate brand voice, campaign ideas, platform-ready drafts,
                and rollout timing from a single agentic workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatPill
                label="ideas mapped"
                value={`${activeIdeas.length.toString().padStart(2, "0")}`}
              />
              <StatPill
                label="scheduled drops"
                value={`${scheduledDrafts.length
                  .toString()
                  .padStart(2, "0")}`}
              />
              <StatPill
                label="shipped posts"
                value={`${publishedDrafts.length
                  .toString()
                  .padStart(2, "0")}`}
              />
            </div>
          </div>
        </header>

        <SectionCard
          title="Brand System"
          subtitle="Define the edges of voice, promise, and proof so the agent can design effective assets."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                Brand Name
              </span>
              <input
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.name}
                onChange={(event) =>
                  updateBrand({ name: event.target.value }, "Rewired brand name")
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                Primary Audience
              </span>
              <input
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.primaryAudience}
                onChange={(event) =>
                  updateBrand(
                    { primaryAudience: event.target.value },
                    "Refined audience focus",
                  )
                }
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                Mission Statement
              </span>
              <textarea
                rows={2}
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.mission}
                onChange={(event) =>
                  updateBrand(
                    { mission: event.target.value },
                    "Updated mission anchor",
                  )
                }
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                Voice Direction
              </span>
              <textarea
                rows={2}
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.tone}
                onChange={(event) =>
                  updateBrand({ tone: event.target.value }, "Adjusted tone map")
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                Strategic Pillars (comma separated)
              </span>
              <input
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.pillars.join(", ")}
                onChange={(event) =>
                  updateBrand(
                    {
                      pillars: event.target.value
                        .split(/[,|\n]/)
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                    "Pillars recalibrated",
                  )
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                House Hashtags
              </span>
              <input
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.hashtags.join(", ")}
                onChange={(event) =>
                  updateBrand(
                    {
                      hashtags: event.target.value
                        .split(/[,|\n]/)
                        .map((item) => item.trim())
                        .filter(Boolean),
                    },
                    "Hashtag stack refreshed",
                  )
                }
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-300/90">
                Primary Call to Action
              </span>
              <input
                className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                value={brand.callToAction}
                onChange={(event) =>
                  updateBrand(
                    { callToAction: event.target.value },
                    "CTA recalibrated",
                  )
                }
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Campaign Control Centre"
          subtitle="Switch programs, evolve messaging, and keep the runway aligned."
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={createCampaign}
                className="rounded-full border border-emerald-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/10"
              >
                New Campaign
              </button>
              <button
                type="button"
                onClick={resetCampaignAssets}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-white/10"
              >
                Clear Pipeline
              </button>
              <button
                type="button"
                onClick={exportPlan}
                className="rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400"
              >
                Copy Plan JSON
              </button>
            </div>
          }
        >
          <div className="flex flex-wrap gap-3">
            {agentState.campaigns.map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setActiveCampaignId(campaign.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  campaign.id === activeCampaign?.id
                    ? "border-emerald-400/70 bg-emerald-500/10 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                    : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-emerald-400/40 hover:text-white"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-emerald-200/80">
                  {campaign.title}
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {campaign.objective}
                </p>
                <p className="mt-1 text-[11px] text-slate-300/80">
                  {campaign.platforms.join(" • ")}
                </p>
              </button>
            ))}
          </div>

          {activeCampaign ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                  Objective
                </span>
                <input
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                  value={activeCampaign.objective}
                  onChange={(event) =>
                    updateCampaign(
                      activeCampaign.id,
                      { objective: event.target.value },
                      "Objective recalculated",
                    )
                  }
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                  Offer
                </span>
                <input
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                  value={activeCampaign.offer}
                  onChange={(event) =>
                    updateCampaign(
                      activeCampaign.id,
                      { offer: event.target.value },
                      "Offer sharpened",
                    )
                  }
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                  Audience Snapshot
                </span>
                <textarea
                  rows={2}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                  value={activeCampaign.audience}
                  onChange={(event) =>
                    updateCampaign(
                      activeCampaign.id,
                      { audience: event.target.value },
                      "Audience clarified",
                    )
                  }
                />
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                  Channel Mix
                </span>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => {
                    const selected = activeCampaign.platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? activeCampaign.platforms.filter(
                                (item) => item !== platform,
                              )
                            : [...activeCampaign.platforms, platform];
                          updateCampaign(
                            activeCampaign.id,
                            { platforms: next },
                            `Channel mix set to ${next.join(", ")}`,
                          );
                        }}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          selected
                            ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                            : "border-white/10 bg-slate-900/70 text-slate-300 hover:border-emerald-400/40 hover:text-white"
                        }`}
                      >
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                    Kickoff
                  </span>
                  <input
                    type="date"
                    className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                    value={activeCampaign.timeline.start}
                    onChange={(event) =>
                      updateCampaign(
                        activeCampaign.id,
                        {
                          timeline: {
                            ...activeCampaign.timeline,
                            start: event.target.value,
                          },
                        },
                        "Campaign start shifted",
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                    Wrap
                  </span>
                  <input
                    type="date"
                    className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-emerald-400/60"
                    value={activeCampaign.timeline.end}
                    onChange={(event) =>
                      updateCampaign(
                        activeCampaign.id,
                        {
                          timeline: {
                            ...activeCampaign.timeline,
                            end: event.target.value,
                          },
                        },
                        "Campaign end shifted",
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Idea Intelligence"
          subtitle="The agent analyses your brief, composes hooks, and serves platform-ready angles."
          action={
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
                <span>Idea Count</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={ideaQuantity}
                  onChange={(event) =>
                    setIdeaQuantity(Number(event.target.value))
                  }
                  className="w-16 rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-right text-sm outline-none focus:border-emerald-400/60"
                />
              </label>
              <button
                type="button"
                onClick={handleGenerateIdeas}
                className="rounded-full bg-emerald-500/90 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400"
              >
                Generate Angles
              </button>
            </div>
          }
        >
          <label className="mb-5 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
              Quick Brief (optional)
            </span>
            <textarea
              rows={2}
              placeholder="Trend, promo hook, or creative constraints to inject…"
              value={creativeBrief}
              onChange={(event) => setCreativeBrief(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-emerald-400/60"
            />
          </label>

          {activeIdeas.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeIdeas.map((idea) => {
                const hasDrafts = agentState.drafts.some(
                  (draft) => draft.ideaId === idea.id,
                );
                return (
                  <article
                    key={idea.id}
                    className="flex flex-col gap-3 rounded-2xl border border-emerald-400/20 bg-slate-900/70 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-emerald-200/90">
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          {idea.headline}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePromoteToDrafts(idea)}
                        disabled={hasDrafts}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                          hasDrafts
                            ? "cursor-not-allowed border border-white/10 bg-white/5 text-slate-400"
                            : "border border-emerald-400/60 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                        }`}
                      >
                        {hasDrafts ? "Drafted" : "Build Drafts"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-300/90">{idea.angle}</p>
                    <div className="flex flex-wrap gap-2">
                      {idea.formats.map((platform) => (
                        <span
                          key={platform}
                          className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-wide text-emerald-100"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-300/80">
                      {idea.supportingPoints.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span className="mt-[3px] h-[6px] w-[6px] rounded-full bg-emerald-400/80" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
                      <p>
                        <span className="font-semibold text-white">
                          Visual:
                        </span>{" "}
                        {idea.recommendedVisual}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-white">CTA:</span>{" "}
                        {idea.suggestedCta}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-slate-300">
              Run the generator to seed your idea vault. Each batch aligns to
              the active campaign brief and ready-to-build drafts.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Pipeline Orchestration"
          subtitle="Every asset sits in a visible column so you always know what ships next."
        >
          {activeDrafts.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {stageOrder.map((stage) => (
                <div
                  key={stage}
                  className={`flex flex-col gap-4 rounded-3xl border ${stageAccent[stage]} bg-slate-900/60 p-4`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-emerald-200/90">
                      {stageLabels[stage]}
                    </p>
                    <span className="text-xs text-slate-300/70">
                      {
                        activeDrafts.filter((draft) => draft.stage === stage)
                          .length
                      }{" "}
                      items
                    </span>
                  </div>
                  {activeDrafts
                    .filter((draft) => draft.stage === stage)
                    .sort(
                      (a, b) =>
                        new Date(a.schedule).getTime() -
                        new Date(b.schedule).getTime(),
                    )
                    .map((draft) => (
                      <div
                        key={draft.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-emerald-200/90">
                              {draft.platform}
                            </p>
                            <h4 className="mt-1 text-sm font-semibold text-white">
                              {draft.caption.split("\n")[0]}
                            </h4>
                          </div>
                          <span className="rounded-full border border-emerald-400/50 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                            Score {scoreDraft(draft)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300/90">
                          {draft.assetBrief}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {draft.hashtags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <label className="mt-3 flex flex-col gap-2 text-xs text-slate-300">
                          <span>Scheduled Drop</span>
                          <input
                            type="datetime-local"
                            value={toLocalInput(draft.schedule)}
                            onChange={(event) =>
                              mutateDraft(
                                draft.id,
                                { schedule: toIsoFromInput(event.target.value) },
                                "Schedule refined",
                              )
                            }
                            className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-400/60"
                          />
                        </label>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {prevStage[stage] ? (
                            <button
                              type="button"
                              onClick={() =>
                                mutateDraft(
                                  draft.id,
                                  { stage: prevStage[stage] ?? stage },
                                  "Stage reversed",
                                  "warning",
                                )
                              }
                              className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300 transition hover:bg-white/10"
                            >
                              Back
                            </button>
                          ) : null}
                          {nextStage[stage] ? (
                            <button
                              type="button"
                              onClick={() =>
                                mutateDraft(
                                  draft.id,
                                  { stage: nextStage[stage] ?? stage },
                                  nextStage[stage] === "scheduled"
                                    ? "Scheduling locked"
                                    : "Published 🎉",
                                  nextStage[stage] === "scheduled"
                                    ? "info"
                                    : "success",
                                )
                              }
                              className="rounded-full bg-emerald-500/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400"
                            >
                              Move Forward
                            </button>
                          ) : null}
                        </div>

                        <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">
                          Deploys {formatDateTime(draft.schedule)}
                        </p>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-slate-300">
              Move an idea into drafts to activate the pipeline. Each column
              mirrors how the agent tracks execution readiness.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Schedule Radar"
          subtitle="Glance at the next drops, coverage gaps, and current focus."
        >
          {activeDrafts.length ? (
            <div className="space-y-3">
              {activeDrafts
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.schedule).getTime() -
                    new Date(b.schedule).getTime(),
                )
                .map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-emerald-200/90">
                        {draft.platform} • {stageLabels[draft.stage]}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {draft.caption.split("\n")[0]}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-300/90">
                      <p>{formatDateTime(draft.schedule)}</p>
                      <p className="mt-1 text-slate-400">
                        Idea source:{" "}
                        {
                          activeIdeas.find((idea) => idea.id === draft.ideaId)
                            ?.hook
                        }
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-slate-300">
              Once drafts exist, the radar will show cadence, channel balance,
              and proximity to publish moments.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Agent Activity"
          subtitle="Latest plays the content agent executed on your behalf."
        >
          {agentState.events.length ? (
            <ul className="space-y-3">
              {agentState.events.slice(0, 15).map((event) => (
                <li
                  key={event.id}
                  className={`flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm ${
                    event.tone === "success"
                      ? "border-emerald-400/40"
                      : event.tone === "warning"
                      ? "border-amber-400/40"
                      : "border-white/10"
                  }`}
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="font-semibold text-white">{event.label}</p>
                    <p className="text-slate-300/90">{event.details}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-slate-300">
              As you collaborate with the agent, every move is summarised here
              for auditability.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
