# Option B: Vault Ledger

Brand guide for the Bank of Dad brand exploration. This option treats the product like a small private ledger: restrained, secure, clean, and quick to scan.

Sample names and balances in these mockups are documentation-only data. The production app should collect kids dynamically during first-run onboarding.

## Brand Concept

**Concept name:** Vault Ledger

**Positioning:** Bank of Dad is a compact family account book with the confidence of a wallet app and the clarity of a bank ledger. It borrows trust cues from finance products, but stays simple and human because this app does not move real money.

**Personality:**
- Trustworthy, crisp, and quiet
- Secure without feeling intimidating
- Ledger-like and auditable
- More parent-focused than kid-facing, but still warm enough for family use

**Visual metaphor:** Vault dial, wallet card, account rows, stamped balances, monogrammed coin, and a clean transaction ledger.

**Where it fits the product:** This is the strongest option if Bill wants the app to feel like a durable tool first. It supports the spec's requirements around privacy, password access, noindex, auditable transaction history, and shared balances across devices.

## Logo System

### Primary Logo Concept

Use a compact `BOD` monogram next to a wallet/vault mark. The mark combines:
- A wallet rectangle
- A circular vault dial
- A small coin notch
- A subtle keyhole or center dot

The logo should feel like a family utility with financial structure, not a novelty bank.

![Option B logo concept](../../public/brand/options/option-b-logo.svg)

### App Icon Concept

A dark app icon with a wallet/vault glyph and one warm coin accent. It should look credible on a phone home screen beside banking, password, or wallet apps.

![Option B app icon concept](../../public/brand/options/option-b-app-icon.svg)

### Logo Usage

- Use the full lockup on onboarding and login.
- Use the vault/wallet icon in the app shell and PWA icon set.
- Use the monogram alone only when space is very tight.
- Avoid decorative money imagery beyond the logo; the UI should earn trust through layout and numbers.

## Color Palette

The palette is restrained, but not cold. It combines dark ink, institutional green, warm coin metal, and paper-like surfaces.

| Role | HEX | Usage |
| --- | --- | --- |
| Vault Ink | `#0E1726` | App header, primary text, app icon background |
| Ledger Green | `#0B6B4F` | Primary brand color, save states |
| Fresh Green | `#0F8B63` | Positive accents, confirmations |
| Reserve Gold | `#D8A31A` | Coin accent, interest badge |
| Coin Copper | `#B66A2B` | Secondary accent, subtle warning/attention |
| Paper | `#F7F5EF` | App background |
| Surface | `#FFFFFF` | Cards, form surfaces |
| Line | `#D9DEE7` | Dividers, input borders |
| Muted Text | `#5E6B7A` | Labels, helper copy |
| Save | `#0F7B55` | Save action and positive amounts |
| Spend | `#B42335` | Spend action and negative amounts |
| Focus | `#2F80ED` | Focus ring and links |
| Error Wash | `#FDE8EC` | Error background |

Suggested PWA colors:
- `theme_color`: `#0E1726`
- `background_color`: `#F7F5EF`

## Typography

| Role | Font | Source / fallback |
| --- | --- | --- |
| Display/UI | IBM Plex Sans 600-700 | Google Fonts or self-hosted; fallback `Inter`, `system-ui`, sans-serif |
| Body | IBM Plex Sans 400-600 | Same family for a calm interface |
| Numbers | IBM Plex Mono 500-700 | Google Fonts or fallback `ui-monospace`, `SFMono-Regular`, monospace |

Usage notes:
- Use IBM Plex Sans for headings, labels, and buttons.
- Use IBM Plex Mono only for balances, amounts, and running totals.
- Enable `font-variant-numeric: tabular-nums` everywhere money appears.
- Keep text sizes restrained; clarity comes from hierarchy, spacing, and alignment.

## Iconography

Use clean 1.75-2px line icons, no filled stickers. Icons should be secondary to labels and numbers.

Suggested icons:
- Home: `House`
- Kid/account: `UserRound`
- Save: `ArrowDownToLine` or `CirclePlus`
- Spend: `ArrowUpFromLine` or `CircleMinus`
- Transaction/history: `ReceiptText`
- Lock/login: `ShieldCheck` or `LockKeyhole`
- Settings: `SlidersHorizontal`
- Interest: `BadgePercent`

Icon treatment:
- Ink or muted text for navigation icons.
- Save and spend icons use the action color only at the button level.
- Use small lock/shield details in auth screens, but do not overstate security.

## UI Component Language

### Cards

- Flat cards with `8px` radius, 1px border, and no decorative shadow.
- Kid cards look like account summary rows.
- Use clear alignment: names left, balances right.
- Optional avatar is a simple monogram in a circle, not an illustration.

### Buttons

- Primary button: Ledger Green or Vault Ink.
- Save button: Save green.
- Spend button: Spend red.
- Secondary button: white surface with border.
- Destructive actions, if added later, should be clearly separated from routine spend transactions.

### Inputs

- Rectangular, crisp, and dense enough for quick parent entry.
- Use visible labels above fields.
- Focus ring in Focus blue.
- Currency amount fields should use a fixed prefix or masked formatting if implemented.

### Transaction Rows

- Ledger rows with consistent columns: date, description, amount, balance.
- On narrow screens, stack description under date but keep amount and running balance aligned right.
- Use signed amounts and color, but make color secondary.

