# Vantor Capital Markets — UI / UX Reference Brief

> **SUPERSEDED FOR VISUAL DIRECTION. Do not use this document as the
> current Vantor art-direction source of truth. See
> `docs/VANTOR_UI_UX_DIRECTION_V3.md`.**
>
> The art direction below (warm ivory, editorial serif typography,
> restrained editorial compositions, the V1 logo direction) was rejected
> and replaced in the V2 redesign. This file is kept only for historical
> and PRODUCT context — the product principles (financial clarity,
> accessibility, honest data, no fake pricing, no crypto aesthetic,
> marketing/product separation) remain valid.

## Purpose

This document is the design source-of-truth for the upcoming Vantor visual overhaul.

It is intended to be given directly to Claude Code before the overhaul prompt.

The goal is NOT to clone any single company or template.

The goal is to combine the strongest patterns from high-quality financial products and design galleries into an original Vantor visual system.

---

# 1. Core visual direction

Vantor should feel like:

**A modern private-capital-markets platform with the usability of best-in-class fintech software and the visual confidence of a premium financial institution.**

The public marketing site can be expressive and cinematic.

The authenticated product should be restrained, fast, clear, information-dense when necessary, and extremely trustworthy.

## The split

### Marketing side
Allowed to have:
- bold typography
- large visual moments
- animated product demonstrations
- scroll-driven reveals
- subtle parallax
- interactive valuation visuals
- sophisticated motion
- dark/light section contrast
- richer brand expression

### Product side
Should prioritize:
- clarity
- hierarchy
- financial legibility
- fast navigation
- predictable interaction
- dense but clean data presentation
- minimal motion
- excellent responsive behavior

Do not make the logged-in app look like an animated marketing website.

---

# 2. Primary reference products

## Mercury

Official:
https://mercury.com/

UI flow reference:
https://www.saasframe.io/saas/mercury

### What Vantor should learn from Mercury

- Calm financial interface
- Strong whitespace without looking empty
- Clear left-side navigation
- Very readable account / metric hierarchy
- Important number first, supporting information second
- Clean cards without excessive decoration
- Forms that feel approachable instead of bureaucratic
- Financial actions grouped by intent
- Product can support both light and dark presentation without becoming gimmicky
- Professional but still designed for startup founders

### Use Mercury most heavily for

- Founder dashboard structure
- Authenticated app shell
- Form layout
- Metric hierarchy
- Onboarding clarity
- Account/profile/settings flows
- Mobile simplification

### Do NOT copy

- Banking-specific visual metaphors
- Mercury branding
- Exact navigation
- Exact card layouts

---

## Ramp

Official:
https://ramp.com/

### What Vantor should learn from Ramp

- High-density financial information can still feel clean
- Strong use of tables, filters, controls, and charts
- Product UI can expose a lot of data without looking like an old Bloomberg terminal
- Important metrics are immediately scannable
- Strong information architecture
- Clear action hierarchy
- Data visualization is functional rather than decorative
- Product language is concise

### Use Ramp most heavily for

- Investor dashboard
- Marketplace filtering
- Company comparison
- Portfolio tables
- Valuation breakdown tables
- Admin/review surfaces
- Dense desktop layouts

### Do NOT copy

- Expense-management workflow
- Ramp brand colors
- Agent/AI branding
- Exact table design

---

## Carta

Official:
https://carta.com/

### What Vantor should learn from Carta

- Private capital needs to look serious
- Strong institutional tone
- Clear private-market positioning
- Trust and credibility should be embedded in the visual language
- Product language can sound sophisticated without becoming unreadable
- Large ecosystem concepts can still have understandable navigation

### Use Carta most heavily for

- Private-market tone
- Ownership terminology
- Institutional credibility
- Founder/investor trust
- Company profile seriousness
- Future ownership and cap-table surfaces

### Do NOT copy

- Enterprise heaviness
- Dense legal/compliance tone everywhere
- Exact layout or brand identity

---

## Plaid

Official:
https://plaid.com/

Landing page reference:
https://www.lapa.ninja/post/plaid-2/

### What Vantor should learn from Plaid

- A financial company does not need a boring landing page
- Serious finance can coexist with bold creative visuals
- A hero section can have personality while still feeling legitimate
- Motion and illustration can reinforce the product story
- Product concepts can be demonstrated visually instead of explained with paragraphs

### Use Plaid most heavily for

- Public landing-page energy
- Hero section
- Section transitions
- Visual storytelling
- Product demonstrations
- Branded illustration / motion philosophy

