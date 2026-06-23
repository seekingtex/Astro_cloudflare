import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import yaml from 'js-yaml';

import { verifyAnswer, cookieName, generateChallenge, buildCookieValue, cookieTtlSeconds } from '~/lib/contact-captcha';
import {
  encryptJson,
  getSubmissionsPath,
  readSubmissionsFile,
  emptySubmissionsFile,
  type SubmissionRecord,
  type EncryptedBlob,
} from '~/lib/contact-crypto';
import { GitHubClient } from '~/lib/github';
import { checkRateLimit, DEFAULT_LIMITS } from '~/lib/rate-limit';
import brandingData from '~/data/site/branding.yaml';

export const prerender = false;

const SUBMISSIONS_PATH = getSubmissionsPath();

interface IncomingPayload {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  address?: string;
  zip?: string;
  country?: string;
  email?: string;
  tel?: string;
  subject?: string;
  message?: string;
  email_to?: string;
  captcha_answer?: string;
  email_confirm?: string;
  consent?: string | boolean;
}

interface BrandingEmailConfig {
  site_name?: string;
  contact_email_to?: string;
  contact_email_provider?: 'resend' | 'none';
  contact_resend_api_key?: string;
  contact_from_email?: string;
  contact_from_name?: string;
  contact_submissions_pat?: string;
  github_pat?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPAM_KEYWORDS = /\b(viagra|cialis|crypto airdrop|investment opportunity|casino|betting)\b/i;

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function err(message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ success: false, error: message, ...extra }, status);
}

function ok(extra: Record<string, unknown> = {}): Response {
  return jsonResponse({ success: true, ...extra }, 200);
}

function sanitize(value: unknown, maxLen = 2000): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLen);
}

async function loadBranding(): Promise<BrandingEmailConfig> {
  return (brandingData as BrandingEmailConfig) ?? {};
}

async function loadSubmissionsWith(token: string): Promise<{ sha: string; file: { v: 1; submissions: SubmissionRecord[] } }> {
  const client = new GitHubClient(token);
  const f = await client.readFile(SUBMISSIONS_PATH);
  let parsed: unknown = {};
  try { parsed = yaml.load(f.content); } catch { parsed = {}; }
  const file = readSubmissionsFile(parsed);
  return { sha: f.sha, file };
}

async function saveSubmissionsWith(
  token: string,
  file: { v: 1; submissions: SubmissionRecord[] },
  sha: string,
  message: string,
): Promise<void> {
  const client = new GitHubClient(token);
  const content = yaml.dump(file, { lineWidth: 120, noRefs: true, sortKeys: false });
  await client.updateFile(SUBMISSIONS_PATH, content, sha, message);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmailBody(data: Record<string, string>, receivedAt: string, ip: string | undefined, userAgent: string | undefined): { html: string; text: string; subject: string } {
  const labels: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    companyName: 'Company Name',
    address: 'Address',
    zip: 'Zip',
    country: 'Country',
    email: 'E-mail',
    tel: 'TEL',
    subject: 'Subject',
    message: 'Message',
  };
  const order = ['firstName', 'lastName', 'companyName', 'address', 'zip', 'country', 'email', 'tel', 'subject', 'message'];
  const rows = order
    .filter((k) => data[k])
    .map((k) => `<tr><td style="padding:6px 12px;background:#f3f4f6;font-weight:600;border:1px solid #e5e7eb;width:140px">${escapeHtml(labels[k] ?? k)}</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${escapeHtml(data[k]).replace(/\n/g, '<br/>')}</td></tr>`)
    .join('');
  const subjectText = data.subject || '(no subject)';
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  const subject = `[Contact form] ${subjectText}${fullName ? ` �?${fullName}` : ''}`;
  const html = `<!doctype html><html><body style="font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#111">
<div style="max-width:640px;margin:0 auto;padding:16px">
<h2 style="margin:0 0 4px">New contact form submission</h2>
<p style="margin:0 0 16px;color:#6b7280;font-size:13px">Received at ${escapeHtml(receivedAt)} (UTC)${ip ? ` · IP: ${escapeHtml(ip)}` : ''}</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
${userAgent ? `<p style="margin-top:16px;color:#6b7280;font-size:12px">User-Agent: ${escapeHtml(userAgent)}</p>` : ''}
</div>
</body></html>`;
  const textLines = [
    'New contact form submission',
    `Received at ${receivedAt} (UTC)${ip ? ` · IP: ${ip}` : ''}`,
    '',
    ...order.filter((k) => data[k]).map((k) => `${labels[k] ?? k}: ${data[k]}`),
    ...(userAgent ? ['', `User-Agent: ${userAgent}`] : []),
  ];
  return { html, text: textLines.join('\n'), subject };
}

