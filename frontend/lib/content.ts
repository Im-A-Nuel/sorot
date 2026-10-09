export const content = {
  brand: "Sorot",
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Matching", href: "#matching" },
    { label: "Security", href: "#security" },
    { label: "Panta API", href: "#panta" },
  ],
  secondaryLink: { label: "FAQ", href: "#faq" },
  primaryLink: { label: "Add to Chrome", href: "#install" },
  headline: ["See the odds,", "trade the take."],
  subtitle:
    "Sorot puts Panta odds right under the tweets people argue about. Quote, sign with Phantom, and trade without leaving X.",
  cta: { label: "Install Now", href: "#install" },
  // Illustrative hero preview only. Live chips never show numbers that did not come from the Panta API.
  cards: {
    a: { name: "SOL > $300", symbol: "by Oct 31", price: "YES 0.62", change: "NO 0.38" },
    b: { name: "ETH > $5,000", symbol: "by Dec 31", price: "see odds", change: "" },
  },
} as const;

export const builtOn = ["Panta API", "Solana", "Phantom", "Chrome MV3", "X"] as const;

export const problem = {
  eyebrow: "The gap",
  title: "Prediction markets are a destination. The argument isn't.",
  body: "Nobody opens a market page to argue about an event. They argue on X. Sorot brings the market to the argument.",
  points: [
    {
      title: "The debate lives on X",
      body: "Price calls, launches, elections, rulings. The takes happen in the timeline, not on a market site.",
    },
    {
      title: "Panta lives elsewhere",
      body: "Panta markets sit on Panta's own surface, a few terminals, Telegram bots and Blinks.",
    },
    {
      title: "No timeline overlay",
      body: "We found no Panta overlay for the X timeline. The same pattern already works for other markets, so we built it for Panta.",
    },
  ],
} as const;

export const how = {
  eyebrow: "How it works",
  title: "Odds under the tweet. One click to trade.",
  body: "A Chrome extension reads the timeline, the backend matches tweets to the Panta catalog, and a chip appears only when the match is verified.",
  steps: [
    {
      title: "Read",
      body: "The content script watches tweets as they appear, in small batches, without blocking scrolling. Each tweet is sent once per session.",
    },
    {
      title: "Match",
      body: "The backend checks the tweet against the Panta catalog: entity prefilter, embedding similarity, then a yes/no verification.",
    },
    {
      title: "Show",
      body: "Only a verified match gets a chip with the market title and YES and NO odds. No match, nothing on screen.",
    },
    {
      title: "Trade",
      body: "Click the chip. A trade window opens: pick a side, get a quote, sign with Phantom, see your position.",
    },
  ],
  note: "Illustrative example. Live chips only show data returned by the Panta API.",
} as const;

export const matching = {
  eyebrow: "Matching",
  title: "Precision over recall.",
  body: "One wrong chip costs more trust than ten tweets without one. Every stage can stop the pipeline, and only a clear yes shows a chip.",
  stages: [
    {
      label: "Stage 1",
      title: "Entity prefilter",
      body: "Tickers, names and dates in the tweet must overlap with a market in the catalog. No overlap, stop here.",
    },
    {
      label: "Stage 2",
      title: "Embedding similarity",
      body: "The tweet is compared with every market title. Only the top match above the threshold moves on.",
    },
    {
      label: "Stage 3",
      title: "Verification",
      body: "A small model answers one question: is this the same event? Anything short of a clear yes stops.",
    },
  ],
  rules: [
    "Closed or resolved markets never get a chip",
    "A missing price shows “see odds”, never a guess",
    "Results are cached per tweet for 24 hours",
    "Market titles come from the hydrated catalog, not empty API fields",
  ],
  targets: {
    label: "Design targets",
    items: [
      { value: "≥ 80%", caption: "precision on 50 labeled tweets" },
      { value: "< 4", caption: "clicks from chip to trade" },
      { value: "7+", caption: "Panta API capabilities used" },
    ],
    note: "Targets we are building toward. Measured results are published from `pnpm eval`.",
  },
} as const;

export const trade = {
  eyebrow: "Trade",
  title: "From the chip to a position, in a few clicks.",
  body: "Trades are signed on a hosted page opened as a popup. Phantom does not inject into extension pages, so signing never happens inside the extension.",
  steps: [
    { title: "Pick a side", body: "Choose YES or NO and an amount in USDC." },
    { title: "Get a quote", body: "Sorot asks Panta for a quote before you commit." },
    { title: "Sign in Phantom", body: "Panta builds the transaction. You review and sign it in your own wallet." },
    { title: "Track and claim", body: "Your position shows on the positions page, with a claim button once a market resolves." },
  ],
} as const;

