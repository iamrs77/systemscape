# Design

How Systemscape looks, and why: the type, the colours, the front page, the lesson pages and the motion. The reasons behind the larger choices are in [ADR 0010](adr/0010-a-look-of-its-own.md).

The aim is a page that feels alive without getting in the way of learning. The front page uses colour freely, because it's where you choose what to learn. The lesson pages use a single colour, so nothing competes with the diagram and the explanation.

## Type

| Font                                              | Used for                                                    |
| ------------------------------------------------- | ----------------------------------------------------------- |
| **Bricolage Grotesque** (variable, optical sizes) | Headings (`h1`–`h3`), the wordmark, the path's step numbers |
| **Figtree** (variable)                            | Everything else: body text, buttons, labels                 |
| **IBM Plex Mono**                                 | Numbers and data: the facts over the diagram, what's sent   |

The fonts come from `@fontsource-variable` and `@fontsource` and are bundled with the app, not fetched from a font service. Every `h1`–`h3` gets the display face from a base rule in `src/index.css`. The `font-display` class sets it anywhere else.

The diagram works out each name's width before drawing it, assuming about half an em a character for the sans (`SANS` in `src/diagram/Diagram.tsx`). If you change the body font, check the nameplates still fit.

## Colour

The page is a cool off-white (`--color-paper: #f5f5fb`) with white cards and a dark ink (`#1d2433`). The accent is indigo. The Tailwind class names still say `cyan-*`, remapped to indigo in `@theme`, so older panels pick it up unchanged.

Named colours live in `src/ui/palette.ts`:

| Name              | Colours                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `systemColor(id)` | the fundamentals violet, ride-hailing orange, video streaming pink, UPI green, Stockroom indigo; a spare colour for any system added later |
| `trackColor(i)`   | eleven colours in the fundamentals' order, running indigo, violet, fuchsia, pink, rose, orange, amber, lime, emerald, teal, sky            |
| `LESSON_COLOR`    | Stockroom's indigo, the one colour every lesson page wears                                                                                 |

The colours for a part's state (healthy, busy, behind, overloaded, down) are separate, in `src/theme.ts`, and aren't used for decoration. The one exception is the rose of a "When it fails" callout, which means the same thing.

### One colour, set where it applies

A part of the page that wears a colour sets it as the CSS variable `--tc`, in a `style` attribute. Everything inside reads it with Tailwind's variable syntax: `bg-(--tc)`, `bg-(--tc)/10`, `border-(--tc)/20`. The `.accent` class works out `--tc-ink`, the same colour darkened with black, for text that needs to be readable on white. The system cards define their own `--tc-ink`.

- The page for a system sets `--tc` to `LESSON_COLOR` on its root (`Explorer` in `src/App.tsx`), so the course list, the step card, the facts and the diagram's backdrop all follow it.
- On the front page, each track step and system card sets its own.
- Primary buttons use `var(--tc, indigo)`, so they take the page's colour wherever one is set.

## The front page

- **Opening words.** A soft glow of colour sits behind them (`.hero-glow`), and "big apps" is painted with a slowly drifting gradient (`.text-shimmer`). A pill above them, with a pulsing green dot, counts the lessons and systems from the data.
- **The fundamentals, as a path.** The tracks wind down the page like a snake: each row runs the opposite way to the one above it.
  - **Layout.** There are four tracks to a row on wide screens, two on tablets and one on phones. Each card is placed in the grid by its row and column. `grid-auto-rows: 1fr` keeps every row as tall as the tallest, so all the steps are one size.
  - **The line.** `FundamentalsPath` measures where each card landed, using a `ResizeObserver`, and draws an SVG line behind them. Neighbours in a row are joined straight across. At the end of a row the line bends out past the card and back into the next row. Each piece fades from one track's colour to the next, with dots moving along it (`.snake-flow`).
  - **The cards.** Each card shows only the track's number (a tick once it's done), its name and its lesson count, plus a progress bar once it's started.
- **Systems, with posters.** Each system card has a drawn poster at the top (`src/ui/posters.tsx`), then its name, a two-line tagline, chips for its lessons and parts, and a progress bar once it's started. Stockroom carries a "Real design" badge. The posters are:
  - ride-hailing: a city from above, with a car driving to a rider's pulsing pin;
  - video streaming: a TV showing a film live, sent out to a phone and a tablet;
  - UPI payments: a ₹ coin travelling from one phone, through the bank, to another;
  - Stockroom: shelves of boxes, a scanner sweeping one rack, and a stock tag.

  Each poster is drawn on a 400 × 200 board whose background runs well past its edges. It's scaled to fit, so nothing that matters is ever cropped, and a card of any shape is still filled. A system without a poster shows a small live drawing of its diagram instead. To add one, write a poster function and add it to `POSTERS`.

## The top bar and the logo

- **The mark** is a tile shaded indigo to fuchsia to orange, with a white S-shaped path joining two dots: a request winding through a system, like the path on the front page. It's `Logo` in `src/ui/TopBar.tsx`, and the same drawing is `public/favicon.svg`.
- **The bar** (`.app-bar`) stays at the top of the page as you scroll. It's frosted, with a thin strip of colour along its top edge.
  - **On the front page** it has the wordmark, links that scroll to the fundamentals and the systems, and a Source button. The links are buttons, because the URL's hash is the router.
  - **Inside a system** it has the wordmark and a picker for the system, which shows each system's colour as a dot.

## The lesson pages

Everything is in `LESSON_COLOR`:

- **The page.** A soft glow of the colour sits behind the panels (`.explorer-glow`), and the diagram sits on a faint dotted grid tinted with it (`.diagram-bg`).
- **The course list.**
  - Each track has a readable heading with a coloured dot and a "3/6" count.
  - The lesson you're on is tinted, with its number in a filled tile.
  - A finished lesson gets a filled tile with a tick.
  - "Your progress" has a bar in the colour.
- **The step card.**
  - A tinted header stays in place while the explanation scrolls. It holds the lesson's name, a "Step 3 of 7" pill, a bar with one piece per step, and the step's title.
  - On the last step, the pill says "Lesson done".
  - "Good to know" callouts carry a light bulb, and "When it fails" a rose warning sign.
  - Comparisons, what's sent, and the timeline of calls are tinted to match.
- **A part's details** use the same header, with an edge of colour beside each section.
- **The facts** over the diagram each have an edge of colour on their left.

## Motion

| What moves                                               | How                 |
| -------------------------------------------------------- | ------------------- |
| Dots along the path, and along the posters' trails       | CSS (`.snake-flow`) |
| The pulsing "live" dot, the shimmer, the scanner         | CSS                 |
| The car, the rider's pin, the coin, the video's progress | SVG animation       |
| Cards lifting, tiles tilting, posters zooming on hover   | CSS transitions     |

For people who ask for reduced motion, a rule in `src/index.css` stops the CSS animations and transitions. The posters leave out their SVG animation and draw a still frame instead. The header's links jump straight to a section instead of scrolling smoothly.

## Accessibility

- A whole card is one link: the name's link is stretched over the card. Its focus ring follows the card's rounded corners.
- The posters, the path's line and the decorative dots are hidden from screen readers. The card's name and words say what it is.
- Colour is never the only signal. A finished lesson has a tick, the lesson you're on is marked `aria-current`, and a callout's kind is in its title.
- White text only sits on the darker shades (600 and 700). The `--tc-ink` shade is for coloured text on white.