async function sendEmailViaResend(
  apiKey: string,
  from: string,
  to: string,
  replyTo: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, reply_to: replyTo, subject, html, text }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, status: res.status, error: txt.slice(0, 500) };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'send failed' };
  }
}

async function readJson(request: Request): Promise<IncomingPayload | null> {
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      return (await request.json()) as IncomingPayload;
    }
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      const obj: Record<string, string> = {};
      for (const [k, v] of fd.entries()) {
        if (typeof v === 'string') obj[k] = v;
      }
      return obj as IncomingPayload;
    }
    const text = await request.text();
    if (text) {
      try { return JSON.parse(text) as IncomingPayload; } catch { return null; }
    }
  } catch {
    return null;
  }
  return null;
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const ip = (clientAddress as string) || request.headers.get('cf-connecting-ip') || '';
  const userAgent = request.headers.get('user-agent') || undefined;
  const rateKey = ip ? `contact:${ip}` : 'contact:unknown';
  const rl = checkRateLimit(rateKey, DEFAULT_LIMITS.contactForm);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Too many requests. Retry in ${rl.retryAfter}s.`,
        rateLimit: { limit: rl.limit, remaining: rl.remaining, retryAfter: rl.retryAfter },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      },
    );
  }

  const captchaCookie = cookies.get(cookieName())?.value;
  if (!verifyAnswer(captchaCookie, '')) {
    const next = generateChallenge();
    const cookie = buildCookieValue(next);
    cookies.set(cookieName(), cookie.value, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      expires: cookie.expires,
      maxAge: cookieTtlSeconds(),
    });
    return err('Please reload the contact page and complete the anti-spam check.', 400, { captcha: next.question, reload: true });
  }

  const body = await readJson(request);
  if (!body) return err('Invalid request format.', 400);

  const consentValue = body.consent;
  const consentAccepted = consentValue === true || consentValue === 'true' || consentValue === 'on' || consentValue === '1';
  if (!consentAccepted) {
    return err('Please confirm that you accept the Privacy Policy before submitting.', 400);
  }

  if (body.email_confirm && body.email_confirm.trim() !== '') {
    return ok({ id: '00000000-0000-0000-0000-000000000000', receivedAt: new Date().toISOString(), email: { attempted: false, sent: false } });
  }

  const fields = {
    firstName: sanitize(body.firstName, 100),
    lastName: sanitize(body.lastName, 100),
    companyName: sanitize(body.companyName, 200),
    address: sanitize(body.address, 400),
    zip: sanitize(body.zip, 40),
    country: sanitize(body.country, 100),
    email: sanitize(body.email, 200),
    tel: sanitize(body.tel, 60),
    subject: sanitize(body.subject, 200),
    message: sanitize(body.message, 4000),
  };

  if (!fields.firstName || !fields.lastName) return err('First Name and Last Name are required', 400);
  if (!fields.email) return err('E-mail is required', 400);
  if (!EMAIL_RE.test(fields.email)) return err('Invalid E-mail format', 400);
  if (!fields.message || fields.message.length < 5) return err('Message must be at least 5 characters', 400);
  if (SPAM_KEYWORDS.test(fields.message) || SPAM_KEYWORDS.test(fields.subject || '')) {
    return err('Content contains sensitive keywords, submission rejected', 400);
  }

  const captchaAnswer = sanitize(body.captcha_answer, 20);
  if (!verifyAnswer(captchaCookie, captchaAnswer)) {
    const next = generateChallenge();
    const cookie = buildCookieValue(next);
    cookies.set(cookieName(), cookie.value, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      expires: cookie.expires,
      maxAge: cookieTtlSeconds(),
    });
    return err('Anti-spam answer incorrect.', 400, { captcha: next.question, reload: true });
  }

  const branding = await loadBranding();
  const token = branding.contact_submissions_pat || (branding as any).github_pat;
  if (!token || typeof token !== 'string' || !token.startsWith('gh')) {
    return err('Contact form storage not configured: set contact_submissions_pat in /keystatic/branding (GitHub PAT with Contents R/W).', 500);
  }

  const destinationEmail = (sanitize(body.email_to, 200) || branding.contact_email_to || '').trim();
  if (!destinationEmail || !EMAIL_RE.test(destinationEmail)) {
    return err('Destination email not configured or invalid. Set email_to in /keystatic/branding or contact.yaml.', 500);
  }

  let submissionsFile: { v: 1; submissions: SubmissionRecord[] } = emptySubmissionsFile();
  let submissionsSha = '';
  try {
    const r = await loadSubmissionsWith(token);
    submissionsFile = r.file;
    submissionsSha = r.sha;
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status !== 404) {
      return err('Failed to read submissions storage: ' + (e instanceof Error ? e.message : 'unknown'), 500);
    }
  }

  const blob: EncryptedBlob = encryptJson(fields);
  const record: SubmissionRecord = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ip: ip || undefined,
    userAgent,
    blob,
  };
  submissionsFile.submissions.unshift(record);
  if (submissionsFile.submissions.length > 1000) {
    submissionsFile.submissions = submissionsFile.submissions.slice(0, 1000);
  }

  try {
    if (submissionsSha) {
      await saveSubmissionsWith(token, submissionsFile, submissionsSha, `Contact form: ${fields.subject || fields.firstName} (${record.id.slice(0, 8)})`);
    } else {
      const content = yaml.dump(submissionsFile, { lineWidth: 120, noRefs: true, sortKeys: false });
      const client = new GitHubClient(token);
      await client.createFile(SUBMISSIONS_PATH, content, `Contact form: ${fields.subject || fields.firstName} (${record.id.slice(0, 8)})`);
    }
  } catch (e) {
    return err('Failed to save submission to GitHub: ' + (e instanceof Error ? e.message : 'unknown'), 500);
  }

  let emailStatus: { attempted: boolean; sent: boolean; provider?: string; error?: string } = { attempted: false, sent: false };
  if (branding.contact_email_provider === 'resend' && branding.contact_resend_api_key && branding.contact_from_email) {
    emailStatus.attempted = true;
    const fromName = branding.contact_from_name || branding.site_name || 'Wavefella Contact';
    const from = `${fromName} <${branding.contact_from_email}>`;
    const { html, text, subject } = buildEmailBody(fields, record.receivedAt, record.ip, record.userAgent);
    const replyTo = `${fields.firstName} ${fields.lastName} <${fields.email}>`.trim();
    const r = await sendEmailViaResend(
      branding.contact_resend_api_key,
      from,
      destinationEmail,
      replyTo,
      subject,
      html,
      text,
    );
    emailStatus.sent = r.ok;
    emailStatus.provider = 'resend';
    if (!r.ok) emailStatus.error = r.error;
  }

  const next = generateChallenge();
  const cookie = buildCookieValue(next);
  cookies.set(cookieName(), cookie.value, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    expires: cookie.expires,
    maxAge: cookieTtlSeconds(),
  });

  return ok({ id: record.id, receivedAt: record.receivedAt, email: emailStatus });
};