export const features = {
  eyebrow: "Features",
  title: "Everything the argument needs.",
  items: [
    {
      title: "Odds chip",
      body: "Market title, YES and NO odds, and a “Powered by Panta” label, right under the tweet.",
    },
    {
      title: "Verified matches",
      body: "A three-stage pipeline with a labeled evaluation set. Precision is measured, not assumed.",
    },
    {
      title: "Trade from the tweet",
      body: "Quote, build, sign and confirm from a popup opened by the chip.",
    },
    {
      title: "Positions and claims",
      body: "See open positions for your wallet and claim winnings from resolved markets.",
    },
    {
      title: "Trade attribution",
      body: "Every trade is attributed to Sorot through the Panta API.",
    },
    {
      title: "Read-only mode",
      body: "Hide trade buttons and keep only the odds.",
      badge: "Planned",
    },
  ],
} as const;

export const security = {
  eyebrow: "Security",
  title: "Built so you do not have to trust us with keys.",
  body: "The extension only reads tweets and draws chips. Everything sensitive lives somewhere else, on purpose.",
  items: [
    {
      title: "Panta key stays on the server",
      body: "The browser talks to Sorot's backend, which proxies an allowlist of Panta routes. The key never ships in the extension.",
    },
    {
      title: "No wallet keys, ever",
      body: "Sorot never stores keys or seed phrases. Signing happens in Phantom on the hosted trade page.",
    },
    {
      title: "Minimal permissions",
      body: "Host access is limited to x.com and the Sorot backend, plus local storage. Nothing else.",
    },
    {
      title: "Honest numbers",
      body: "Chips show only what the Panta API returned. Backend text is rendered as plain text, never as HTML.",
    },
  ],
} as const;

export const pantaApi = {
  eyebrow: "Panta API",
  title: "Panta, end to end.",
  body: "Sorot uses the catalog, market detail, trades, quotes, transaction building, positions, claims and attribution.",
  rows: [
    { route: "GET /markets/", use: "Catalog sync" },
    { route: "GET /markets/{id}/", use: "Chip odds and market detail" },
    { route: "GET /markets/{id}/trades/", use: "Recent activity on the trade page" },
    { route: "POST /primaryorderquote/", use: "Quote before buying" },
    { route: "POST /primaryorderbuild/", use: "Transaction to sign" },
    { route: "GET /positions/?wallet=", use: "Positions and claim status" },
    { route: "Claim build", use: "Claim winnings" },
    { route: "Trade attribution", use: "Every trade attributed to Sorot" },
  ],
} as const;

export const install = {
  eyebrow: "Install",
  title: "Add Sorot to Chrome.",
  body: "Works in Chrome and Chromium browsers. A packaged release and store listing are on the way. Until then, build it from source in four steps.",
  steps: [
    { title: "Clone and install", code: "pnpm install" },
    { title: "Build the extension", code: "pnpm --filter extension build" },
    { title: "Load unpacked", code: "chrome://extensions → Developer mode → Load unpacked → extension/dist" },
    { title: "Open x.com", code: "Chips appear under matching tweets" },
  ],
} as const;

export const faq = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  items: [
    {
      q: "Does Sorot hold my funds or keys?",
      a: "No. Sorot never stores wallet keys or seed phrases. You sign every transaction in Phantom.",
    },
    {
      q: "Do I need an account?",
      a: "No sign-up. You connect Phantom on the trade page only when you want to trade.",
    },
    {
      q: "Is it real money?",
      a: "Yes. Panta runs on Solana mainnet only, with no testnet, so trades use real USDC. Only trade what you can afford to lose.",
    },
    {
      q: "Why is there no chip under a tweet?",
      a: "Sorot is precision-first. If the match is not a clear yes, it shows nothing. Closed and resolved markets never get a chip.",
    },
    {
      q: "Which sites does it run on?",
      a: "Only x.com, in Chrome and Chromium-based browsers.",
    },
    {
      q: "Can I use it in Indonesia?",
      a: "Sorot is not offered or promoted for real-money trading in Indonesia.",
    },
    {
      q: "Does Sorot create markets?",
      a: "No. Creating a Panta market costs real USDC, so it would only ever happen after you explicitly approve the fee. It is not part of the current release.",
    },
    {
      q: "Is this financial advice?",
      a: "No. Odds come from Panta markets and can be wrong. Trading carries a risk of loss.",
    },
  ],
} as const;

export const footer = {
  ctaTitle: "Odds where the argument is.",
  ctaBody: "Add Sorot, scroll X, and see which takes have a market behind them.",
  built: "Built for the Panta API sidetrack at the Colosseum Crypto World's Fair.",
  disclaimer:
    "Odds in previews on this page are illustrative. Live chips only show data returned by the Panta API. Trading involves risk of loss and is not financial advice.",
  links: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Matching", href: "#matching" },
    { label: "Security", href: "#security" },
    { label: "Install", href: "#install" },
    { label: "Panta docs", href: "https://docs.panta.market" },
  ],
} as const;
