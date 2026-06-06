import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('ks-admin-session', { path: '/' });
  cookies.delete('ks-gh-token', { path: '/' });
  return redirect('/login');
};