### Do NOT copy

- Plaid's exact gradient language
- Financial-network imagery
- Benjamin Franklin imagery
- Their brand personality directly

---

## Revolut

Landing page reference:
https://www.lapa.ninja/post/revolut-4/

### What Vantor should learn from Revolut

- Strong hero hierarchy
- Product-first marketing
- Large confident visual presentation
- Clear navigation between user/product segments
- Consumer finance can feel energetic without becoming unreadable

### Use Revolut carefully for

- Landing-page pacing
- Hero scale
- Product mockup prominence
- CTA hierarchy

### Do NOT copy

- Consumer-bank aesthetic
- Lifestyle-heavy visual identity
- Flashy trading-app energy
- Anything that makes Vantor feel speculative

---

# 3. Design research libraries

These are pattern libraries, not sites to copy.

## Mobbin — Finance Web

https://mobbin.com/explore/web/app-categories/finance

Use for:
- finance dashboard patterns
- filters
- tables
- onboarding
- auth flows
- search
- settings
- mobile behavior
- empty states
- modal patterns

## Mobbin — Finance Mobile

https://mobbin.com/explore/mobile/app-categories/finance

Use when converting desktop Vantor features to mobile.

Do not simply shrink desktop cards.

---

## SaaSFrame

Fintech / landing page index:
https://www.saasframe.io/best-landing-pages

Mercury flow:
https://www.saasframe.io/saas/mercury

Use for:
- complete real-world user flows
- dashboard references
- onboarding patterns
- forms
- navigation
- SaaS interaction patterns

---

## Lapa Ninja — Fintech

https://www.lapa.ninja/category/fintech/

Use for:
- hero sections
- landing-page composition
- CTA placement
- product previews
- trust sections
- visual rhythm

Plaid:
https://www.lapa.ninja/post/plaid-2/

Revolut:
https://www.lapa.ninja/post/revolut-4/

Do not use the gallery as permission to make a generic "fintech template."

---

## Landbook

https://land-book.com/

Use for:
- section composition
- typography ideas
- motion inspiration
- landing-page rhythm

WARNING:
Landbook includes many purchasable templates.

Do not make Vantor look like a purchased Framer/Webflow finance template.

Use individual ideas, not full-template structures.

---

## Recent.design (formerly Godly)

https://recent.design/

Godly currently redirects here.

Use for:
- premium web interface inspiration
- motion
- typography
- editorial layout
- unexpected visual composition
- branding

Use this mostly for the MARKETING side of Vantor.

Do not carry experimental portfolio-site UX into the authenticated financial product.

---

# 4. The Vantor visual formula

Do NOT make Vantor a clone of one company.

Use this approximate conceptual mixture:

### Authenticated product

**35% Mercury**
- calm
- readable
- approachable finance UX

**30% Ramp**
- data density
- filtering
- tables
- analytics

**20% Carta**
- private-market seriousness
- credibility
- institutional tone

**15% original Vantor**
- startup marketplace identity
- valuation system
- verification system
- acquisition/ownership concepts

### Marketing website

**30% Plaid**
- creative financial storytelling

**20% premium Recent.design / Godly-style motion**
- polish
- typography
- section transitions

**20% Carta**
- trust and seriousness

**15% Revolut**
- confident product-first hero presentation

**15% original Vantor**
- valuation / verification / private startup marketplace visuals

These percentages are conceptual only.

Do not literally reproduce existing components.

---

# 5. Anti-vibe-coded rules

Avoid / remove where present:

- generic shadcn-looking cards everywhere
- every container having the same rounded rectangle
- excessive border-radius
- random gradient blobs
- purple/blue AI gradients
- generic sparkles / magic-wand AI icons
- meaningless icon circles
- identical card grids for every section
- oversized whitespace with very little actual information
- generic "Powerful. Simple. Secure." marketing copy
- fake testimonial layouts
- meaningless stats
- giant centered hero with a random dashboard screenshot floating below it
- glassmorphism
- excessive drop shadows
- excessive pills
- excessive badges
- gradients on every CTA
- every section centered
- every heading using identical scale
- fake stock-market ticker visuals
- fake live prices
- crypto/exchange aesthetics
- default-looking logo made from a random Lucide icon
- unnecessary "AI" labels
- animations on every element

Vantor should look intentionally art-directed.

---

# 6. Proposed Vantor brand feel

Keywords:

- institutional
- ambitious
- precise
- private markets
- modern
- analytical
- trustworthy
- founder-friendly
- premium
- serious
- confident

Not:

