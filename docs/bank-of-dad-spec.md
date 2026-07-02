# Bank of Dad — Codex Project Spec

## Project Summary

Build a simple private Astro web app called **Bank of Dad** at `bod.billerickson.net`.

The app is a family-only chore/spending ledger. It does not move real money. Parents manually add transactions when kids “save” money from chores or “spend” money on store purchases. The app should feel polished enough to install as a PWA / home-screen app on phones, but remain simple, durable, and easy to maintain.

This repo should be safe to make public and reusable by other families. Do **not** hardcode Bill’s kids, a default password, or private family data into the application. The first time the site loads against an empty database, it should walk the parent through a simple onboarding flow to set the shared parent password and add one or more kids.

## Deployment / Ownership

- Framework: **Astro**
- Hosting: **Cloudflare**, matching my recent project workflow
- Repo: **GitHub**
- Domain: `bod.billerickson.net`
- Indexing: app must be **noindex**
- Auth: simple password gate before app access
- First-run onboarding: parent creates the password and adds kids
- Public repo requirement: no hardcoded real kids/passwords/secrets in committed code
- Primary users for Bill’s instance: Bill and Tara on mobile phones
- Example kids for mockups/docs only: Reagan and Ada
- App install target: PWA / saved-to-home-screen experience

## Product Requirements

### Core Screens

#### 0. First-Run Onboarding Screen

Purpose: make the app reusable from a public repo without hardcoded family data.

Show this flow only when the app has not been initialized yet. An app is uninitialized when the backend store has no app/settings record and no parent password hash.

Requirements:
- Show app name/logo and a short explanation: “Set up your family bank.”
- Step 1: create the shared parent password.
  - Password field.
  - Confirm password field.
  - Basic validation: not empty, confirmation matches
- Step 2: add kids.
  - Let the parent add one or more kids by name.
  - Include an “Add another kid” control.
  - Require at least one kid before finishing onboarding.
  - Optional starting balance per kid is allowed, but not required. If included, starting balances should be recorded as explicit starting-balance transactions rather than invisible state.
- Finish onboarding by:
  - Storing a password hash/server-side secret representation, never the plain password.
  - Creating kid records from the entered names.
  - Creating optional starting balance transactions if the UI supports starting balances.
  - Marking the app as initialized.
  - Starting a logged-in session and sending the parent to the home screen.
- Onboarding must not be accessible after setup unless Codex intentionally adds a protected reset/admin mechanism. Do not add a destructive reset UI unless explicitly requested later.
- Include `noindex` protections on onboarding pages too.

Implementation notes:
- Do not seed Reagan/Ada automatically in production app code.
- Brand-guide mockups may use Reagan and Ada as sample names, but app setup should collect names dynamically.
- Since this app may be deployed by other people, README should explain first-run setup clearly.

#### 1. Login Screen

Purpose: keep the app private with a simple shared password.

Requirements:
- Show app name/logo.
- Single password field.
- Submit button.
- Friendly error state for incorrect password.
- Persist session locally after successful login so parents do not need to re-enter constantly.
- Include `noindex` protections.

Implementation notes:
- This is not bank-grade auth. It is a family utility.
- Use a simple Cloudflare-compatible password strategy.
- Do not expose sensitive secrets in client code.
- Prefer Cloudflare Worker/server-side validation or Cloudflare Pages Functions if needed.
- If using middleware or server routes, document the chosen approach.

#### 2. Home / Kids List Screen

Purpose: quick dashboard showing each child’s current balance.

Requirements:
- Show all configured kids as tappable cards.
- For Bill’s mockups/docs, Reagan and Ada may be used as example kids.
- Each card shows:
  - Kid name
  - Current balance
  - Optional visual accent/avatar/icon
- Tapping a kid opens their account screen.
- Mobile-first layout.

#### 3. Kid Account Screen

Purpose: view a single child’s balance and transaction history.

Requirements:
- Show kid name and current balance prominently at the top.
- Show two primary actions:
  - **Save** — adds to balance
  - **Spend** — subtracts from balance
- Show transaction list with:
  - Date
  - Description
  - Amount
  - Running total after transaction
- Most recent transactions should appear first.
- Include navigation back to the home screen.

#### 4. Transaction Screen / Modal

Purpose: add a Save or Spend transaction.

