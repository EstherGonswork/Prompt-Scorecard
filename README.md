# Prompt Scorecard

Paste a prompt and see how well it covers four inputs: Clarity, Context, Creativity and Constraints. You get a score out of 10 for each, one fix per gap, and an improved prompt to work from.

The site is fully static. It has no server, no database and no running cost.

## Two ways to score

| Method | Cost | Where it runs | What it needs |
| --- | --- | --- | --- |
| Quick check | Free | In the visitor's browser | Nothing |
| AI review | Visitor's own API usage | Browser to api.anthropic.com | The visitor's Anthropic API key |

Quick check is the default. It looks for named signals such as an audience, a purpose, a tone, a length and a list of things to avoid. Each signal earns points. The same prompt always gets the same score.

AI review sends the same rubric to Claude and returns scores with reasons. It reads meaning, so it catches things the rules miss. The visitor pays Anthropic directly for it, and the site owner pays nothing.

## Where the rules live

| File | What it controls |
| --- | --- |
| `data/rubric.ts` | The four inputs, the score guide and the bands. Used by both methods. |
| `data/quickRules.ts` | Every signal, its points, its keywords and the line it adds to the improved prompt. |
| `data/ai.ts` | The API address, the model list and the error messages. |
| `data/copy.ts` | Page text. |
| `data/samples.ts` | The three sample prompts. |

To change how Quick check scores, edit `data/quickRules.ts`. No interface code changes. A test checks that each input offers exactly 10 points.

## Key safety

- The key is typed into a password field and held in memory.
- "Remember on this device" is off by default. When ticked, the key is saved in this browser's local storage. "Forget key" removes it.
- The key goes only to `https://api.anthropic.com/v1/messages`. The site loads no analytics and no third-party scripts. Google Fonts is the only other host.
- The page shows a reminder to use a key with a low spend limit.
- Never commit a key. This project has no environment file because it needs none.

## Light and dark mode

A round button in the top right corner switches the theme.

- With no saved choice, the page follows the device setting.
- A tap saves the choice in this browser's local storage under `prompt-scorecard.theme`. If storage is blocked, the switch still works until the page closes.
- A small script in the page head sets the saved theme before the first paint, so a returning visitor sees no flash of the other theme.
- Light mode swaps colour values only. The tokens sit at the top of `app/globals.css`, with the light set under `data-theme="light"` and under the light device setting.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 56 tests
npm run typecheck
```

## Publish on Vercel (free tier)

1. Push this folder to a repository.
2. In Vercel select Add New, then Project, and import the repository.
3. Keep the defaults and deploy. Vercel detects Next.js and serves the static export.

## Publish on GitHub Pages (free)

The file `.github/workflows/pages.yml` builds and publishes the site every time you push to `main`. It reads the repository name and sets the base path itself, so any repository name works.

1. Upload the project files to a new repository (drag the unzipped folder contents into the upload page).
2. Open Settings, then Pages. Under Build and deployment, set Source to GitHub Actions.
3. Open the Actions tab and wait for the run to finish. The site address appears in the deploy step and on the Pages settings screen.

A site at the root of its own domain needs no base path. Run `npm run build` locally instead.

## How it was built

- Next.js 15 App Router with `output: 'export'`, React 19 and TypeScript.
- Rules sit in data files. The engine in `lib/quickCheck.ts` reads them and holds no keywords.
- Text in [square brackets] is ignored when scoring, so the unfilled lines in an improved prompt earn nothing until the writer fills them in.
- AI review forces a tool call, so Claude must reply with a fixed shape. The page rounds and clamps every score and works out the total and band itself.
- The prompt under review is wrapped in tags and the reviewer is told to treat it as material to read, not instructions to follow.
- Tests cover the rules, the AI request and its error handling (with a mock fetch), key storage and score cleanup.

## Ideas for next steps

- Add a second rubric for image prompts or for code prompts, and let the visitor switch.
- Save past scores in the browser to show progress over time.
- Add a share link that carries the prompt in the address.
- Add a word-level highlight showing which phrase earned which signal.
