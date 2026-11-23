# University demonstration script

Issues #78, #85, #86 and #87. Target length: **five minutes**. Every figure below was computed with the engine helpers on this checkpoint, and is checked in the browser by `tests/demo-browser.spec.ts`. The automated run takes about 5 seconds. **A spoken rehearsal with the group is still needed.**

## Setup (before the session)

```sh
npm ci
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`. No network, API key or GPU is needed for the main demo. The practice is plain HTML, so it is also the fallback.

## Script

| Time | Do | Say | Check on screen |
| --- | --- | --- | --- |
| 0:00 | Landing page → **Pitch room** | "Founders practise pitching to three fictional investors and learn how equity changes." | |
| 0:30 | **Use LunchLoop · reusable containers** → **Review pitch** | "Ask: €100,000 for 10%. The founder owns 60% before the round; others own 40%." | Fictional data label is visible |
| 1:00 | **Skip introductions** → **Start practice** | "Each investor asks one question." | Question 1 of 3, Maya Chen |
| 1:15 | Paste the three sample answers from `tests/browser-fixtures.ts`, submitting each | "The rules detect signals in the text. They do not verify facts." | Dialogue history grows |
| 2:15 | Read the **Opening decisions** reveal | "Three competing offers." | Maya €100,000.00 for 13%; Adrian €90,000.00 for 15%; Sofia €80,000.00 for 12% |
| 2:45 | Maya → **Make a counteroffer** → equity **11** → **Send counteroffer** | "Every counter uses one of three shared rounds." | "2 shared counters remaining"; Maya agrees at €100,000.00 for 11% |
| 3:30 | **Accept offer** → **Confirm deal** | "Nothing is final until I confirm the exact offer." | Debrief |
| 3:50 | Debrief and scorecard | "Founder 60% → 53.4%. Post-money €909,090.91, pre-money €809,090.91." | Values as stated |
| 4:30 | Optional: `/prototype/studio` (development server only) | "The same rules drive a 3D studio. It is optional; the HTML controls are complete without it." | |

Verified values (engine, revision 5):
- **Accepted:** Maya, 10,000,000 cents for 1,100 bp.
- **Valuation:** pre-money 80,909,091 cents, post-money 90,909,091 cents.
- **Ownership after:** founder 5,340 bp, other holders 3,560 bp, Maya 1,100 bp.

## Honest disclosures to say out loud

- The investors are scripted rules. The optional AI investor voice is disabled in the production build, and live AI is not active.
- Founder answers are not verified.
- The 3D studio is a development prototype, measured on a software renderer and not yet on phones.

## Fallback (#87)

| Problem | Do |
| --- | --- |
| No network | Nothing changes: the demo runs entirely from the local build |
| GPU or 3D fails | Skip the studio, or use **Use simplified view**. The session and drafts are kept |
| Laptop fails | Run the same commands on a second laptop prepared in advance. The numbers above are deterministic |
| Projector issues | Show these screenshots: `docs/design/application.png` and the studio images in `docs/design/` |

## Presentation outline (#85)

The slide deck is a Claude Slides deck: "Shark Tank AI — Final Presentation" (https://claude.ai/artifact/2ipHPyXYSJUknWEpgFDEAz), 12 slides with speaker notes. It is private until the owner shares it, and it can be exported to PowerPoint or PDF. Before presenting, fill the `[Member …]` placeholders, the course details and the final test counts.


1. **Course objective.** An interactive simulation that teaches valuation and dilution.
2. **Architecture.** Next.js; a deterministic negotiation engine; integer cents and basis points with BigInt rounding; optional local saving; a 3D studio as a view adapter; an optional AI layer that can never change money.
3. **Interactivity.** Questions, competing offers, counters, explicit acceptance, four outcomes, scorecard, history and replay challenges.
4. **Financial learning.** Show the pre-money/post-money identity and the founder's dilution.
5. **Team process.** Issues, feature branches, pull requests into `develop`, and CI with unit and browser tests.
6. **Limitations.** No live AI. Not measured on physical devices, with a spoken screen reader or with real users. Public deployment is not approved.
