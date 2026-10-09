export const content = {
  brand: "Sorot",
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Matching", href: "#matching" },
    { label: "Security", href: "#security" },
    { label: "Panta API", href: "#panta" },
  ],
  secondaryLink: { label: "FAQ", href: "#faq" },
  primaryLink: { label: "Install guide", href: "#install" },
  headline: ["See the odds,", "trade the take."],
  subtitle:
    "Sorot puts Panta odds right under the tweets people argue about. Click the chip, get a quote, and sign with Phantom in a small popup.",
  cta: { label: "Install guide", href: "#install" },
  // Illustrative hero preview only. Live chips never show numbers that did not come from the Panta API.
  cards: {
    a: { name: "SOL > $300", symbol: "by Oct 31", price: "YES 0.62", change: "NO 0.38" },
    b: { name: "ETH > $5,000", symbol: "by Dec 31", price: "see odds", change: "" },
  },
} as const;

export const trust = {
  line: "Reads x.com in Chrome. Markets and quotes from Panta. Signing in Phantom on Solana.",
  status:
    "Early build. The extension, trade page and positions page run on demo data. Live matching and mainnet trading connect when the backend ships.",
  note: "Prices in previews on this page are illustrative. A live chip only shows what the Panta API returned.",
} as const;

export const problem = {
  eyebrow: "The gap",
  title: "Prediction markets are a destination. The argument isn't.",
  body: "People rarely open a market page to argue about an event. They argue on X. Sorot brings the market to the argument.",
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
} as const;

export const matching = {
  eyebrow: "Matching",
  title: "Precision over recall.",
  body: "One wrong chip costs more trust than ten tweets without one. Every stage can stop the pipeline, and only a clear yes shows a chip.",
  stages: [
    {
      title: "Entity prefilter",
      body: "Tickers, names and dates in the tweet must overlap with a market in the catalog.",
      outcome: "No overlap: stop, no chip",
    },
    {
      title: "Embedding similarity",
      body: "The tweet is compared with every market title. Only the top match above the threshold moves on.",
      outcome: "Below threshold: stop, no chip",
    },
    {
      title: "Verification",
      body: "A small model answers one question: is this the same event? Anything short of a clear yes stops.",
      outcome: "Clear yes: chip",
    },
  ],
  rules: [
    "Closed or resolved markets never get a chip.",
    "A missing price shows “see odds”, never a guess.",
    "Results are cached per tweet for 24 hours.",
    "Titles come from the hydrated catalog, because many API titles are empty.",
  ],
  targets: [
    { value: "≥ 80%", caption: "precision on 50 labeled tweets" },
    { value: "< 4", caption: "clicks from chip to trade" },
  ],
  targetsNote:
    "Targets, not results. The backend pipeline is still being built, and the extension uses labeled demo fixtures until it ships. Measured precision will come from pnpm eval.",
} as const;

export const trade = {
  eyebrow: "Trade",
  title: "From the chip to a position, in a few clicks.",
  body: "Trades are signed on a hosted page opened as a popup. Phantom does not inject into extension pages, so signing never happens inside the extension.",
  left: [
    { title: "Pick a side", body: "Choose YES or NO and an amount in USDC." },
    {
      title: "Get a quote",
      body: "Panta simulates the fill and the fee. A quote lives for about 90 seconds, so the popup counts it down.",
    },
  ],
  right: [
    {
      title: "Sign in Phantom",
      body: "Panta builds the instructions, you review and sign in your own wallet, and the signature is sent to Panta.",
    },
    {
      title: "Track and claim",
      body: "Your position shows on the positions page, with a claim button once a market resolves.",
    },
  ],
} as const;

export const features = {
  eyebrow: "Features",
  title: "Everything the argument needs.",
  flagship: {
    title: "Odds chip",
    status: "Demo data",
    body: "Market title, YES and NO odds, and a “Powered by Panta” label, right under the tweet. When a price is missing, the chip says “see odds” instead of guessing.",
  },
  items: [
    {
      title: "Verified matches",
      status: "In progress",
      body: "A three-stage check: entity prefilter, embedding similarity, yes/no verification. Precision gets measured on 50 labeled tweets before it is claimed.",
    },
    {
      title: "Trade from the tweet",
      status: "Demo data",
      body: "Quote, sign and confirm from a popup opened by the chip. The popup is built. It runs on demo data until the backend connects.",
    },
    {
      title: "Positions and claims",
      status: "Demo data",
      body: "Open positions for your wallet and a claim button for resolved markets. The page is built and runs on demo data.",
    },
    {
      title: "Trade attribution",
      status: "Planned",
      body: "Every trade will be reported to Panta with Sorot's attribution id, so Panta can see the volume Sorot brings.",
    },
    {
      title: "Read-only mode",
      status: "Planned",
      body: "Hide trade buttons and keep only the odds.",
    },
  ],
} as const;

