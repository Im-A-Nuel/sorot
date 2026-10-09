/**
 * The only file that knows Panta's base URL and route paths. All routes keep the trailing slash.
 * Confirmed in the Panta docs: base URL, X-Api-Key auth, quote, build, submit, verify, claim build and trade report.
 * Inferred from public integrations and still to be checked with a real key: the catalog and positions paths.
 */

export const PANTA_BASE_URL = "https://live-api.panta.market/api/v1";

const enc = encodeURIComponent;

export const routes = {
  markets: () => "/markets/",
  market: (id: string) => `/markets/${enc(id)}/`,
  marketTrades: (id: string) => `/markets/${enc(id)}/trades/`,
  orderQuote: () => "/primaryorderquote/",
  orderBuild: () => "/primaryorderbuild/",
  orderSubmit: () => "/primaryordersubmit/",
  orderVerify: () => "/primaryorderverify/",
  positions: () => "/positions/",
  claimBuild: () => "/claim/build/",
  tradesReport: () => "/trades/",
} as const;

/** The proxy only ever calls these shapes. Anything else is refused before a request is made. */
const ALLOWED: RegExp[] = [
  /^\/markets\/$/,
  /^\/markets\/[^/]+\/$/,
  /^\/markets\/[^/]+\/trades\/$/,
  /^\/primaryorderquote\/$/,
  /^\/primaryorderbuild\/$/,
  /^\/primaryordersubmit\/$/,
  /^\/primaryorderverify\/$/,
  /^\/positions\/$/,
  /^\/claim\/build\/$/,
  /^\/trades\/$/,
];

export function isAllowedPath(path: string): boolean {
  const [pathname] = path.split("?");
  return ALLOWED.some((re) => re.test(pathname));
}