Requirements:
- Triggered by tapping Save or Spend from the kid account screen.
- Can be a dedicated route or modal/sheet, but should work well on mobile.
- Fields:
  - Amount
  - Description
- Date can default to today.
- Transaction type comes from the button clicked: Save or Spend.
- Submit creates transaction and updates balance.
- Cancel/back returns without saving.
- Validate amount is positive.
- Display spend amounts as negative in history.

#### 5. Settings / Mobile Menu

Purpose: keep secondary/admin actions available without distracting from the core kid balance flow.

Requirements:
- Add a small mobile-friendly menu or settings page accessible from the main app shell.
- This area should include the **Apply Monthly Interest** action.
- The interest action should not be a primary call-to-action on the home or kid account screens.
- Settings can be minimal for v1, but should be structured so future parent/admin tools can live there.

#### 6. Apply Monthly Interest

Purpose: reward kids with monthly “Bank of Dad” interest while keeping the ledger auditable.

Requirements:
- Add an **Apply Monthly Interest** button in the settings page or mobile menu.
- Default interest rate: **1% monthly**.
- Interest should apply to each kid independently.
- Interest is based on the kid’s final positive balance for each completed month.
- Do not apply interest for the current in-progress month.
- Do not apply interest for any month where the kid’s final balance was `$0.00` or negative.
- Do not apply interest twice for the same kid/month.
- If the parent forgets to apply interest for several months, clicking the button should automatically catch up and apply interest for every completed month that:
  - had a positive ending balance, and
  - has not already received a monthly interest transaction.
- Backdate each interest transaction to the **first day of the following month**, representing interest earned from the prior month’s ending balance.
  - Example: June interest is calculated from the final balance on June 30 and recorded with a transaction date of July 1.
- Store interest as an explicit transaction in the ledger, not as invisible balance state.
- Interest transaction description should be clear, for example: `Monthly interest for June 2026`.
- Interest transaction type should be distinct from normal Save/Spend transactions, for example `interest`.
- Interest amount should be rounded to the nearest cent.
- After applying interest, show a simple confirmation summary, such as “Applied 5 interest transactions totaling $3.42.”
- If there is no interest to apply, show a friendly “You’re all caught up” message.

Implementation notes:
- Codex should implement the interest calculation server-side so it uses the shared source of truth.
- The catch-up operation should be idempotent. Running it repeatedly should not create duplicates.
- Prefer a uniqueness rule/index or explicit guard like `(kidId, interestForMonth)` for interest transactions.
- If using D1, consider storing `interestForMonth` as `YYYY-MM` on interest transactions and enforcing uniqueness per kid/month where practical.
- The UI may optionally preview pending interest before applying, but this is not required for v1.

## Data Model

Keep this intentionally simple.

Suggested entities:

```ts
type KidId = string;

type AppSettings = {
  id: 'default';
  initialized: boolean;
  passwordHash: string; // server-side only / never exposed to client
  monthlyInterestRate: number; // default 0.01 for 1% monthly
  createdAt: string;
  updatedAt: string;
};

type Kid = {
  id: KidId;
  name: string;
  sortOrder: number;
  createdAt: string;
  archivedAt?: string | null;
};

type TransactionType = 'save' | 'spend' | 'interest';

type Transaction = {
  id: string;
  kidId: KidId;
  type: TransactionType;
  date: string; // ISO date or ISO datetime
  description: string;
  amount: number; // positive stored amount; display sign based on type
  balanceAfter: number;
  interestForMonth?: string | null; // YYYY-MM for monthly interest transactions only
  createdAt: string;
};
```

Questions Codex should resolve during implementation:
- Best Cloudflare-native storage option for this tiny app.
- Prefer a durable backend store over local-only storage because Bill and Tara need to see the same balances from two phones.
- Good options include Cloudflare D1, KV, or another Cloudflare-supported store.
- Pick the simplest reliable option and document the decision.

Important:
- The app must not rely only on localStorage because two devices need to share one source of truth.
- Transactions are the source of truth; balances can be computed or stored with each transaction, but transaction history should remain clear and auditable.

## Security / Privacy Requirements

