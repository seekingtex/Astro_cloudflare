import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from '~/lib/auth';

const protectedPrefixes = ['/keystatic', '/admin'];
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/change-password',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url.pathname;

  const isProtected = protectedPrefixes.some((p) => url === p || url.startsWith(p + '/') || (p.endsWith('/') && url.startsWith(p)));
  const isPublic = publicPaths.some((p) => url === p || url.startsWith(p + '/'));

  if (isProtected && !isPublic) {
    const sessionCookie = context.cookies.get('ks-admin-session')?.value;
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null;

    if (!session) {
      return context.redirect('/login');
    }
  }

  return next();
});
