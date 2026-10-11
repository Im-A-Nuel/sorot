export const content = {
  brand: "Sorot",
  nav: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Matching", href: "#matching" },
    { label: "Security", href: "#security" },
    { label: "Panta API", href: "#panta" },
  ],
  secondaryLink: { label: "FAQ", href: "#faq" },
  appLinks: [{ label: "Positions", href: "/positions" }],
  mobileExtras: [
    { label: "Try the trade page", href: "/t/open" },
    { label: "Positions", href: "/positions" },
  ],
  primaryLink: { label: "Install guide", href: "#install" },
  headline: ["See the odds,", "trade the take."],
  subtitle:
    "Sorot puts Panta odds right under the tweets people argue about. Click the chip, get a quote, and sign with Phantom in a small popup.",
  cta: { label: "Install guide", href: "#install" },
  secondaryCta: { label: "Try the trade page", href: "/t/open" },
  // Illustrative hero preview only. Live chips never show numbers that did not come from the Panta API.
  cards: {
    a: { name: "SOL > $300", symbol: "by Oct 31", price: "YES 0.62", change: "NO 0.38" },
    b: { name: "ETH > $5,000", symbol: "by Dec 31", price: "see odds", change: "" },
  },
} as const;

export const trust = {
  // The status box reads /api/health, so it always says what this deployment is really connected to.
  status: {
    live: "Early build, connected to live Panta markets. Trades use real USDC on Solana mainnet. Only a few markets are open at any time, so most tweets get no chip, and matching precision has not been measured on real tweets yet.",
    sandbox:
      "Early build in Panta sandbox mode: one fake market, and nothing touches mainnet. Switch to a pk_live_ key for real markets.",
    fixture:
      "Early build running on built-in demo data. Nothing is sent to Panta. Connect a Panta API key to use live markets.",
  },
  note: "Prices in previews on this page are illustrative. A live chip only shows what the Panta API returned.",
} as const;

export const how = {
  eyebrow: "How it works",
  title: "Odds under the tweet. One click to trade.",
  body: "People argue on X, not on market sites. Sorot brings the market to the argument. There is no sign-up and no account: your Phantom wallet is your login.",
  steps: [
    {
      title: "Install the extension",
      body: "Load it in Chrome from source. It adds a small chip under matching tweets on x.com.",
      link: { label: "Install guide", href: "#install" },
    },
    {
      title: "Scroll X as usual",
      body: "When a tweet matches a Panta market, the odds appear under it. No match, nothing on screen.",
    },
    {
      title: "Click the chip",
      body: "A trade window opens. Pick YES or NO, get a quote from Panta, and approve it.",
      link: { label: "Open a trade page", href: "/t/open" },
    },
    {
      title: "Sign in Phantom",
      body: "You review and sign in your own wallet. Your positions, and a claim button once a market resolves, live on the positions page.",
      link: { label: "Open positions", href: "/positions" },
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
      body: "Tickers, names and dates in the tweet must overlap with a market.",
      outcome: "No overlap: no chip",
    },
    {
      title: "Embedding similarity",
      body: "The tweet is compared with every market title. Only the best match above a threshold moves on.",
      outcome: "Below threshold: no chip",
    },
    {
      title: "Verification",
      body: "A final check answers one question: is this the same event? Anything short of a clear yes stops.",
      outcome: "Clear yes: chip",
    },
  ],
  rules: "Closed or resolved markets never get a chip, and a missing price shows “see odds”, never a guess.",
  targetsNote:
    "Target: at least 80% precision on 50 labeled tweets. Not measured yet. The number will come from pnpm eval.",
} as const;

export const security = {
  eyebrow: "Security",
  title: "Built so you do not have to trust us with keys.",
  body: "The extension only reads tweets and draws chips. The Panta key stays on the server, and every transaction is signed in your own Phantom.",
  flow: [
    { name: "Extension", role: "Reads tweets and draws chips. Holds no keys." },
    { name: "Sorot API", role: "Holds the Panta key. Calls only an allowlist of Panta routes." },
    { name: "Phantom", role: "Signs every transaction on the hosted trade page." },
  ],
  note: "Sorot never stores wallet keys or seed phrases. Host access is limited to x.com and the Sorot API. Chips show only what Panta returned.",
} as const;

export const pantaApi = {
  eyebrow: "Panta API",
  title: "Panta, end to end.",
  body: "From catalog to claim, these are the Panta routes the Sorot API calls, and the only ones it will call.",
  stops: [
    { route: "GET /markets/", use: "Catalog and market detail" },
    { route: "POST /primaryorderquote/", use: "Quote, valid for about 90 seconds" },
    { route: "POST /primaryorderbuild/", use: "Instructions to sign, with a slippage limit" },
    { route: "POST /primaryordersubmit/", use: "Register the signature, then check it with /primaryorderverify/" },
    { route: "GET /positions/", use: "Positions, and POST /claim/build/ for winnings" },
    { route: "POST /trades/", use: "Report the trade for Sorot attribution" },
  ],
} as const;

export const install = {
  eyebrow: "Install",
  title: "Try Sorot from source.",
  body: "Sorot is not on the Chrome Web Store yet. Build it and load it as an unpacked extension. You need Node 20.12+ and pnpm 9+.",
  commands: [
    { label: "Clone the repository", code: "git clone https://github.com/Im-A-Nuel/sorot.git" },
    { label: "Install dependencies", code: "pnpm install" },
    { label: "Build the extension against the local API", code: "pnpm --filter extension build:local" },
    { label: "Run the app and API on localhost:3000", code: "pnpm dev" },
  ],
  steps: [
    "Open chrome://extensions and turn on Developer mode.",
    "Choose Load unpacked and select the extension/dist folder.",
    "Open x.com. A tweet that mentions SOL and 300, or ETH and 5k, gets a chip labeled Demo.",
  ],
} as const;

export const faq = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  items: [
    {
      q: "What works today?",
      a: "The extension, the trade page, the positions page and the API are built and connected to live Panta markets. Matching is tested on synthetic tweets, and the wallet signing step is still being verified with a real trade. The status box under the hero shows what this site is connected to.",
    },
    {
      q: "Where do I connect my wallet and see my positions?",
      a: "There is no sign-up and no account. You connect Phantom on the trade page the first time you trade, and on the positions page. Both have a Connect Phantom button in the header, and the positions page is linked from the trade window and the extension popup.",
    },
    {
      q: "Does Sorot hold my funds or keys?",
      a: "No. Sorot never stores wallet keys or seed phrases. You sign every transaction in Phantom.",
    },
    {
      q: "Is it real money?",
      a: "Yes, when this site is connected to live Panta markets. Panta runs on Solana mainnet only, so trades use real USDC. Only trade what you can afford to lose. Odds can be wrong and nothing here is financial advice. In sandbox or demo mode no real money moves, and the status box says so.",
    },
    {
      q: "Why is there no chip under a tweet?",
      a: "Sorot is precision-first. If the match is not a clear yes, it shows nothing. Closed and resolved markets never get a chip, and only a few Panta markets are open at a time.",
    },
    {
      q: "Can I use it in Indonesia?",
      a: "Sorot is not offered or promoted for real-money trading in Indonesia.",
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
