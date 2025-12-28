import { BrandProfile, Campaign, ContentDraft, ContentIdea, Platform } from "../types";

const PLATFORM_VOICES: Record<Platform, string> = {
  Instagram: "Storyboard visuals + energetic caption with emojis",
  LinkedIn: "Professional narrative with value-driven hook",
  TikTok: "Short-form storytelling with bold hook in first second",
  X: "Punchy one-liner with curiosity gap and hashtag support",
};

const CTA_PATTERNS = [
  "Tap to learn more",
  "Share your thoughts below",
  "Save this post for later",
  "Tell us your favorite",
  "Send this to a teammate",
  "Comment with your next move",
  "DM us for the full playbook",
];

const VISUAL_TEMPLATES = [
  "Carousel showing before → after transformation",
  "Behind-the-scenes clip of the workflow",
  "Quote card with bold typography",
  "POV clip walking through the process",
  "Split-screen demo highlighting the result",
  "UGC-style testimonial overlay",
  "Animated explainer with key stats",
];

const ANGLES = [
  "Pain → Promise transformation",
  "Myth busting with data in context",
  "Minute build tutorial walkthrough",
  "Community spotlight story arc",
  "Behind-the-scenes reveal",
  "Trend hijack with unique spin",
  "Step-by-step execution plan",
  "Contrast between old way and new way",
];

const HOOK_PATTERNS = [
  "You{apostrophe}re wasting {x}% of your {resource} doing this wrong",
  "Steal our {count}-step {benefit} playbook",
  "The {time}-minute framework that unlocked {outcome}",
  "{emoji} Stop scrolling if {condition}",
  "{count} signals your {topic} is stuck in {year}",
  "Nobody talks about {topic}, yet it{apostrophe}s the lever for {outcome}",
  "How we tripled {metric} without {common pain}",
  "What {industry} leaders know about {topic} that others ignore",
];

function getRandom<T>(collection: T[]): T;
function getRandom<T>(collection: T[], take: number): T[];
function getRandom<T>(collection: T[], take = 1) {
  const pool = [...collection];
  const picks: T[] = [];

  for (let i = 0; i < take && pool.length; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }

  return (take === 1 ? picks[0] : picks) as T | T[];
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export function generateIdeas(
  brand: BrandProfile,
  campaign: Campaign,
  total = 4,
  creativeBrief?: string,
): ContentIdea[] {
  const ideas: ContentIdea[] = [];

  for (let index = 0; index < total; index += 1) {
    const angle = getRandom(ANGLES);
    const visual = getRandom(VISUAL_TEMPLATES);
    const hookPattern = getRandom(HOOK_PATTERNS);

    const headline = hookPattern
      .replace("{apostrophe}", "'")
      .replace("{emoji}", "⚡️")
      .replace("{count}", String(Math.floor(Math.random() * 3) + 3))
      .replace("{x}", String(Math.floor(Math.random() * 40) + 20))
      .replace("{resource}", campaign.objective.toLowerCase())
      .replace("{benefit}", campaign.objective.toLowerCase())
      .replace("{time}", String(Math.floor(Math.random() * 10) + 5))
      .replace("{outcome}", brand.mission.toLowerCase())
      .replace("{condition}", campaign.audience.toLowerCase())
      .replace("{topic}", campaign.objective.toLowerCase())
      .replace("{metric}", brand.pillars[0]?.toLowerCase() ?? "engagement")
      .replace("{common pain}", `wasting ${getRandom(["budget", "headcount", "creative hours"])}`)
      .replace("{industry}", slugify(brand.name).replace(/-/g, " ").toUpperCase());

    const supportingPoints = [
      `Angle: ${angle}`,
      `Brand Pillar Tie-in: ${getRandom(brand.pillars)}`,
      `Audience Tension: ${campaign.audience}`,
      `Proof or stat slot (fill with your recent data)`,
    ];

    if (creativeBrief) {
      supportingPoints.splice(1, 0, `Brief integration: ${creativeBrief}`);
    }

    ideas.push({
      id: createId(),
      campaignId: campaign.id,
      headline,
      hook: headline.split(" ").slice(0, 7).join(" "),
      angle,
      formats: campaign.platforms,
      supportingPoints,
      recommendedVisual: visual,
      suggestedCta: getRandom(CTA_PATTERNS),
      createdAt: new Date().toISOString(),
    });
  }

  return ideas;
}

const PLATFORM_HASHTAGS: Record<Platform, string[]> = {
  Instagram: ["#reels", "#socialstrategy", "#contentdesign", "#growthmarketing"],
  LinkedIn: ["#growthstrategy", "#leadership", "#productmarketing", "#futureofwork"],
  TikTok: ["#learnontiktok", "#marketingtok", "#creatortips", "#viralstrategies"],
  X: ["#buildinpublic", "#marketingtwitter", "#contentmarketing", "#digitalstrategy"],
};

function buildHashtags(base: string[], platform: Platform, limit = 5) {
  const merged = [...base, ...PLATFORM_HASHTAGS[platform]];
  const unique = [...new Set(merged.map((tag) => (tag.startsWith("#") ? tag : `#${slugify(tag)}`)))];
  return unique.slice(0, limit);
}

function platformCaption(idea: ContentIdea, brand: BrandProfile, platform: Platform): string {
  const voice = PLATFORM_VOICES[platform];
  const talkingPoint = idea.supportingPoints[1] ?? idea.angle;
  const cta = idea.suggestedCta || brand.callToAction;

  const base = [
    idea.headline,
    "",
    `${talkingPoint}.`,
    `Why it matters for ${brand.primaryAudience || "your audience"}: ${brand.mission}.`,
    "",
    `Agent note (${platform}): ${voice}.`,
    `CTA: ${cta}`,
  ];

  return base.join("\n");
}

function scheduleWindow(start: string, index: number) {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return new Date();
  }

  const scheduled = new Date(startDate);
  scheduled.setDate(startDate.getDate() + index * 2);
  const hours = [9, 12, 15, 18][index % 4];
  scheduled.setHours(hours, 0, 0, 0);

  return scheduled;
}

export function draftsFromIdea(
  idea: ContentIdea,
  brand: BrandProfile,
  campaign: Campaign,
  seedIndex = 0,
): ContentDraft[] {
  return idea.formats.map((platform, idx) => {
    const schedule = scheduleWindow(campaign.timeline.start, seedIndex + idx);
    return {
      id: createId(),
      ideaId: idea.id,
      campaignId: campaign.id,
      platform,
      caption: platformCaption(idea, brand, platform),
      hashtags: buildHashtags(brand.hashtags, platform),
      assetBrief: `${idea.recommendedVisual} — adapt for ${platform}`,
      schedule: schedule.toISOString(),
      stage: "drafts",
      createdAt: new Date().toISOString(),
    };
  });
}

export function scoreDraft(draft: ContentDraft) {
  const base = draft.caption.length;
  const emojiBonus = (draft.caption.match(/[\u{1F300}-\u{1FAD0}]/gu) ?? []).length * 40;
  const hashtagBonus = draft.hashtags.length * 25;
  const ctaBonus = draft.caption.includes("CTA:") ? 60 : 0;
  const platformWeight = draft.platform === "LinkedIn" ? 1.05 : 1;

  return Math.round((base + emojiBonus + hashtagBonus + ctaBonus) / 10 * platformWeight);
}