export const security = {
  eyebrow: "Security",
  title: "Built so you do not have to trust us with keys.",
  body: "The extension only reads tweets and draws chips. Everything sensitive lives somewhere else, on purpose. The backend half is still being built. The extension and trade pages already follow this design.",
  flow: [
    { name: "Extension", role: "Reads tweets, draws chips. Holds no keys." },
    { name: "Sorot backend", role: "Holds the Panta key. Proxies an allowlist of routes." },
    { name: "Phantom", role: "Signs every transaction on the hosted trade page." },
  ],
  items: [
    {
      title: "Panta key stays on the server",
      body: "The browser talks to Sorot's backend. The key never ships in the extension, and a build check greps the bundle for it.",
    },
    {
      title: "No wallet keys, ever",
      body: "Sorot never stores keys or seed phrases. You approve each transaction in Phantom.",
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
  body: "The Panta routes the Sorot backend is being built around: catalog, quotes, transaction building, signature submission, verification, positions, claims and trade reporting.",
  note: "* Path taken from public integrations. It gets confirmed when the Panta API key is issued.",
  rows: [
    { route: "GET /markets/", use: "Catalog sync" },
    { route: "GET /markets/{id}/", use: "Chip odds and market detail", unconfirmed: true },
    { route: "POST /primaryorderquote/", use: "Quote, valid for about 90 seconds" },
    { route: "POST /primaryorderbuild/", use: "Instructions to sign, with slippage limit" },
    { route: "POST /primaryordersubmit/", use: "Register the signature" },
    { route: "POST /primaryorderverify/", use: "Check the trade status" },
    { route: "GET /positions/?wallet=", use: "Positions and claimable flag", unconfirmed: true },
    { route: "POST /claim/build/", use: "Instructions to claim winnings" },
    { route: "POST /trades/", use: "Report a trade for attribution" },
  ],
} as const;

export const install = {
  eyebrow: "Install",
  title: "Try Sorot from source.",
  body: "Sorot is not on the Chrome Web Store yet and there is no packaged release. For now you build it and load it as an unpacked extension. This build matches tweets against a few labeled demo fixtures, not live Panta data. Needs Node 20+ and pnpm 9+.",
  commands: [
    { label: "Clone the repository", code: "git clone https://github.com/Im-A-Nuel/sorot.git" },
    { label: "Install dependencies", code: "pnpm install" },
    { label: "Build the extension", code: "pnpm --filter extension build" },
    { label: "Serve the trade page on localhost:3000", code: "pnpm dev" },
  ],
  steps: [
    "Open chrome://extensions and turn on Developer mode.",
    "Choose Load unpacked and select the extension/dist folder.",
    "Open x.com. A tweet that mentions SOL and 300, or ETH and 5k, gets a chip labeled Demo. Clicking it opens the trade page.",
  ],
} as const;

export const faq = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  items: [
    {
      q: "What works today?",
      a: "The extension, the trade page and the positions page are built and run on demo data. Live matching, Panta quotes and mainnet signing connect when the backend ships. Nothing in the current build moves real money.",
    },
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
      a: "Once Sorot is connected to Panta, yes. Panta runs on Solana mainnet only, with no testnet, so trades use real USDC. Only trade what you can afford to lose. The current demo build does not move any money.",
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
  ctaBody: "Load Sorot, scroll X, and see which takes have a market behind them.",
  built: "Built for the Panta API sidetrack at the Colosseum Crypto World's Fair.",
  disclaimer:
    "Odds in previews on this page are illustrative. Live chips only show data returned by the Panta API. Trading involves risk of loss and is not financial advice.",
  links: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Matching", href: "#matching" },
    { label: "Security", href: "#security" },
    { label: "Install", href: "#install" },
    { label: "Positions", href: "/positions" },
    { label: "Panta docs", href: "https://docs.panta.market" },
  ],
} as const;
