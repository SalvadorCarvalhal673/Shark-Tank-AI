# Shark Tank AI

Shark Tank AI is a university programming project for practicing startup pitches and investment negotiations.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Choose **Enter the pitch room**, enter your startup details and funding ask, and review the submitted pitch.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
```

The Next.js App Router defines pages in `src/app`. Shared UI is in `src/components`. Pitch validation and money formatting live in `src/features/simulation/pitch.ts` so they can be used independently of the React form.
