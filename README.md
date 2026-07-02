# Bank of Dad

Bank of Dad is a private family money ledger for kids. It gives parents a
simple place to track allowance, chore money, gifts, spending, and monthly
interest without pretending to be a real bank.

It is built for the small moments that usually happen in passing:

- "Can I buy this?"
- "How much do I have?"
- "Add five dollars for mowing."
- "Did we ever apply interest this month?"

Bank of Dad turns those moments into a clear ledger both parents can trust.

![Bank of Dad app screenshot](https://p198.p4.n0.cdn.zight.com/items/KoubL2PB/0cebc218-3d8d-40bf-afe8-6fe896d5ac94.jpg?source=viewer&v=493b7e453a76dc45168cf7447e0b1da2)

## A Tiny Family Bank

The app is intentionally small. Parents create kid accounts, add Save and
Spend entries, and see each child's current balance. Every change is recorded
as a transaction, so the answer is never "I think you have about..."

It is not connected to a real bank account. It does not move money. It is the
family version of a ledger book, made fast enough to use from a phone while
standing in a store aisle.

## How It Works

### 1. Set up your family bank

The first time the app opens, a parent creates the shared password and adds
the kids. There are no built-in sample children and no default password.

Each kid starts at `$0.00`. If they already have money saved, add a Save
transaction called `Starting balance` so the beginning is visible in the
ledger.

### 2. Open the dashboard

The home screen shows each kid and their current balance. Tap a kid to open
their account.

### 3. Record saves and spends

Use **Save** when money comes in: allowance, chores, birthday cash, gifts,
refunds, or anything else the family wants to track.

Use **Spend** when money goes out: toys, games, books, treats, or purchases
where a parent paid first and the kid is using their balance.

Each row shows the date, description, signed amount, and running balance.

### 4. Apply monthly interest

Bank of Dad can apply 1% monthly interest from the Settings screen. If you
forget for a few months, one tap catches up the completed months that still
need interest.

Interest is written into the ledger as its own transaction and protected
against duplicates, so tapping the button twice will not pay the same month
twice.

## What Parents Get

- A shared source of truth across parent phones
- Fast balance checks before a purchase
- A visible history of where the money came from and where it went
- Simple Save and Spend flows that do not require a spreadsheet
- Optional monthly interest that teaches the idea of money growing over time
- A private, password-gated app that can be saved to a phone home screen

## What Kids Get

- A clear answer to "How much do I have?"
- A running history they can understand
- A way to see saving, spending, and interest as real choices
- A little more ownership over money without needing real bank access

## Built for Repeat Use

Bank of Dad is mobile-first. The interface is meant to be opened quickly,
tapped with one hand, and closed again. Balances are large, actions are clear,
and the ledger stays calm.

## Private by Default

Bank of Dad is designed for one family.

- The app is password-gated after setup.
- The shared parent password is stored as a hash, not plain text.
- Pages are marked noindex so search engines should not list them.
- Family data is created during setup, not committed to the codebase.

This is still a simple family utility, not bank-grade security. Use it for
tracking family balances, not for storing sensitive financial information.

## Get Your Own Copy

Bank of Dad is self-hosted. You can run your own copy on a Cloudflare account
and your own domain.

Point Codex, Claude, Hermes, or another AI agent at
[`AGENTS.md`](./AGENTS.md), and it can follow the installation guide for you.
The agent guide includes the Cloudflare setup, database setup, deployment
steps, and verification checklist.

For a quick local preview:

```sh
npm install
cp wrangler.example.jsonc wrangler.jsonc
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Before deploying a real copy, set a private `SESSION_SECRET`, create a
Cloudflare D1 database, and follow the full instructions in
[`AGENTS.md`](./AGENTS.md).

## Project Status

The app currently includes:

- first-run setup
- shared parent login
- kid dashboard
- kid account screens
- Save and Spend transactions
- transaction history with running balances
- monthly interest catch-up
- Cloudflare D1 storage
- PWA manifest and app icon
- noindex protections
