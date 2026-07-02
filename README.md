# Bank of Dad

Bank of Dad is a private family ledger for tracking kid balances. It does
not move real money. Parents manually record money saved from chores,
allowance, gifts, or other deposits, and money spent on purchases. The app is
designed to work well as a small phone-first PWA shared by two parents.

![screenshot](https://p198.p4.n0.cdn.zight.com/items/KoubL2PB/0cebc218-3d8d-40bf-afe8-6fe896d5ac94.jpg?source=viewer&v=493b7e453a76dc45168cf7447e0b1da2)

## What It Does

- Runs a first-run onboarding flow against an empty database.
- Lets the parent create one shared password.
- Lets the parent add one or more kids during onboarding.
- Password-gates all private app screens after onboarding.
- Lists configured kids and current balances on the home screen.
- Shows each kid's account balance and transaction history.
- Records Save transactions that increase balance.
- Records Spend transactions that decrease balance.
- Shows date, description, signed amount, and running balance for each row.
- Applies catch-up monthly interest from Settings.
- Stores all data in Cloudflare D1 so multiple devices share one ledger.
- Includes noindex protections and PWA metadata.

This is a family utility, not bank-grade authentication or a financial
product.

## How It Works

### Storage

Bank of Dad uses **Cloudflare D1** for persistent shared storage. D1 is a good
fit because the app is an auditable ledger:

- kids have many transactions
- transactions are the source of truth
- balances can be recalculated from transaction history
- monthly interest needs duplicate protection per kid/month

The schema is in `migrations/0001_schema.sql` and creates three tables:

- `app_settings` - initialization state, password hash, and interest rate
- `kids` - kid records created during onboarding
- `transactions` - save, spend, and interest ledger rows

Interest rows use a unique partial index on `(kid_id, interest_for_month)` so
the same monthly interest cannot be applied twice for the same kid.

### Authentication

The first-run onboarding flow stores a hash of the shared parent password.
The app validates that password server-side and stores an HttpOnly signed
session cookie. The plain password is never stored in the repo or database.

### Balances

Transactions are the audit trail. Save and interest transactions add to the
balance; spend transactions subtract from it. Transaction rows store the
running `balance_after_cents` value so history is easy to display and audit.

### Monthly Interest

The Settings page includes **Apply Monthly Interest**. It applies 1% monthly
interest for each completed month where a kid had a positive ending balance.
It skips the current month, backdates each interest transaction to the first
day of the following month, and is idempotent.

Example: June interest is calculated from the final June 30 balance and
recorded on July 1.

### Privacy

The app is meant to be private by URL and password gate. It also includes:

- `<meta name="robots" content="noindex, nofollow">`
- `X-Robots-Tag: noindex, nofollow`
- `Cache-Control: no-store` on app HTML routes
- no real family data committed to source

## Tech Stack

- Astro with server rendering
- `@astrojs/cloudflare`
- Cloudflare Workers
- Cloudflare D1
- Wrangler
- Web Crypto PBKDF2 password hashing
- Self-hosted IBM Plex fonts via `@fontsource`

## Project Structure

```text
src/
  components/         Brand mark and inline SVG icons
  layouts/            App layout, PWA tags, cache-busted stylesheet link
  lib/                Auth, D1 helpers, formatting, interest calculation
  middleware.ts       Noindex, cache, origin checks, and route gating
  pages/              Onboarding, login, dashboard, kids, settings
  styles/             Vault Ledger CSS system
migrations/           D1 schema
public/               PWA manifest, icons, static headers, brand assets
docs/                 Product spec and brand guide explorations
```

## Local Installation

Install dependencies:

```sh
npm install
```

Create local secrets:

```sh
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set a long random value:

```sh
SESSION_SECRET="replace-with-a-long-random-local-secret"
```

Apply the D1 schema to the local Miniflare database:

```sh
npm run db:migrate:local
```

Start the local app:

```sh
npm run dev
```

Open the local URL printed by Astro. With an empty local D1 database, the app
redirects to onboarding.

## First-Run Setup

On first load, onboarding asks for:

- a shared parent password
- one or more kid names

Kids start at `$0.00`. To add a starting balance later, open the kid account
and create a Save transaction with a description like `Starting balance`.
This keeps the ledger auditable.

The production app does not hardcode or auto-seed Reagan, Ada, or any other
kid. Bill's deployed instance should add Reagan and Ada through onboarding.

## Development Commands

```sh
npm run dev              # generate Wrangler types and start Astro dev
npm run build            # Wrangler types, Astro check, Astro build
npm run preview          # Wrangler types and Astro preview
npm run deploy           # build and deploy with Wrangler
npm run db:migrate:local # apply D1 schema locally
npm run db:migrate:remote # apply D1 schema to remote Cloudflare D1
```

## Cloudflare Deployment

The checked-in Wrangler config targets Bill's deployment:

- Worker: `bank-of-dad`
- Custom domain: `bod.billerickson.net`
- D1 binding: `DB`
- D1 database name: `bank-of-dad`

For a new installation, create a fresh D1 database and update
`wrangler.jsonc` before deploying.

1. Sign in to Cloudflare:

```sh
npx wrangler login
```

2. Create a D1 database:

```sh
npx wrangler d1 create bank-of-dad
```

3. Copy the returned `database_id` into `wrangler.jsonc`.

4. Set the production session secret:

```sh
npx wrangler secret put SESSION_SECRET
```

5. Apply the remote schema:

```sh
npm run db:migrate:remote
```

6. Deploy:

```sh
npm run deploy
```

7. Confirm the custom domain is active in Cloudflare.

If the target hostname is not `bod.billerickson.net`, update the
`routes[].pattern` value in `wrangler.jsonc` before deploying.

## Environment Variables

Required:

```sh
SESSION_SECRET
```

Local values live in `.dev.vars`, which is ignored by git. Production values
must be set through Wrangler or the Cloudflare dashboard. Do not commit real
secrets, parent passwords, local D1 state, or production data.

`.env.example` and `.dev.vars.example` contain placeholder values only.

## PWA Notes

The app includes:

- `public/manifest.webmanifest`
- `public/favicon.svg`
- `public/icons/icon.svg`
- mobile viewport and safe-area handling
- theme and background colors from Vault Ledger

Offline transaction entry is intentionally not supported. The ledger should
use D1 as the shared source of truth so both parent phones see the same data.

## Brand and Design Docs

The original product spec is in `docs/bank-of-dad-spec.md`.

Brand exploration files live in `docs/brand-guides/`:

- Option A: Buddy Blocks inspired
- Option B: Vault Ledger
- Option C: Codex choice
- HTML/CSS mockups for comparing the options

Option B is the selected direction for the built app.
