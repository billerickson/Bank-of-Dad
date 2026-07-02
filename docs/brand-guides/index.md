# Bank of Dad Brand Guide Options

This directory contains three brand directions for the Bank of Dad Astro app. The app should not be built yet; these guides are intended to support a brand choice before implementation.

The shared source of truth is `docs/bank-of-dad-spec.md`. All mockups use Reagan and Ada only as sample data for documentation. The production app must collect kids during first-run onboarding and must not seed real family data.

## Options

| Option | Concept | Best fit | Tradeoffs |
| --- | --- | --- | --- |
| [Option A: Coin Blocks](./option-a-buddy-blocks-inspired.md) | Colorful tactile coin blocks, sibling in spirit to Buddy Blocks | Choose this if Bank of Dad should feel playful, optimistic, kid-friendly, and part of a broader family of colorful tools | Needs careful restraint so transaction history stays readable and money actions still feel trustworthy |
| [Option B: Vault Ledger](./option-b-wallet-bank.md) | Traditional private ledger with wallet/vault cues | Choose this if the app should feel durable, secure, parent-first, and closest to a conventional finance utility | Less distinctive and less kid-facing; could feel too serious unless copy stays warm |
| [Option C: Family General Store](./option-c-codex-choice.md) | Household counter, receipt book, and family account tabs | Choose this if the app should feel personal, warm, practical, and clearly different from both toy blocks and banking apps | The metaphor needs light handling so "tabs" never obscure the actual balance/transaction model |

## Recommendation

If the priority is a natural sibling to Buddy Blocks, choose **Option A: Coin Blocks**. It directly satisfies the requested colorful, tactile, rounded, modular, kid-friendly direction while still translating the app's money actions into clear save/spend states.

If the priority is confidence and speed for Bill and Tara using the app on phones, choose **Option B: Vault Ledger**. It is the safest execution path for a simple private ledger and would be the easiest to implement without visual clutter.

If the priority is a memorable identity that still feels right for a family chore/spending ledger, choose **Option C: Family General Store**. This is my preferred third direction because it makes the app feel household-owned rather than institutional. It gives the ledger a warm reason to exist: every kid has a family tab, every transaction is a receipt entry, and the parent flow stays quick.

## Comparison By Product Need

| Product need | Option A | Option B | Option C |
| --- | --- | --- | --- |
| Mobile-first parent speed | Good, with large action tiles | Excellent, with restrained rows | Excellent, with compact receipt entries |
| Kid-friendly feel | Excellent | Moderate | Good |
| Trustworthy money tracking | Good, if colors are restrained in ledger views | Excellent | Good to excellent |
| Public reusable repo fit | Good | Excellent | Excellent |
| PWA home-screen icon | Bright and recognizable | Credible and app-like | Distinctive and warm |
| Accessibility risk | Medium, due to bright palette | Low | Low to medium, due to receipt-line styling |
| Implementation complexity | Medium | Low | Low to medium |
| Brand distinctiveness | High | Moderate | High |

## Implementation Notes Shared By All Options

- Keep all pages `noindex` and password-gated as specified.
- Treat Reagan and Ada as mockup-only names.
- Keep monthly interest in settings or a mobile menu, not on the home or kid account primary action row.
- Preserve the ledger model: save, spend, and interest are explicit transactions.
- Use signed amounts and text labels in addition to color.
- Use tabular numerals for every balance and amount.
- Keep touch targets at least 44px by 44px.
- Generate final PWA icons only after the brand direction is selected.

## SVG Concepts

Simple concept assets are included under `public/brand/options/`:

| Option | Logo | App icon |
| --- | --- | --- |
| A | `option-a-logo.svg` | `option-a-app-icon.svg` |
| B | `option-b-logo.svg` | `option-b-app-icon.svg` |
| C | `option-c-logo.svg` | `option-c-app-icon.svg` |
