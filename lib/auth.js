import crypto from 'crypto';

const COOKIE_NAME = 'dp_auth';
const MAX_AGE = 60 * 60 * 24; // 24 hours

export function signAuthToken(username) {
  const secret = process.env.AUTH_SECRET || 'daily-primes-secret';
  const timestamp = Date.now().toString();
  const payload = `${username}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function verifyAuthToken(token) {
  if (!token) {
    return null;
  }

  try {
    const value = Buffer.from(token, 'base64').toString('utf8');
    const [username, timestamp, signature] = value.split(':');
    const secret = process.env.AUTH_SECRET || 'daily-primes-secret';
    const expected = crypto.createHmac('sha256', secret).update(`${username}:${timestamp}`).digest('hex');

    if (expected !== signature) {
      return null;
    }

    const age = Date.now() - Number(timestamp);
    if (Number.isNaN(age) || age > MAX_AGE * 1000) {
      return null;
    }

    return username;
  } catch (error) {
    return null;
  }
}

export function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, cookieItem) => {
    const [key, value] = cookieItem.split('=').map((part) => part?.trim());
    if (!key) return cookies;
    cookies[key] = value || '';
    return cookies;
  }, {});
}

export function authCookieHeader(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Strict; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}`;
}