- Make the repo safe to publish publicly.
- Do not hardcode Bill’s real kids, password, secrets, or private data in committed app code.
- Password is created during first-run onboarding and stored securely as a hash/server-side representation.
- Add `noindex` meta tags to all app pages.
- Add `X-Robots-Tag: noindex, nofollow` headers if practical in Cloudflare config.
- Require password before showing any data.
- Keep server/session secrets in Cloudflare environment variables or another non-committed secret location. The parent password itself should be created during onboarding and stored only as a hash/server-side representation.
- Do not commit real secrets.
- Add `.env.example` with placeholder values.
- Make clear in README that this is a family utility, not a real financial/banking app.

## PWA Requirements

- App should be installable / save nicely to a phone home screen.
- Include manifest with:
  - Name: Bank of Dad
  - Short name: BOD
  - Appropriate theme/background colors from selected brand guide
  - Icons generated from selected logo
- Include mobile-friendly viewport and safe-area handling.
- Consider offline shell support if easy, but do not create confusing stale transaction states.
- If offline transaction entry is not supported, make that clear in code/README.

## Design / UX Requirements

- Mobile-first.
- Fast to open and tap with one hand.
- Large, friendly buttons.
- Balances should be immediately scannable.
- Transaction entry should be frictionless.
- Should feel trustworthy enough for money tracking but playful enough for kids/family.
- Use accessible color contrast.
- Use semantic HTML where possible.

## Brand Guide Deliverables

Step 1 is **not** building the app. Step 1 is creating three complete brand guide options for Bill to choose from.

Each brand guide option should include:

1. Brand concept
   - Name lockup direction
   - Personality
   - Visual metaphor
   - Where it fits the product

2. Logo system
   - Primary logo concept
   - App icon concept
   - Simple SVG/logo assets if practical
   - Notes on logo usage

3. Color palette
   - Primary colors
   - Supporting colors
   - Background/surface colors
   - Positive/save color
   - Negative/spend color
   - Text colors
   - All colors listed as HEX values

4. Typography
   - Display font
   - Body/UI font
   - Font source or fallback strategy
   - Usage notes

5. Iconography
   - Style direction
   - Suggested icons for:
     - Home
     - Kid/account
     - Save
     - Spend
     - Transaction/history
     - Lock/login

6. UI component language
   - Cards
   - Buttons
   - Inputs
   - Transaction rows
   - Balance display
   - Empty states
   - Error states

7. Mockups of key screens
   - First-run onboarding screen
   - Login screen
   - Home screen listing Reagan and Ada with balances as sample/mock data
   - Account screen for a single kid
   - Transaction screen/modal for Save and Spend

8. Implementation notes
   - CSS variables
   - Any SVG/icon assets
   - Responsive behavior
   - Accessibility notes

### Required Brand Guide Options

#### Option A — Buddy Blocks Inspired

Create a brand option similar in spirit to Buddy Blocks: colorful, tactile, rounded, playful, kid-friendly, modular/blocky, and optimistic.

Buddy Blocks reference details:
- Brand story: “A tactile, build-it-up world where lessons are colorful blocks and every correct answer snaps another piece into place.”
- Personality: playful, tactile, confident.
- Visual cues: blocks, snaps, tabs, tiles, sticker badges.
- Palette includes bright magenta, teal, yellow, blue, orange, dark ink, and soft wash backgrounds.
- Typography uses Fredoka for display and Nunito for body.

For Bank of Dad, adapt this style without copying it exactly. It should feel like a sibling project, not a clone.

Possible direction:
- Piggy-bank blocks
- Coin tiles
- Allowance badges
- Chunky balance cards
- Friendly kid avatars

#### Option B — Traditional Banking / Bitcoin Wallet Inspired

Create a brand option that feels more like a traditional bank, wallet, or bitcoin wallet.

Direction:
- More restrained and trustworthy.
- Ledger/account feel.
- Dark/navy/green/gold or bitcoin-inspired accents.
- Crisp numeric typography.
- Subtle security/trust cues.
- App icon could combine a bank vault, wallet, coin, key, or “BOD” monogram.

It should still be simple and family-friendly, not corporate or intimidating.

#### Option C — Codex Choice / Different Direction

Create one distinct third direction. Codex can choose the concept, but it must differ meaningfully from both playful blocks and traditional wallet/banking.

