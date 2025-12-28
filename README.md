## Orbit Control — Social Media Content Manager Agent

Orbit Control is an agentic workspace that helps marketing teams and solo creators align brand voice, campaign strategy, platform-ready drafts, and publishing cadence from one interface.

### Features

- **Brand System:** Capture mission, tone, core messaging pillars, signature hashtags, and CTA so every asset stays on voice.
- **Campaign Control Centre:** Switch between active campaigns, refine offers/audience/timeline, and manage channel mix.
- **Idea Intelligence:** Generate multi-platform content angles tailored to the current brief and instantly spin each angle into platform drafts.
- **Pipeline Orchestration:** Visualise drafts in `Draft → Scheduled → Published` columns, tweak schedules, and progress posts with one click.
- **Schedule Radar:** Review upcoming drops, spot gaps, and trace the idea origin for each scheduled asset.
- **Agent Activity Feed:** Every automated move is logged for transparency and quick catchup.
- **Plan Export:** Copy the full brand/campaign/idea/draft plan as JSON directly to your clipboard.

All data is synced to browser `localStorage` so you can refresh without losing context.

### Tech Stack

- Next.js App Router (TypeScript)
- Tailwind CSS (with Geist fonts)
- Local storage persistence for agent state

### Local Development

```bash
yarn install
yarn dev
```

Visit `http://localhost:3000` to explore the agent workspace.

### Production Build

```bash
yarn build
yarn start
```

### Environment

No environment variables are required. Clipboard export requires the browser to grant clipboard permissions.

### Deployment

Deploy directly to Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-26a839da
```

Once live, confirm the deployment with:

```bash
curl https://agentic-26a839da.vercel.app
```
