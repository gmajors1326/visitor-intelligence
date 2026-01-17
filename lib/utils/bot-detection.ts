import { UAParser } from 'ua-parser-js';

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /java/i,
  /go-http/i,
  /httpclient/i,
  /okhttp/i,
  /scrapy/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /duckduckbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
];

const AI_PATTERNS = [
  /openai/i,
  /anthropic/i,
  /claude/i,
  /gpt/i,
  /chatgpt/i,
  /perplexity/i,
  /cohere/i,
  /ai21/i,
  /character\.ai/i,
  /you\.com/i,
  /phind/i,
  /bingchat/i,
  /copilot/i,
];

export interface BotDetectionResult {
  isBot: boolean;
  isAI: boolean;
  botName?: string;
  deviceType: string;
  browser?: string;
  os?: string;
}

export function detectBot(userAgent: string | null, headers: Record<string, string> = {}): BotDetectionResult {
  const ua = userAgent || '';
  const uaLower = ua.toLowerCase();
  
  // Check for AI patterns first
  let isAI = false;
  let aiName: string | undefined;
  
  for (const pattern of AI_PATTERNS) {
    if (pattern.test(ua)) {
      isAI = true;
      const match = ua.match(pattern);
      if (match) {
        aiName = match[0];
      }
      break;
    }
  }
  
  // Check for bot patterns
  let isBot = false;
  let botName: string | undefined;
  
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(ua)) {
      isBot = true;
      const match = ua.match(pattern);
      if (match) {
        botName = match[0];
      }
      break;
    }
  }
  
  // Additional checks via headers
  if (!isBot) {
    const viaHeader = headers['via'] || headers['x-forwarded-for'];
    if (viaHeader && /bot|crawler|spider/i.test(viaHeader)) {
      isBot = true;
    }
  }
  
  // Parse user agent for device info
  const parser = new UAParser(ua);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();
  
  let deviceType = 'desktop';
  if (device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (device.type === 'tablet') {
    deviceType = 'tablet';
  }
  
  return {
    isBot: isBot || isAI,
    isAI,
    botName: botName || aiName,
    deviceType,
    browser: browser.name ? `${browser.name} ${browser.version || ''}`.trim() : undefined,
    os: os.name ? `${os.name} ${os.version || ''}`.trim() : undefined,
  };
}
