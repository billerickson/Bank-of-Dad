# Agent Installation Guide

This repository is a self-hosted Bank of Dad app for a single family. It runs
on Astro, Cloudflare Workers, Workers Static Assets, and Cloudflare D1.

Use this guide when installing, deploying, or handing the project to another
agent. Keep the deployment simple and do not add multi-tenant, billing, or
SaaS assumptions.

## Non-Negotiables

- Do not commit real secrets, parent passwords, cookies, D1 exports, or family
  data.
- Do not hardcode kid names in production app code.
- Do not reset or clear the remote D1 database unless the user explicitly asks
  and you have confirmed what data is present.
- Keep the D1 binding name as `DB`; the app expects that binding.
- Keep `SESSION_SECRET` server-side only.
- Run onboarding to create family data. Do not seed Reagan, Ada, or sample
  kids in production code.
- This app is a family utility, not a real bank.

## Quick Local Install

```sh
git clone git@github.com:billerickson/Bank-of-Dad.git
cd Bank-of-Dad
npm install
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```sh
SESSION_SECRET="replace-with-a-long-random-local-secret"
```

Create the local D1 schema and start the app:

```sh
npm run db:migrate:local
npm run dev
```

Open the Astro local URL. An empty local database should redirect to
`/onboarding`.

## Local Smoke Test

Use a fresh local database when possible and verify:

- empty storage redirects to onboarding
- onboarding creates a shared password and at least one kid
- login works after onboarding
- wrong password shows an error
- home lists configured kids
- Save increases balance
- Spend decreases balance
- transaction history shows date, description, signed amount, and running
  balance
- Settings includes Apply Monthly Interest
- Apply Monthly Interest is idempotent
- refresh preserves data
- noindex meta/header protections are present
- PWA manifest exists at `/manifest.webmanifest`

## Installing to a Cloudflare Account

`wrangler.jsonc` is intentionally ignored by git because it contains
deployment-specific hostnames and database IDs. Start from the public template:

```sh
cp wrangler.example.jsonc wrangler.jsonc
```

1. Sign in to the Cloudflare account that owns the target domain:

```sh
npx wrangler login
```

2. Choose a Worker name in `wrangler.jsonc`. Keep it simple, for example:

```json
{
  "name": "bank-of-dad"
}
```

3. Update the custom domain route:

```json
{
  "routes": [
    {
      "pattern": "bank-of-dad.yoursite.com",
      "custom_domain": true
    }
  ]
}
```

The target hostname must be on a Cloudflare-managed DNS zone and should not
have conflicting records.

4. Create a fresh D1 database:

```sh
npx wrangler d1 create bank-of-dad
```

5. Copy the returned UUID into `wrangler.jsonc`:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "bank-of-dad",
      "database_id": "<your-d1-database-uuid>"
    }
  ]
}
```

6. Set the production session secret:

```sh
npx wrangler secret put SESSION_SECRET
```

Use a long random value. Do not place the real value in `.env.example`,
`.dev.vars.example`, docs, commits, or chat output.

7. Apply the remote schema:

```sh
npm run db:migrate:remote
```

8. Deploy:

```sh
npm run deploy
```

9. Open the deployed domain. A fresh remote D1 database should show first-run
onboarding. Create the shared parent password and add the family's kids.

## Updating an Existing Deployment

For an existing private deployment, keep the real deployment settings in your
local ignored `wrangler.jsonc`:

- Worker: `bank-of-dad`
- Domain: your private Cloudflare custom domain
- D1 database name: `bank-of-dad`
- D1 binding: `DB`

Before changing the live deployment:

```sh
git status --short --branch
npm run build
```

If Cloudflare credentials are present and the request is to deploy:

```sh
npm run deploy
```

Do not run destructive D1 commands on a remote database unless explicitly
requested. To inspect counts safely:

```sh
npx wrangler d1 execute bank-of-dad --remote --command="SELECT COUNT(*) AS settings_count FROM app_settings; SELECT COUNT(*) AS kid_count FROM kids; SELECT COUNT(*) AS transaction_count FROM transactions;"
```

## Remote Verification

After deploying, verify the live site:

- `GET /login` or `/onboarding` returns `X-Robots-Tag: noindex, nofollow`
- app HTML returns `Cache-Control: no-store`
- the HTML links a cache-busted stylesheet URL
- `/manifest.webmanifest` returns 200
- first-run onboarding appears on an empty database
- login redirects and session cookie behavior work after setup
- D1 persists data across refreshes and separate browsers

If normal DNS lookup fails from the local machine, resolve a Cloudflare IP and
test with `curl --resolve`, replacing `<your-hostname>` with the deployed
custom domain:

```sh
IP=$(dig +short <your-hostname> | head -n 1)
curl -sSI --resolve "<your-hostname>:443:$IP" https://<your-hostname>/login
```

## Data Model Notes

The schema lives in `migrations/0001_schema.sql`.

- `app_settings` contains the initialized flag, password hash, and interest
  rate.
- `kids` contains configured kid records.
- `transactions` is the source of truth for balances.

Save and interest transactions are stored as positive amounts. Spend
transactions are also stored as positive amounts, and the sign is derived from
the transaction type for calculations and display.

Monthly interest uses `interest_for_month` in `YYYY-MM` format and a unique
partial index to prevent duplicates.

## Brand Notes

The selected direction is **Option B: Vault Ledger**.

- UI font: IBM Plex Sans
- Money font: IBM Plex Mono
- Main ink: `#0E1726`
- Ledger green: `#0B6B4F`
- Background: `#F7F5EF`
- Positive/save: `#0F7B55`
- Negative/spend: `#B42335`

Do not switch to the Option C serif direction unless the user explicitly asks.

## Git Workflow

Before editing:

```sh
git status --short --branch
```

After docs or code changes:

```sh
npm run build
git status --short
git add <changed-files>
git commit -m "<clear message>"
git push origin master
```

For docs-only changes, a full build is optional but preferred when the change
touches install or deployment instructions.
