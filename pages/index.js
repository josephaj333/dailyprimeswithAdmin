import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const truncateText = (text, maxLength = 140) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

export default function Home({ posts }) {
  const latestPosts = posts; // show all posts on homepage
  const [visibleCount, setVisibleCount] = useState(9);
  const visiblePosts = latestPosts.slice(0, visibleCount);
  const hasMoreStories = visibleCount < latestPosts.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 9, latestPosts.length));
  };

  return (
    <>
      <Head>
        <title>Daily Primes - Your Daily Dose of Football Excellence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google-adsense-account" content="ca-pub-8544354064796718" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>

      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">
            <i className="fas fa-futbol"></i>
            <span>Daily Primes</span>
          </div>
          <ul className="nav-links" id="navLinks" role="navigation">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><a href="/contact.html" className="nav-disabled" data-disabled="true" aria-disabled="true" tabIndex={-1} title="Contact temporarily disabled">Contact</a></li>
            <li><a href="https://www.youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg" target="_blank" rel="noreferrer" className="nav-youtube">
              <i className="fab fa-youtube"></i> Subscribe
            </a></li>
          </ul>
          <div className="hamburger" aria-label="Toggle navigation" aria-expanded="false" role="button" tabIndex={0}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-copy">
            <span className="hero-label">Football • News • Insight</span>
            <h1 className="hero-title">Daily Primes keeps you ahead of the game.</h1>
            <p className="hero-tagline">
              Follow the biggest moments in football, get crisp match analysis, and discover trending stories from the pitch every day.
            </p>
            <div className="hero-actions">
              <a href="https://www.youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg" target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
                <i className="fab fa-youtube"></i> Subscribe Now
              </a>
            </div>
            <div className="hero-stat-grid">
              <div><strong>3+</strong> daily insights</div>
              <div><strong>Latest </strong> football news</div>
              <div><strong>Trusted </strong> Sources</div>
            </div>
          </div>
          <div className="hero-media" aria-hidden="true">
            <div className="hero-image-mask">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/images/droneshow.jpg"
                width="420"
                height="420"
                className="hero-video"
              >
                <source src="/images/footballgraphics.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </header>

      <section className="about-preview">
        <div className="container">
          <div className="section-title">
            <h2>Welcome to Daily Primes</h2>
            <div className="title-underline"></div>
          </div>
          <p className="about-text">
            Daily Primes is your premier destination for everything happening in the beautiful game. From breaking transfer rumors and blockbuster deadline-day deals to instant match reports, live score updates, and expert tactical analysis—we bring the pulse of global football directly to your feed. Whether it’s the latest injury news, post-match reactions, or the stories shaping the Champions League and the Premier League, our team of passionate writers keeps you informed and ahead of the curve. Join our growing community of football fanatics and never miss a beat of the action
          </p>
          <a href="/about" className="btn btn-secondary">Learn More About Us</a>
        </div>
      </section>

      <section className="blog-section">
        <div className="container">
          <div className="section-title">
            <h2>Latest Football Insights</h2>
            <div className="title-underline"></div>
          </div>

          <div className="blog-grid">
            {visiblePosts.length > 0 ? (
              visiblePosts.map((post) => (
                <article
                  key={post.id}
                  className="blog-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => window.location.href = `/post/${post.id}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/post/${post.id}` }}
                >
                  <div className="blog-image">
                    <img src={post.image || '/images/profilepic.jpg'} srcSet={`${post.image || '/images/profilepic.jpg'} 400w`} alt={post.title} loading="lazy" />
                    <span className="blog-badge">Latest</span>
                  </div>
                  <div className="blog-content">
                    <h3>{post.title}</h3>
                    <p>{truncateText(post.description, 140)}</p>
                    <div className="blog-meta">
                      <span><i className="far fa-calendar"></i> {new Date(post.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <a
                        href={`/post/${post.id}`}
                        className="btn btn-small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read More
                      </a>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="blog-card">
                <div className="blog-content">
                  <h3>No published stories yet</h3>
                  <p>Use the admin page to create your first news story.</p>
                  <span className="helper-text">Create posts from the admin panel at <code>/admin</code></span>
                </div>
              </div>
            )}
          </div>
          {hasMoreStories ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button type="button" className="button" onClick={handleShowMore}>
                Show more stories
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="ronaldo-tribute">
        <div className="container">
          <div className="section-title">
            <h2>Cristiano Ronaldo: The Legend</h2>
            <div className="title-underline"></div>
          </div>
          <div className="tribute-content">
            <div className="tribute-text">
              <p className="tribute-intro">
                Cristiano Ronaldo isn't just a football player - he's an inspiration. His work ethic, determination, and relentless pursuit of excellence embodies everything we celebrate at Daily Primes.
              </p>
              <ul className="tribute-highlights">
                <li><i className="fas fa-star"></i> 5× Ballon d'Or Winner</li>
                <li><i className="fas fa-trophy"></i> Multiple League Champions</li>
                <li><i className="fas fa-fire"></i> All-Time Goal Scoring Record Holder</li>
                <li><i className="fas fa-heart"></i> Global Icon & Ambassador of the Game</li>
              </ul>
            </div>
            <div className="tribute-gallery">
              <div className="tribute-image">
                <img src="/images/ronaldocelbration.jpeg" alt="Ronaldo celebrating" loading="lazy" />
              </div>
              <div className="tribute-image">
                <img src="/images/ronaldoscoringoal.jpg" alt="Ronaldo in action" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="messi-tribute">
        <div className="container">
          <div className="section-title">
            <h2>Lionel Messi: The GOAT</h2>
            <div className="title-underline"></div>
          </div>
          <div className="tribute-content">
            <div className="tribute-text">
              <p className="tribute-intro">
                Lionel Messi's vision, close control, and creativity define a generation. His artistry on the pitch and relentless consistency make him one of the greatest players in football history.
              </p>
              <ul className="tribute-highlights">
                <li><i className="fas fa-star"></i> 8x Ballon d'Or Winner</li>
                <li><i className="fas fa-trophy"></i> Many League & Cup Titles</li>
                <li><i className="fas fa-fire"></i> Incredible Dribbling & Playmaking</li>
                <li><i className="fas fa-heart"></i> Global Icon & Ambassador of Football</li>
              </ul>
            </div>
            <div className="tribute-gallery">
              <div className="tribute-image">
                <img src="/images/messicelebration2.jpg" alt="Messi celebrating" loading="lazy" />
              </div>
              <div className="tribute-image">
                <img src="/images/messi3.jpg" alt="Messi in action" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="youtube-section">
        <div className="container">
          <div className="section-title">
            <h2>Join Our Community</h2>
            <div className="title-underline"></div>
          </div>
          <div className="youtube-card">
            <div className="youtube-icon">
              <i className="fab fa-youtube"></i>
            </div>
            <h3>Daily Primes</h3>
            <p>Your trusted source for the latest football news, transfer updates, and match-day insights.</p>
            <div className="subscriber-count">
              <i className="fas fa-users"></i>
              <span>Join Thousands of Football Fans</span>
            </div>
            <a href="https://www.youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg" target="_blank" rel="noreferrer" className="btn btn-youtube">
              <i className="fab fa-youtube"></i> Subscribe to Daily Primes
            </a>
            <p className="youtube-url">youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg</p>
          </div>
        </div>
      </section>

      <section className="ads-container" id="ads-top">
        <ins className="adsbygoogle"
          style={{ display: 'block', maxWidth: '1200px', margin: '0 auto' }}
          data-ad-client="ca-pub-8544354064796718"
          data-ad-slot="3413764842"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Daily Primes</h4>
              <p>Your trusted source for the latest football news, transfer updates, and match-day insights.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><a href="/about.html">About</a></li>
                <li><a href="/contact.html" className="nav-disabled" data-disabled="true" aria-disabled="true" tabIndex={-1} title="Contact temporarily disabled">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <a href="https://www.youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg" target="_blank" rel="noreferrer" title="YouTube"><i className="fab fa-youtube"></i></a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" title="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram"><i className="fab fa-instagram"></i></a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook"><i className="fab fa-facebook"></i></a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Daily Primes. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
          </div>
        </div>
      </footer>

      <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8544354064796718" strategy="afterInteractive" crossOrigin="anonymous" />
      <Script src="/script.js" strategy="afterInteractive" />
      <Script id="adsbygoogle-init" strategy="afterInteractive">
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </>
  );
}

export async function getStaticProps() {
  try {
    const { data, error } = await supabase.from('stories').select('*');
    if (error) {
      console.error('Supabase story fetch error:', error);
      return { props: { posts: [] } };
    }

    const posts = (Array.isArray(data) ? data : [])
      .map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        content: row.content,
        image: row.image_url || '/images/profilepic.jpg',
        youtubeVideoUrl: row.youtube_url || '',
        date: row.created_at || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      props: {
        posts,
      },
    };
  } catch (error) {
    console.error('Failed to load stories:', error);
    return {
      props: {
        posts: [],
      },
    };
  }
}
