# Sorot frontend: design direction

Source: the reference hero supplied by the project owner (Swapify shot), extended to the rest of the product. This file is the direction the antislop filter is applied on top of.

## Read

Reading this as: product landing and trade tool for crypto-native X users, in a light lavender, ink-black, single electric-blue language, dial ENERGY 2 / RHYTHM 3 / MOTION 1.

- ENERGY 2: the hero is loud (giant wordmark, phone, glow). Everything below it calms down so the trade tool stays readable.
- RHYTHM 3: sections change composition on purpose (statement list, preview + timeline, dark funnel, annotated diagram, flagship + list, flow diagram, copy panel, accordion). No two neighbours share a layout.
- MOTION 1: hover and focus states, one fade on section headings and key visuals. Nothing loops. Reduced motion turns it all off.

## Palette (2 core + 1 accent, neutrals free)

| Token | Value | Why |
| --- | --- | --- |
| ink | `#0b0f1a` | Headings, primary pills, NO side. Reference uses near-black pills. |
| base | `#eef0fd` | Page background. Reference lavender-white. |
| accent | `#1626f0` | One electric blue: nav pill, YES side, focus ring, links. Reference "Sign Up" pill. |
| muted | `#4f5563` | Body copy on base, 6.6:1. |
| subtle | `#5f6573` | Small captions on base, 5.1:1. |
| ondark-muted | `#aab0c2` | Body copy on the dark panel, 9:1. |

Periwinkle gradients (`#4c5bee`, `#8b92ef`) exist only in the hero backdrop, the phone, and the closing panel. They are the reference's atmosphere, not a general fill.

Semantic colors appear only inside states: error `#b3261e` on `#fdecea`, success `#0b6b3f` on `#e6f5ec`. Both pass 4.5:1.

## Type

DM Sans, because the reference uses it. Headings 600 with negative tracking, body 400 to 500. Sentence case everywhere. No uppercase tracked labels, no monospace except real commands and API routes.

## Shape

- Pills: buttons only (reference).
- Large radius 28px: the few surfaces that represent real UI (tweet mock, trade popup mock, trade page card).
- 16px: inputs, rows, list items.
- Content sections use hairlines instead of cards.

## Elevation, glass, glow

- Glass (backdrop blur) is limited to the two hero cards on the phone, as in the reference.
- Shadow: only the floating mock surfaces (tweet, popup). Everything else is flat.
- Glow: none outside the hero.

## Identity motif

The cut-off wordmark, repeated at the bottom of the closing panel. The circle split by a cross is the logo.

## Honesty rules for content

- Numbers in previews are labeled illustrative. Live chips show only Panta API data.
- Money is a decimal string exactly as the API returns it. No float math.
- A null price renders "see odds", never a number.
- Closed or resolved markets are never tradable.
- Pages that run on fixtures show a visible "Demo data" banner.
