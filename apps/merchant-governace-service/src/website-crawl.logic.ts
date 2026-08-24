import axios from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import { randomUUID } from 'crypto';
import { TLSSocket } from 'tls';
import { calculateWebsiteScore } from './website-score';

export type MerchantProfile = {
  companyName?: string;
  address?: string;
  email?: string;
  mobile?: string;
};

export type WebsiteContent = {
  statusCode: number;
  content: string | null;
  visibleText?: string;
  complianceFlags?: {
    hasPrivacyPolicy?: boolean;
    hasTerms?: boolean;
    isRbiCompliant?: boolean;
    isPciDss?: boolean;
  };
  url: string;
  error?: string;
};

export type ContactInfo = {
  emails?: string[];
  phones?: string[];
  addresses?: string[];
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CRAWL_DELAY_MS = Number(process.env.CRAWL_DELAY_MS || 1000);
const lastCrawl = new Map<string, number>();

export async function crawlWebsite(opts: {
  merchantId: string;
  websiteUrl: string;
  merchant?: MerchantProfile;
}) {
  const url = new URL(opts.websiteUrl);
  const domain = url.hostname;
  const robotsAllowed = await checkRobotsTxt(opts.websiteUrl);

  if (!robotsAllowed) {
    throw new Error(`Crawling disallowed by robots.txt for ${opts.websiteUrl}`);
  }

  await enforceRateLimit(domain);

  const sslStatus = await checkSslStatus(domain);
  const domainAge = await getDomainAge(domain);
  const websiteContent = await fetchWebsiteContent(opts.websiteUrl);
  const contactInfo = extractContactInfo(websiteContent);
  const businessMatch = checkBusinessMatch(opts.merchant, websiteContent);
  const anomalies = detectAnomalies(websiteContent, sslStatus, domainAge);
  const policiesFound = detectPolicies(websiteContent);
  const complianceFlags = websiteContent.complianceFlags || {};
  const score = calculateWebsiteScore({
    websiteContent,
    sslStatus,
    domainAge,
    businessMatch,
    anomalies,
    policiesFound,
    complianceFlags,
  });

  const latestCrawl = {
    logId: randomUUID(),
    merchantId: opts.merchantId,
    domain,
    websiteUrl: opts.websiteUrl,
    sslStatus,
    domainAge: domainAge ?? undefined,
    contactInfoExtracted: contactInfo,
    complianceFlags,
    businessMatch,
    anomalies,
    policiesFound,
    websiteScore: score.finalScore,
    scoreBreakdown: score.breakdown,
    crawledAt: new Date(),
    rawResponse: {
      statusCode: websiteContent.statusCode,
      url: websiteContent.url,
      complianceFlags,
      error: websiteContent.error,
    },
  };

  return {
    merchantId: opts.merchantId,
    latestCrawl,
    websiteScore: score.finalScore,
    alerts: [] as string[],
  };
}

async function checkRobotsTxt(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.protocol}//${parsed.hostname}/robots.txt`;
    const res = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: () => true,
    });
    if (res.status === 404 || !res.data) {
      return true;
    }
    return parseRobotsTxt(String(res.data), targetUrl);
  } catch {
    return true;
  }
}

function parseRobotsTxt(content: string, targetUrl: string): boolean {
  const path = new URL(targetUrl).pathname;
  let currentUa = '*';
  let allowed = true;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const lower = line.toLowerCase();
    if (lower.startsWith('user-agent:')) {
      const agent = line.slice(11).trim().toLowerCase();
      currentUa =
        agent === '*' || USER_AGENT.toLowerCase().includes(agent) ? agent : '';
      if (currentUa) {
        allowed = true;
      }
      continue;
    }
    if (!currentUa) {
      continue;
    }
    if (lower.startsWith('disallow:')) {
      const p = line.slice(9).trim();
      if (p && path.startsWith(p)) {
        return false;
      }
    }
    if (lower.startsWith('allow:')) {
      const p = line.slice(6).trim();
      if (p && path.startsWith(p)) {
        allowed = true;
      }
    }
  }

  return allowed;
}

async function enforceRateLimit(domain: string) {
  const last = lastCrawl.get(domain);
  if (last) {
    const wait = CRAWL_DELAY_MS - (Date.now() - last);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  lastCrawl.set(domain, Date.now());
}

function checkSslStatus(domain: string): Promise<string> {
  return new Promise((resolve) => {
    const req = https.request(
      { hostname: domain, port: 443, method: 'HEAD', rejectUnauthorized: false },
      (res) => {
        const socket = res.socket as TLSSocket;
        resolve(socket.authorized === true ? 'Valid' : 'Invalid');
      },
    );
    req.on('error', () => resolve('Error'));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve('Timeout');
    });
    req.end();
  });
}

async function getDomainAge(domain: string): Promise<number | null> {
  const whois = process.env.WHOIS_API_URL;
  if (!whois) {
    return null;
  }

  try {
    const res = await axios.get(`${whois.replace(/\/$/, '')}/whois/${domain}`, {
      timeout: 5000,
    });
    if (!res.data?.creationDate) {
      return null;
    }
    const days = Math.floor(
      (Date.now() - new Date(res.data.creationDate).getTime()) / 86400000,
    );
    return days > 0 ? days : null;
  } catch {
    return null;
  }
}

