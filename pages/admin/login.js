import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    setIsLoading(false);

    if (response.ok) {
      router.push('/admin');
      return;
    }

    const data = await response.json();
    setError(data?.message || 'Invalid credentials');
  }

  return (
    <main className="container" style={{ paddingTop: '4rem' }}>
      <div className="hero-card" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <span className="section-heading">Admin Login</span>
        <h1 className="page-title">Secure editor access</h1>
        <p className="page-subtitle">Sign in to create, edit, or delete story files stored directly in the repository.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <div className="alert">{error}</div> : null}

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
