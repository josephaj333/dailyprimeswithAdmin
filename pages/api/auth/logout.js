export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'dp_auth=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict;');
  return res.status(200).json({ message: 'Logged out' });
}