- playful startup toy
- crypto
- gambling
- consumer-bank clone
- old-school Wall Street
- bland enterprise SaaS
- generic AI app

---

# 7. Color direction

Preferred direction:

## Core neutrals

- deep near-black / ink
- deep navy-black as an alternative dark surface
- warm off-white / ivory
- true white for selected data surfaces
- restrained gray scale

Avoid the common cold `#F8FAFC + slate + indigo` starter-template look.

## Brand accent

Choose ONE primary branded accent.

Recommended directions to explore:

### Option A — Vantor Cobalt
A rich, confident cobalt/electric blue used sparingly.

### Option B — Vantor Signal Green
A sophisticated emerald/green with a brighter signal variant.

### Option C — Vantor Bronze
A restrained warm bronze/gold accent paired with ink/ivory.

Claude/design agent should test these directions before locking one.

## Semantic colors

Reserve:
- green = positive / verified / success
- red = negative / failed / decline
- amber = caution / pending
- neutral/blue = informational

Brand color should not destroy semantic clarity.

---

# 8. Typography direction

Do NOT simply default the entire product to Inter.

## Product UI

Use a highly readable modern grotesk/sans with:

- excellent small-size readability
- strong numeric rendering
- tabular numerals
- clear weight hierarchy
- readable tables

Possible families to evaluate if licensing/implementation permits:

- Instrument Sans
- Geist
- IBM Plex Sans
- Manrope
- similar high-quality grotesk families

Do not install five fonts.

## Marketing

Marketing may pair the product sans with a restrained editorial display/serif for selected major statements IF it improves the identity.

## Numbers

Use:
- tabular numerals where data aligns
- clear decimal hierarchy
- consistent currency formatting
- monospaced/numeric treatment only where it genuinely improves scanning

---

# 9. Logo / identity direction

The current generic logo should be replaced.

Primary brand:

# VANTOR

Full company name:

**Vantor Capital Markets**

Create:

1. Primary VANTOR wordmark
2. Simple standalone V mark
3. Favicon/app icon version
4. Light and dark variants

Explore V-mark concepts based on:

- two sides of a market converging
- capital moving toward opportunity
- ownership / equity blocks
- two geometric planes forming a V
- subtle exchange / connection concept

Explicitly avoid:

- dollar signs
- candlestick charts
- up-only arrows
- coins
- shields
- rockets
- brains
- sparkles
- globes
- chain links
- crypto marks
- random letter inside a circle

The logo should still make sense if Vantor eventually becomes a large financial institution.

---

# 10. Landing page concept

## Hero

Potential structure:

Eyebrow:
**PRIVATE CAPITAL. REBUILT.**

Primary headline direction:
**Discover. Value. Own what's next.**

Supporting copy:
Vantor brings private-company discovery, standardized startup intelligence, valuation, and verification into one platform.

Primary CTA:
**Explore Companies**

Secondary CTA:
**List Your Company**

## Hero visual

Do not use a generic laptop mockup.

Use an animated Vantor company / market composition.

Example fictional company:

**AeroForge**

Defense Technology • Seed

Estimated Private Market Valuation
**$4.2M – $5.1M**

Midpoint
**$4.65M**

Revenue
**$580K**

Growth
**+74%**

Data Verification
**82%**

The hero could transition between:

company card
→ profile
→ valuation breakdown
→ marketplace

---

# 11. Landing page narrative

Recommended order:

1. Hero
2. "Private companies shouldn't be opaque."
3. Marketplace preview
4. Valuation demonstration
5. Verification demonstration
6. Discovery / investor experience
7. Founder experience
8. Long-term ownership story
9. Final CTA

Do not show regulated functionality that is not live.

---

# 12. Motion direction

## Marketing motion — encouraged

Use tasteful motion such as:

- hero card transitions
- valuation range animating into place
- chart/range lines drawing on scroll
- filters smoothly changing results
- product windows moving subtly through depth
- section reveal masks
- typography reveal
- subtle background grid movement
- company cards shifting based on filter selection
- verification states appearing sequentially
- restrained parallax

## Product motion — minimal

Use:

- 150–250ms UI transitions
- subtle menu/dropdown motion
- table/filter transitions
- skeleton/loading states
- restrained card hover behavior

Respect `prefers-reduced-motion`.

---

# 13. Authenticated app shell

Potential core navigation:

- Discover
- Watchlist / Following (when implemented)
- Portfolio (future)
- My Companies / Founder
- Acquisitions (future)
- Notifications
- Account

Do not display disabled future features as a graveyard of empty nav items.

