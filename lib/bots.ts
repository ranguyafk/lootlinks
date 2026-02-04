const botPatterns = [
  /bot/i,
  /spider/i,
  /crawler/i,
  /curl/i,
  /wget/i,
  /facebookexternalhit/i,
  /slurp/i,
  /bingpreview/i,
  /monitor/i,
  /headless/i,
  /phantomjs/i,
  /puppeteer/i,
]

export function isLikelyBot(userAgent: string): boolean {
  if (!userAgent) return true
  return botPatterns.some((rx) => rx.test(userAgent))
}