Possible directions:
- Family chore arcade
- Field notebook / family ledger
- Retro receipt book
- Scout badge / merit system
- Tiny general store
- Allowance adventure map

Codex should pick one and explain why.

## Build Requirements After Brand Selection

After Bill selects one brand guide, Codex should build the app using that guide.

### Implementation Requirements

- Create Astro app if repo is empty.
- Configure Cloudflare deployment.
- Add README with setup, local dev, env vars, deployment, and data storage explanation.
- Add `.env.example`.
- Add noindex tags/headers.
- Add first-run onboarding.
- Add password gate.
- Add shared persistent storage.
- Add PWA manifest/icons.
- Implement screens and flows.
- Use selected brand’s colors, typography, icons, and component language.
- Keep code small and readable.
- Avoid overengineering.

### Suggested Routes

Codex may adjust if there is a better Astro structure.

```txt
/onboarding        first-run setup, only when uninitialized
/login
/                  home dashboard
/kids/[kidId]      account screen
/kids/[kidId]/new?type=save|spend transaction form
/settings          secondary parent actions, including Apply Monthly Interest
```

or use modal UI while preserving shareable/simple navigation if practical.

### Initial Seed Data

Do not seed real kids by default in production app code.

First-run onboarding should create the initial kid records. For Bill’s own deployed instance, he will add:
- Reagan
- Ada

Starting balances:
- If no starting balances are specified during onboarding, start each kid at `$0.00`.
- If starting balances are supported, store them as explicit starting-balance transactions.
- Include a simple documented way to add starting transactions later.

### Transaction Behavior

For Save:
- Amount increases balance.
- Display positive amount.

For Spend:
- Amount decreases balance.
- Store type as `spend`; display as negative.

For Monthly Interest:
- Amount increases balance.
- Store type as `interest`; display as positive.
- Calculate from each kid’s final positive balance for each completed month that has not already received interest.
- Backdate the transaction to the first day of the following month.
- Never duplicate interest for the same kid/month.

Transaction list:
- Show most recent first.
- Show running balance after each transaction.
- Format currency consistently.
- Date should be readable on mobile.

### Error Handling

- Wrong password.
- Missing/invalid kid ID.
- Invalid transaction amount.
- Empty description if Codex decides description should be required.
- Storage/API errors.

### Testing / QA

Before final commit, Codex should verify:
- Login works.
- First-run onboarding can create a password and at least one kid.
- Login works after onboarding.
- Home shows configured kids.
- Save transaction increases balance.
- Spend transaction decreases balance.
- Apply Monthly Interest is available from settings/mobile menu, not as a main-screen CTA.
- Monthly interest applies missing completed months, backdates transactions to the first day of the following month, and does not create duplicates when run repeatedly.
- Transaction history shows date, description, signed amount, and balance after transaction.
- Refresh keeps data.
- Separate device/browser can see same data once deployed.
- Noindex tags are present.
- PWA manifest is valid enough to save to home screen.
- Mobile layout works.

### Git Workflow

Codex should commit along the way with small, clear commits.

Suggested commit sequence:
1. Scaffold Astro/Cloudflare project.
2. Add selected brand system and base layout.
3. Add first-run onboarding, password gate/noindex/PWA shell.
4. Add data storage layer and dynamic kid setup.
5. Add dashboard/account screens.
6. Add transaction creation flow.
7. Add QA fixes, README, and deployment notes.

### Cloudflare Deployment

Codex should:
- Configure Cloudflare project files needed for deployment.
- Use environment variables for secrets.
- Document any manual Cloudflare steps Bill must do.
- Deploy when ready if authorized and credentials are already available.
- Do not commit credentials.

## Prompt 1 — Generate Brand Guide Options

Use this as the first Codex prompt.