---

# 14. Marketplace redesign

The marketplace should feel like a private-company discovery terminal, not a SaaS card gallery.

Potential result information:

- logo
- company
- industry
- stage
- location
- one-line description
- revenue / ARR if available
- growth if available
- capital raised if available
- valuation if public
- verification if public
- current intent

Do not show 10 empty metrics.

---

# 15. Company profile redesign

This should become one of Vantor's strongest screens.

Prioritize:

- company identity
- status
- top financial metrics
- valuation
- verification
- overview
- financials
- team
- updates
- documents
- future funding/ownership sections only when real

The valuation should feel like a financial research interface, not a colorful dashboard widget.

Verification should feel evidence-based and professional.

---

# 16. Founder dashboard redesign

The founder dashboard should answer:

- What is my company's status?
- What do I need to do next?
- How complete is my profile?
- What information is missing?
- What changed recently?
- What can I improve?

Avoid a dashboard made of six meaningless stat cards.

---

# 17. Onboarding redesign

Use:
- calm, spacious forms
- clear progress
- save state
- contextual helper text
- grouped fields
- financial field formatting
- strong validation
- examples where useful

Do not put 20 inputs on one screen.

---

# 18. Admin UI

Admin should be:

- clear
- dense
- status-driven
- table-forward
- audit-friendly
- intentionally less decorative

Use Ramp-style density more than Mercury-style spaciousness.

---

# 19. Data visualization rules

Good:
- valuation history
- revenue history
- growth history
- valuation methodology comparison
- verification completeness
- portfolio allocation later

Bad:
- random donut chart because there is empty space
- fake stock ticker
- decorative graph with fake data
- animated chart that hides actual values

---

# 20. Responsive rules

For mobile:

- prioritize top 2–4 important metrics
- move secondary data into expandable sections
- use a filter drawer
- simplify tables into structured rows/cards
- keep company actions reachable
- prevent horizontal overflow
- maintain large tap targets

---

# 21. Technical redesign rules

This is a visual / UX overhaul.

Unless a genuine bug requires it, preserve:

- database schema
- migrations
- authentication
- authorization
- valuation engine logic
- verification engine logic
- Railway configuration
- Vercel configuration
- server actions / APIs
- security controls
- existing domain rules

Refactor frontend/component architecture where useful, but avoid unnecessary backend churn.

---

# 22. Claude agent delegation recommendation

Use specialist agents:

## Agent A — Current UI audit
Inventory every screen and identify visual/UX problems.

## Agent B — Brand / design system
Define palette, typography, spacing, borders, radius, shadows, buttons, inputs, tables, cards, data visualization, motion tokens.

## Agent C — Landing page
Build public marketing experience.

## Agent D — Authenticated app shell
Navigation, layout, responsive shell.

## Agent E — Marketplace + company profile
Highest-priority product surfaces.

## Agent F — Founder surfaces
Dashboard + onboarding + company management.

## Agent G — Admin / dense data surfaces
Tables, review queues, controls.

## Agent H — Visual regression / QA
Audit mobile/desktop, accessibility, responsive behavior, broken states, and functionality regressions.

---

# 23. Overhaul acceptance criteria

Do not call the redesign complete until:

- every existing public page has been reviewed
- every existing authenticated page has been reviewed
- the logo is replaced
- favicon/app mark is coherent
- typography is intentional
- a unified design token system exists
- marketplace no longer looks like a generic card template
- company profiles feel like real private-market research pages
- founder onboarding is polished
- founder dashboard is actionable
- auth pages match the brand
- admin is usable and dense
- mobile layouts are intentionally designed
- no major horizontal overflow exists
- motion is restrained and respects reduced motion
- financial data remains readable
- all backend functionality still works
- lint passes
- typecheck passes
- tests pass
- production build passes

---

# 24. Reference hierarchy

## Product UI

1. Mercury — calm usability
2. Ramp — data density
3. Carta — private capital seriousness
4. Vantor originality

## Marketing

1. Vantor product story
2. Plaid — creative financial storytelling
3. Recent.design — premium motion/typography
4. Carta — trust
5. Revolut — confident product presentation

Never optimize for "looking like a cool website" at the expense of making the financial application easy to use.

---

# 25. Final design objective

Someone seeing the landing page should think:

> "This looks like a serious new financial company."

Someone using the application should think:

> "I immediately understand what I'm looking at."

Someone familiar with AI-coded projects should NOT think:

> "This is obviously a shadcn/Next.js template that an AI filled with cards."

Vantor should have its own identity.
