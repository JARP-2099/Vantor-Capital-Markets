# Production Smoke Test

Run this against the real production domain, as a real user, immediately
after deploying and before sending any beta invitation. You need: a browser
(plus a private/incognito window), your admin account already granted
(`docs/DEPLOYMENT.md` §8), and two throwaway email addresses for test
accounts.

Every step lists its expected result. Any deviation: stop, check
`docs/DIAGNOSTICS.md`, fix, and restart the smoke test from step 1.

Cleanup note: this test creates one test company and two test accounts.
After passing, unpublish + archive the test company from `/admin` so beta
users never see it.

## Founder flow

| # | Action | Expected result |
|---|---|---|
| 1 | Open `https://<prod-domain>/signup`; create account **Founder A** (test email 1, 10+ char password) | Lands on the founder dashboard with the "You haven't listed a company yet" empty state |
| 2 | Click **List Your Company**; fill step 1 (name e.g. "Smoke Test Co", city, country, industry, founded year, stage, business model, short description); submit | Advances to **Goals** — the draft now exists; a page refresh or sign-out would preserve it |
| 3 | Goals: pick one posture → continue. Metrics: add one ARR row (value + as-of date) → continue. Story: fill the text areas → continue. Team: fill your title → continue | Each step saves and advances (Goals → Metrics → Story → Team → Review); Review page shows everything entered and a 100% profile checklist |
| 4 | Leave: go to `/founder`, then reopen the company | All entered data still present (drafts persist) |
| 5 | From Review, click **Submit for review** | Redirects to the company overview with "Submitted for review" confirmation; status badge reads **Submitted** |
| 6 | Open the **Profile** tab of the submitted company | "Locked during review" notice; all form fields disabled/read-only |

## Admin flow

| # | Action | Expected result |
|---|---|---|
| 7 | In another browser/window, sign in with your **admin** account; open `/admin` | Review queue shows "Smoke Test Co" under Awaiting review |
| 8 | Open the listing (Review) | Full submitted profile visible: identity, intents, metrics, story, team |
| 9 | Type a revision note (e.g. "Please clarify the ARR as-of date.") and click **Send back to founder** | Status changes to **Draft**; success message; the company leaves the review queue |

## Founder revision

| # | Action | Expected result |
|---|---|---|
| 10 | As Founder A, open the company overview | "Feedback from the review team" panel shows your note verbatim; profile is editable again |
| 11 | Edit something (e.g. short description) in the Profile tab; save | "Company details saved." — the edit sticks |
| 12 | Click **Submit for review** (via the review page) | "Submitted for review" again; profile re-locks |

## Admin approval

| # | Action | Expected result |
|---|---|---|
| 13 | As admin, open the listing; optionally **Start review**; then **Approve & publish** | Status becomes **Published**; founder overview now says the company is live |

## Anonymous / public

| # | Action | Expected result |
|---|---|---|
| 14 | In a **private window** (signed out), open `/companies` | "Smoke Test Co" appears in the marketplace |
| 15 | Click through to its profile | Public profile loads with the entered data; the URL is `/companies/smoke-test-co…`; a "Sign in to save" control shows |

## Investor flow

| # | Action | Expected result |
|---|---|---|
| 16 | In the private window, sign up as **Investor B** (test email 2) | Account created (from a plain `/signup` visit it lands on the founder dashboard — known limitation; from "Sign in to save" → Create an account it returns to the company profile) |
| 17 | Open `/companies`; search for "Smoke" | Results narrow to Smoke Test Co |
| 18 | Apply a filter (e.g. its industry); Apply | Result list respects the filter; clearing restores the full list |
| 19 | Open the company profile | Loads normally for the signed-in user |
| 20 | Click **Save** | Button settles to **Saved** |
| 21 | Open `/watchlist` (header link) | Smoke Test Co listed with its saved date |
| 22 | Sign out | Back to the public site; header shows Sign in |
| 23 | Sign back in as Investor B | Sign-in succeeds |
| 24 | Open `/watchlist` | Smoke Test Co **still there** (persistence across sessions) |
| 25 | Remove it (star/remove control), refresh | Watchlist shows the "No saved companies yet" empty state |

## Authorization

| # | Action | Expected result |
|---|---|---|
| 26 | As Investor B, navigate to `/admin` directly | **404** — not a login page, not the admin UI |
| 27 | As Investor B, open Founder A's edit URL: `/founder/companies/<id>` (copy the id from Founder A's URL in the other window) | **404**; no company data visible |
| 28 | As admin, unpublish Smoke Test Co (with a note). Then in the private window open its public URL | **404** — unpublished/draft listings are not public; it is also gone from `/companies` |

## Demo separation

| # | Action | Expected result |
|---|---|---|
| 29 | Signed out, open `/companies` and scan every listing | **Zero demo companies** (none of: AeroForge, Atlas Robotics, Northstar Energy, Meridian Health AI, Quarry Analytics, Harbor Ledger, Verdant Materials, Helios Grid, Foundry Metrics). Definitive DB check: `psql "<prod-url>" -c "SELECT count(*) FROM companies WHERE is_demo=true AND status='published';"` → hidden from users regardless, but see DEPLOYMENT.md §7 to remove any rows found |

## Wrap-up

- Archive the smoke-test company from `/admin` (or re-approve it if you
  want a live example listing — then rename it to something real-looking).
- Check Vercel → Logs for any errors emitted during the test.
- If every step matched: production is verified. Send the invitations.
