# Longevity Digest — Email SOP

## Design Tokens (single source of truth)

These values must be used everywhere — email template, website, any future assets.

| Token       | Value     | Usage                                      |
|-------------|-----------|---------------------------------------------|
| Navy        | `#0B1F3A` | Wordmark, headlines, dark CTAs, Boris bg    |
| Gold        | `#C9A96E` | Section labels, links, dividers, accents    |
| Cream       | `#F8F5EF` | Page/email background                       |
| Card bg     | `#EDE8DF` | Boris Take box, One Number box              |
| Text body   | `#374151` | All body copy                               |
| Text muted  | `#6B7280` | Summaries, secondary copy                  |
| Text subtle | `#9CA3AF` | Footer, meta, timestamps                   |
| Divider     | `#E0D9CC` | Section separators                          |

## Typography Rules

- **Serif (Georgia):** wordmark, headlines (lead title, rest titles), all body/analysis copy
- **System-ui:** section labels, source lines, tags, CTA buttons, footer — UI elements ONLY
- Never mix these within the same semantic role

| Element       | Font       | Size | Weight | Color       |
|---------------|------------|------|--------|-------------|
| Wordmark      | Georgia    | 24px | 700    | Navy        |
| Section label | System-ui  | 10px | 700    | Gold (caps, 2.5px spacing) |
| Source line   | System-ui  | 10px | 600    | Muted (caps, 1.5px spacing) |
| Lead headline | Georgia    | 22px | 700    | Navy        |
| Rest headline | Georgia    | 17px | 700    | Navy        |
| Body / analysis | Georgia  | 15px | 400    | Text body   |
| Summary       | Georgia    | 15px | 400    | Text muted  |
| Boris text    | Georgia    | 15px | 400    | `#CBD5E1` italic |
| Footer        | System-ui  | 11px | 400    | Text subtle |

## Required Digest Fields

Every digest sent via `/api/digest` MUST include all of these:

```json
{
  "date": "YYYY-MM-DD",
  "papers": [...],
  "subjectLine": "Longevity Digest — Friday, 6 March 2026 🧬",
  "borisTake": "One or two sentences. Opinionated. Protocol-aware. What a longevity practitioner actually thinks about the week's most important finding.",
  "leadAnalysis": "3-4 sentences. Deeper than the abstract summary. Covers mechanism, implications, what it means for the field.",
  "oneNumber": "144M | Dollars committed by ARPA-H to geroscience trials in 2026"
}
```

### Field quality standards

**`borisTake`**
- 1-2 sentences max
- Opinionated — takes a position
- Protocol-aware — connects to what practitioners actually do (rapamycin, NAD+, senolytics, etc.)
- Written in first person as Boris: "This is the paper I've been waiting for..."
- Not a summary — a reaction

**`leadAnalysis`**
- 3-4 sentences
- Covers: mechanism → implication → open question or clinical relevance
- More depth than the paper's abstract
- No hedging ("this suggests", "may indicate") unless genuinely uncertain

**`oneNumber`**
- Format: `{STAT} | {BRIEF CONTEXT}`
- The most striking quantitative fact from the digest
- Should work as a standalone tweet
- Examples:
  - `144M | Dollars the US government just committed to geroscience trials`
  - `92% | Purity confirmed on MOTS-c batch — well above the 85% clinical threshold`
  - `309 | Adults in the RCT that proved resistance training measurably slows brain aging`

**`subjectLine`**
- Lead with the single most important finding — the one that would make a longevity practitioner open immediately
- Include an emoji that matches the topic (🧬 for genetics/reprogramming, 🧠 for neuro, 💊 for drugs, 🦠 for microbiome)
- Keep under 60 chars if possible (email preview length)
- Never: "Longevity Digest — Week in Review" (too generic)
- Always: "FDA cleared the first human reprogramming trial 🧬" (specific, urgent)

## Cron Checklist

Before deploying and sending, confirm:

- [ ] `borisTake` written and non-empty
- [ ] `leadAnalysis` is 3-4 sentences (not just the abstract summary)
- [ ] `oneNumber` is in `STAT | context` format
- [ ] `subjectLine` references the specific lead story, not the date
- [ ] Papers array has 6-8 items
- [ ] No duplicates from previous digest (`data/seen-items.json`)
- [ ] `/api/digest` POST returned `{"ok":true}`

## Sections (paid vs free)

| Section       | Paid | Free |
|---------------|------|------|
| Today's Lead (full) | ✅ | First 2 sentences only |
| Boris's Take  | ✅   | Locked / CTA |
| The Rest (items 2-3) | ✅ | ✅ |
| The Rest (items 4-6) | ✅ | Locked / CTA |
| One Number    | ✅   | ✅ |
| CTA block     | ✗    | ✅ |