### Balance Display

- A large numeric balance in mono type.
- Use a small uppercase label like "Current balance" above it.
- Avoid large decorative charts; the spec calls for a simple ledger.

### Empty States

- Use plain account-book language.
- Example: "No transactions yet. Save or spend entries will appear here."

### Error States

- Use clear border and message treatments.
- Login error: "That password did not work. Try again."
- Storage/API errors should explain whether the transaction was saved.

## Key Screen Mockups

These are low-fidelity mobile wireframes for layout and tone, not implementation code.

### First-Run Onboarding

```txt
+------------------------------------------------+
| [vault wallet mark] Bank of Dad                |
| Set up your family bank.                       |
|                                                |
| Setup checklist                                |
| 1. Parent password                             |
| Password                         [          ]  |
| Confirm password                 [          ]  |
|                                                |
| 2. Kids                                        |
| Name                            Starting       |
| Reagan                          $0.00          |
| Ada                             $0.00          |
| [ + Add kid ]                                  |
|                                                |
| [ Complete setup ]                             |
+------------------------------------------------+
```

Notes:
- The flow feels like creating a private account book.
- Use checklist styling instead of playful stickers.
- Starting balances remain optional and must create explicit ledger entries.

### Login

```txt
+------------------------------------------------+
| [vault mark]                                    |
| Bank of Dad                                     |
| Private family ledger                           |
|                                                |
| Password                                       |
| [                                          ]   |
|                                                |
| [ Unlock ]                                     |
|                                                |
| That password did not work. Try again.         |
+------------------------------------------------+
```

Notes:
- Minimal copy, centered form, strong trust cue.
- Mention "Private family ledger" rather than "secure bank."

### Home Dashboard

```txt
+------------------------------------------------+
| Bank of Dad                         [settings] |
| Accounts                                       |
|                                                |
| +--------------------------------------------+ |
| | Reagan                              $42.75 | |
| | Last transaction: Lemonade stand       >   | |
| +--------------------------------------------+ |
|                                                |
| +--------------------------------------------+ |
| | Ada                                 $18.20 | |
| | Last transaction: Ice cream            >   | |
| +--------------------------------------------+ |
+------------------------------------------------+
```

Notes:
- Reagan and Ada are sample data only.
- Cards should feel like account rows.
- Avoid decorative progress visuals that make balances look like goals.

### Kid Account

```txt
+------------------------------------------------+
| < Accounts                                     |
| Reagan                                         |
|                                                |
| CURRENT BALANCE                                |
| $42.75                                         |
|                                                |
| [ Save ]                         [ Spend ]     |
|                                                |
| Date    Description          Amount   Balance  |
| Jun 30  Lemonade stand       +$8.50   $42.75   |
| Jun 28  Book fair            -$6.25   $34.25   |
| Jun 01  Monthly interest     +$0.40   $40.50   |
+------------------------------------------------+
```

Notes:
- The transaction table should remain readable on a phone.
- Use the most recent transactions first.
- Interest transactions should be visibly distinct but not visually louder than save/spend entries.

### Save / Spend Transaction Modal

```txt
+------------------------------------------------+
| Add save for Reagan                            |
|                                                |
| Amount                                         |
| [$                                      ]      |
|                                                |
| Description                                    |
| [ Lemonade stand                        ]      |
|                                                |
| Date                                           |
| [ Today                                  ]     |
|                                                |
| [ Cancel ]                         [ Save ]    |
|                                                |
| Spend mode changes the title, color, and       |
| submit label, but keeps the same structure.    |
+------------------------------------------------+
```

Notes:
- This can be a route or modal. If modal, use a simple centered or bottom sheet pattern.
- The transaction type comes from the action that opened the form.
- Amount validation should be explicit and plain.

## Accessibility Notes

- Use signed amounts, words, and icons so save/spend does not depend on color.
- Keep Ledger Green and Spend Red at accessible contrast against white.
- Minimum touch target: 44px by 44px.
- Ensure table-like transaction rows preserve reading order for screen readers.
- Use `inputmode="decimal"` for amount inputs.
- Auth errors should be connected to the password field with `aria-describedby`.
- Do not use "bank-grade" claims in the UI.

## Implementation Notes

Suggested CSS variables:

```css
:root {
  --color-ink: #0E1726;
  --color-brand: #0B6B4F;
  --color-brand-bright: #0F8B63;
  --color-gold: #D8A31A;
  --color-copper: #B66A2B;
  --color-bg: #F7F5EF;
  --color-surface: #FFFFFF;
  --color-line: #D9DEE7;
  --color-muted: #5E6B7A;
  --color-save: #0F7B55;
  --color-spend: #B42335;
  --color-focus: #2F80ED;
  --radius-card: 8px;
  --radius-control: 6px;
  --shadow-card: none;
}
```

Responsive behavior:
- Mobile first, with the app shell capped around 480px on larger screens.
- Use single-column account rows.
- Consider a compact table layout for transactions, then stack row metadata under the description only when the viewport is too narrow.
- Keep settings and monthly interest in a secondary menu, per the spec.

Asset notes:
- Concept SVGs live in `public/brand/options/option-b-logo.svg` and `public/brand/options/option-b-app-icon.svg`.
- Generate maskable PWA icons from the wallet/vault mark after the brand is selected.
- This option is easiest to implement with system-like components and minimal illustration.