```md
/goal Create three complete brand guide options for the new Astro app “Bank of Dad,” using the project spec in `docs/bank-of-dad-spec.md` as the source of truth.

Do not build the app yet. This task is only brand exploration.

Deliverables:
1. Create `docs/brand-guides/option-a-buddy-blocks-inspired.md`
2. Create `docs/brand-guides/option-b-wallet-bank.md`
3. Create `docs/brand-guides/option-c-codex-choice.md`
4. Create `docs/brand-guides/index.md` that compares the three options and recommends when to choose each.
5. Include mockups for these screens in each option:
   - First-run onboarding
   - Login
   - Home dashboard listing Reagan and Ada with balances as sample data
   - Kid account screen
   - Save/Spend transaction screen or modal
6. Include logo direction, app icon direction, colors with HEX values, typography, icons, component language, accessibility notes, and implementation notes.
7. If practical, add simple SVG logo/icon concepts under `public/brand/options/` or inline in the docs.

Required directions:
- Option A should feel like a sibling to Buddy Blocks: colorful, tactile, rounded, playful, modular/blocky, optimistic, and kid-friendly. Use the Buddy Blocks reference in the spec, but do not clone it.
- Option B should feel like a traditional banking, wallet, or bitcoin wallet app: trustworthy, restrained, ledger-like, secure, and clean.
- Option C should be a meaningfully different direction of your choosing. Explain the concept and why it fits.

Commit your changes when complete with a message like:
`Add Bank of Dad brand guide options`

Stop after the brand guide options are complete so I can review and choose one.
```

## Prompt 2 — Build App From Selected Brand Guide

Use this after selecting one brand guide. Replace `[SELECTED_OPTION]` with the chosen option, for example `Option A — Buddy Blocks Inspired`.

```md
/goal Build the Bank of Dad Astro app using `[SELECTED_OPTION]` from `docs/brand-guides/` as the selected visual direction and `docs/bank-of-dad-spec.md` as the product spec.

Build the full app, commit changes along the way, and prepare it for Cloudflare deployment at `bod.billerickson.net`.

Core requirements:
- Astro app running on Cloudflare.
- First-run onboarding that lets the parent create the shared password and add kids.
- Private password-gated access after onboarding.
- Noindex everywhere, including meta tags and headers if practical.
- Shared persistent storage suitable for two phones/devices, not localStorage-only.
- Home screen listing configured kids with current balances.
- Kid account screen showing balance, Save and Spend buttons, and transaction history.
- Save flow that records amount + description and increases balance.
- Spend flow that records amount + description and decreases balance.
- Settings or mobile-menu area with an Apply Monthly Interest button.
- Monthly interest flow that applies 1% interest for all completed months with positive ending balances that have not already received interest, backdated to the first day of the following month, with duplicate protection.
- Transaction rows must show date, description, signed amount, and running balance after transaction.
- PWA manifest and icons based on the selected brand guide.
- Mobile-first UI using the selected brand colors, typography, icon style, and component language.
- README with local setup, env vars, storage decision, deployment notes, and any manual Cloudflare steps.
- `.env.example` with placeholder values only.

Implementation guidance:
- Keep the app simple and maintainable.
- Pick the simplest Cloudflare-native shared storage option that fits this small ledger app, such as D1 or KV, and document why.
- Do not commit real secrets or credentials.
- Use transactions as the audit trail/source of truth.
- Do not hardcode or auto-seed Reagan/Ada in production code.
- Use first-run onboarding to create kid records.
- For Bill’s deployed instance, onboarding will be used to add Reagan and Ada.
- Start kids at `$0.00` if no starting balances are provided.
- Include a simple documented way to add starting balances as transactions later.

Suggested commit sequence:
1. Scaffold Astro/Cloudflare project.
2. Add selected brand system, global styles, layout, icons, and PWA basics.
3. Add first-run onboarding, password gate, and noindex protections.
4. Add Cloudflare-compatible storage layer and dynamic kid setup.
5. Add dashboard and account screens.
6. Add Save/Spend transaction creation flow.
7. Add settings/mobile menu and Apply Monthly Interest catch-up flow.
8. Add QA fixes, README, and deployment notes.

Before finalizing, run available checks and manually verify:
- Fresh empty storage shows onboarding.
- Onboarding creates parent password and kids.
- Login works after onboarding.
- Wrong password shows an error.
- Home shows configured kids.
- Save increases balance.
- Spend decreases balance.
- Apply Monthly Interest creates the correct interest transactions for missed completed months and is idempotent.
- Refresh preserves data.
- Transaction history is correct.
- Noindex tags/headers are present.
- PWA manifest exists.
- Mobile layout is usable.

When complete:
- Commit all changes.
- If Cloudflare credentials/config are available and deployment is safe, deploy it.
- If anything requires manual Cloudflare setup, list the exact steps clearly in the README and in your final response.
```