async function fetchWebsiteContent(
  url: string,
  retry = 0,
): Promise<WebsiteContent> {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    const html = String(res.data || '');
    const $ = cheerio.load(html);
    const visibleText = $('body').text();

    return {
      statusCode: res.status,
      content: html,
      visibleText,
      complianceFlags: {
        hasPrivacyPolicy:
          $('a:contains("Privacy")').length > 0 ||
          $('a:contains("privacy")').length > 0,
        hasTerms:
          $('a:contains("Terms")').length > 0 ||
          $('a:contains("terms")').length > 0,
        isRbiCompliant:
          visibleText.includes('RBI Compliant') ||
          visibleText.includes('RBI P.A.'),
        isPciDss: visibleText.includes('PCI DSS'),
      },
      url: res.request?.res?.responseUrl || url,
    };
  } catch (err: unknown) {
    if (retry < 3) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** retry * 1000));
      return fetchWebsiteContent(url, retry + 1);
    }

    const axiosError = err as {
      response?: { status?: number };
      message?: string;
    };
    return {
      statusCode: axiosError.response?.status || 0,
      content: null,
      error: axiosError.message,
      url,
    };
  }
}

function extractContactInfo(wc: WebsiteContent): ContactInfo | null {
  if (!wc?.content) {
    return null;
  }

  const content = String(wc.content);
  const info: ContactInfo = {};
  const emails = new Set<string>();

  for (const match of content.matchAll(/[\w.-]+@[\w.-]+\.\w+/g)) {
    const email = match[0].replace(/^mailto:/i, '');
    if (!email.includes('example.com') && !email.includes('test.com')) {
      emails.add(email);
    }
  }
  if (emails.size) {
    info.emails = [...emails];
  }

  const phones = new Set<string>();
  for (const match of content.matchAll(/(\+91[\s-]?)?[6-9]\d{9}/g)) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      phones.add(digits);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      phones.add(digits);
    }
  }
  if (phones.size) {
    info.phones = [...phones];
  }

  const addresses = new Set<string>();
  for (const match of content.matchAll(/"streetAddress"\s*:\s*"([^"]+)"/gi)) {
    addresses.add(match[1].trim());
  }
  if (!addresses.size && wc.visibleText) {
    const footerBits = wc.visibleText
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (text) =>
          text.length > 20 &&
          (text.includes('Office') ||
            text.includes('Bldg') ||
            text.includes('Road')),
      );
    for (const text of footerBits.slice(0, 5)) {
      addresses.add(text.replace(/\s+/g, ' '));
    }
  }
  if (addresses.size) {
    info.addresses = [...addresses];
  }

  return Object.keys(info).length ? info : null;
}

function checkBusinessMatch(
  merchant: MerchantProfile | undefined,
  wc: WebsiteContent,
): boolean {
  if (!merchant || !wc?.content) {
    return false;
  }

  const content = String(wc.content).toLowerCase();
  let score = 0;
  let total = 0;
  const keywords = (merchant.companyName || '')
    .toLowerCase()
    .replace(/\b(pvt|ltd|limited|inc|incorporated|llp|llc)\b/gi, '')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  if (keywords.length) {
    total += 1;
    if (keywords.some((keyword) => content.includes(keyword))) {
      score += 1;
    }
  }

  if (merchant.email) {
    total += 1;
    if (content.includes(merchant.email.toLowerCase())) {
      score += 1;
    }
  }

  if (merchant.mobile) {
    total += 1;
    const last10 = merchant.mobile.replace(/\D/g, '').slice(-10);
    if (last10 && content.includes(last10)) {
      score += 1;
    }
  }

  if (merchant.address) {
    total += 1;
    const cityState = merchant.address
      .toLowerCase()
      .split(',')
      .slice(-2)
      .join(' ')
      .trim();
    if (cityState && content.includes(cityState)) {
      score += 1;
    }
  }

  return total > 0 && score / total >= 0.5;
}

function detectPolicies(wc: WebsiteContent): string[] {
  const found: string[] = [];
  const content = String(wc?.content || '').toLowerCase();
  if (
    content.includes('privacy policy') ||
    content.includes('privacy-policy') ||
    content.includes('privacy notice')
  ) {
    found.push('Privacy Policy');
  }
  if (
    content.includes('terms and conditions') ||
    content.includes('terms & conditions') ||
    content.includes('terms of service') ||
    content.includes('t&c')
  ) {
    found.push('Terms & Conditions');
  }
  if (
    content.includes('refund policy') ||
    content.includes('cancellation policy') ||
    content.includes('return policy')
  ) {
    found.push('Refund / Cancellation Policy');
  }
  if (
    content.includes('contact us') ||
    content.includes('contact-us') ||
    content.includes('get in touch')
  ) {
    found.push('Contact Us');
  }
  return found;
}

function detectAnomalies(
  wc: WebsiteContent,
  sslStatus: string,
  domainAge: number | null,
): string[] {
  const anomalies: string[] = [];
  if (sslStatus !== 'Valid') {
    anomalies.push('Invalid or missing SSL certificate');
  }
  if (!wc.statusCode || wc.statusCode >= 400) {
    anomalies.push('Website is down or inaccessible');
  }
  if (!wc.content) {
    anomalies.push('No content found on website');
  }
  if (domainAge != null && domainAge < 30) {
    anomalies.push('Domain is very new (less than 30 days old)');
  }

  const content = String(wc.content || '').toLowerCase();
  if (content.includes('under construction') || content.includes('coming soon')) {
    anomalies.push('Website appears to be under construction');
  }
  if (
    content.includes('login required') ||
    content.includes('member login') ||
    content.includes('subscription required') ||
    content.includes('paywall')
  ) {
    anomalies.push(
      'Website may require login or subscription (compliance: only public pages should be crawled)',
    );
  }
  if (content.includes('captcha') || content.includes('recaptcha')) {
    anomalies.push('Website uses CAPTCHA (compliance: do not bypass CAPTCHA)');
  }
  if (wc.url && /\/login|\/signin|\/auth/.test(wc.url)) {
    anomalies.push(
      'Redirected to login page (compliance: only public pages should be crawled)',
    );
  }
  return anomalies;
}
