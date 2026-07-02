# Bank of Dad

Bank of Dad is a private family chore and spending ledger built with Astro for Cloudflare Workers. It does not move real money. Parents use one shared password, add kids during first-run onboarding, and record save/spend transactions manually.

The selected brand direction is **Option B: Vault Ledger** from `docs/brand-guides/option-b-wallet-bank.md`.

## Tech Stack

- Astro with server rendering
- `@astrojs/cloudflare` adapter
- Cloudflare Workers deployment
- Cloudflare D1 for shared persistent storage
- Signed HttpOnly cookie for the parent session
- Web Crypto PBKDF2 password hashing

## Storage Decision

This app uses **Cloudflare D1** instead of localStorage or KV.

D1 is the simplest good fit because Bank of Dad is an auditable ledger with relational data:

- kids have many transactions
- transactions are the source of truth
- balances can be recalculated from transaction history
- monthly interest needs duplicate protection per `(kid, month)`

The D1 migration creates a partial unique index for interest transactions so clicking Apply Monthly Interest repeatedly does not duplicate the same kid/month.

## Local Setup

Install dependencies:

```sh
npm install
```

Create local secrets:

```sh
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set a long random `SESSION_SECRET`. Do not commit `.dev.vars`.

Apply the D1 schema to the local Miniflare database:

```sh
npm run db:migrate:local
```

Start the local app:

```sh
npm run dev
```

Open the local URL shown by Astro. With an empty local D1 database, the app redirects to first-run onboarding.

## First-Run Onboarding

On first load against an empty database, the app asks for:

- shared parent password
- one or more kid names

The parent password is hashed before it is stored. Kid names are entered by the parent and are not hardcoded or seeded in production code.

For Bill's deployment, use onboarding to add Reagan and Ada.

## Starting Balances

Kids start at `$0.00` after onboarding.

To add a starting balance later, open the kid account and create a **Save** transaction with a description like `Starting balance`. This keeps the ledger auditable instead of storing invisible balance state.

## Development Commands

```sh
npm run dev
npm run build
npm run preview
npm run db:migrate:local
```

`npm run build` runs:

```sh
wrangler types && astro check && astro build
```

## Cloudflare Setup

The project is prepared for Cloudflare Workers. Current Astro Cloudflare docs recommend Workers for new full-stack Astro apps.

This repo is configured for Bill's deployment with:

- Worker name: `bank-of-dad`
- D1 database: `bank-of-dad`
- D1 binding: `DB`
- Custom domain route: `bod.billerickson.net`

For another family's fork, create a new D1 database and replace the `database_id` in `wrangler.jsonc`.

1. Log in:

```sh
npx wrangler login
```

2. Create the production D1 database if this is a new deployment:

```sh
npx wrangler d1 create bank-of-dad
```

3. Copy the returned `database_id` into `wrangler.jsonc`.

4. Set the production session secret:

```sh
npx wrangler secret put SESSION_SECRET
```

5. Apply the schema to production D1:

```sh
npm run db:migrate:remote
```

6. Deploy:

```sh
npm run deploy
```

7. Confirm the custom domain `bod.billerickson.net` is active.

The repo includes this Wrangler route:

```json
"routes": [
  {
    "pattern": "bod.billerickson.net",
    "custom_domain": true
  }
]
```

If Cloudflare cannot attach the custom domain during deploy, add it from the dashboard:

- Open Cloudflare Dashboard
- Go to Workers & Pages
- Select the `bank-of-dad` Worker
- Add a custom domain or route for `bod.billerickson.net`
- Confirm DNS points through Cloudflare

## Environment Variables

`SESSION_SECRET` is required.

Local development:

```sh
.dev.vars
```

Production:

```sh
npx wrangler secret put SESSION_SECRET
```

The parent password is not an environment variable. It is created during first-run onboarding and stored only as a server-side hash in D1.

## Monthly Interest

The Settings page contains **Apply Monthly Interest**.

Behavior:

- default rate is 1% monthly
- applies only to completed months
- skips the current in-progress month
- skips months where the kid's ending balance was `$0.00` or negative
- backdates interest to the first day of the following month
- records interest as explicit transactions
- guards against duplicate kid/month interest rows

If several months were missed, one click catches up all eligible months.

## Privacy and Indexing

This app is private by convention and password gate, not bank-grade auth.

Noindex protections are included:

- every app page includes `<meta name="robots" content="noindex, nofollow">`
- middleware adds `X-Robots-Tag: noindex, nofollow`
- `public/_headers` adds noindex headers for static assets where Cloudflare applies them

Do not commit real secrets, real passwords, local D1 state, or `.dev.vars`.

## PWA Notes

The app includes:

- `public/manifest.webmanifest`
- Vault Ledger SVG icon at `public/icons/icon.svg`
- mobile viewport and safe-area handling
- theme/background colors from Option B

Offline transaction entry is intentionally not supported. Transactions require the shared D1 source of truth so both parent phones see the same balances.

## Deployment Sources

The Cloudflare setup follows the current Astro and Cloudflare docs for:

- Astro Cloudflare adapter and `cloudflare:workers` bindings
- Cloudflare Workers deployment with Wrangler
- Cloudflare D1 bindings and local D1 data
