import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us - Daily Primes</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google-adsense-account" content="ca-pub-8544354064796718" />
      </Head>

      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">
            <i className="fas fa-futbol"></i>
            <span>Daily Primes</span>
          </div>
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about" className="active">About</Link></li>
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

      <main>
        <div className="page-header">
          <h1>About Daily Primes</h1>
          <p>Discover our mission, vision, and passion for football</p>
        </div>

        <section className="about-section">
          <div className="container">
            <div className="two-column">
              <div className="column">
                <div className="icon-box"><i className="fas fa-bullseye"></i></div>
                <h2>Our Mission</h2>
                <p>
                  To deliver high-quality football content that educates, entertains, and inspires millions of fans worldwide. We believe in celebrating the beautiful game through in-depth analysis, legendary moments, and inspiring stories from the world of football.
                </p>
              </div>
              <div className="column">
                <div className="icon-box"><i className="fas fa-eye"></i></div>
                <h2>Our Vision</h2>
                <p>
                  To build the most trusted and beloved football content platform, where fans connect, learn, and celebrate the sport they love. We envision a community where football excellence is recognized, analyzed, and shared with passion and authenticity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="container">
            <div className="section-title">
              <h2>Our Story</h2>
              <div className="title-underline"></div>
            </div>

            <div className="story-content">
              <div className="story-image">
                <img src="https://source.unsplash.com/featured/?football,stadium" alt="Our story" />
              </div>
              <div className="story-text">
                <p>
                  Founded by a passionate football enthusiast, Daily Primes was born out of a simple desire to share the love of the game with the world. What started as a personal project has evolved into a thriving community of football fans from every corner of the globe.
                </p>
                <p>
                  Inspired by the incredible career of Cristiano Ronaldo - a symbol of dedication, excellence, and relentless pursuit of perfection - we created Daily Primes as a platform to celebrate not just individual brilliance, but the beautiful game itself in all its forms.
                </p>
                <p>
                  From analyzing tactical masterpieces to celebrating legendary goals, from breaking down player performances to exploring football history - Daily Primes covers it all. We believe football is more than just a sport; it's a way of life, a source of inspiration, and a universal language that unites billions of people.
                </p>
                <p>
                  Today, we're honored to be part of your football journey. Thank you for being here!
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="offerings-section">
          <div className="container">
            <div className="section-title">
              <h2>What We Offer</h2>
              <div className="title-underline"></div>
            </div>
            <div className="offerings-grid">
              <div className="offering-card">
                <div className="offering-icon"><i className="fas fa-play-circle"></i></div>
                <h3>Exclusive Analysis</h3>
                <p>Deep-dive tactical analysis of major matches, player performances, and strategic decisions that shape the game.</p>
              </div>
              <div className="offering-card">
                <div className="offering-icon"><i className="fas fa-trophy"></i></div>
                <h3>Highlight Reels</h3>
                <p>Curated collections of the most memorable moments, jaw-dropping goals, and unforgettable performances.</p>
              </div>
              <div className="offering-card">
                <div className="offering-icon"><i className="fas fa-newspaper"></i></div>
                <h3>Football News</h3>
                <p>Stay updated with the latest transfer news, injury reports, and developments in the world of football.</p>
              </div>
              <div className="offering-card">
                <div className="offering-icon"><i className="fas fa-users"></i></div>
                <h3>Player Profiles</h3>
                <p>In-depth profiles of the world's greatest players, their careers, achievements, and legacies.</p>
              </div>
              <div className="offering-card">
                <div className="offering-icon"><i className="fas fa-lightbulb"></i></div>
                <h3>Training Tips</h3>
                <p>Learn techniques, fitness routines, and mental preparation secrets from professional players and coaches.</p>
              </div>
              <div className="offering-card">
                <div className="offering-icon"><i className="fas fa-video"></i></div>
                <h3>Match Reactions</h3>
                <p>Real-time reactions and commentary on major matches, bringing the excitement directly to your screen.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="inspiration-section">
          <div className="container">
            <div className="section-title">
              <h2>Inspired by Greatness</h2>
              <div className="title-underline"></div>
            </div>
            <div className="inspiration-content">
              <div className="inspiration-image">
                <img src="https://source.unsplash.com/featured/?cristiano-ronaldo,achievement" alt="Ronaldo" />
              </div>
              <div className="inspiration-text">
                <h3>Cristiano Ronaldo: Our North Star</h3>
                <p>
                  Cristiano Ronaldo represents everything we believe in - dedication, excellence, innovation, and an unwavering commitment to being the best. His journey from a small island to becoming a global football icon inspires our entire mission.
                </p>
                <ul className="inspiration-list">
                  <li><strong>Work Ethic:</strong> His relentless dedication to training and improvement is unmatched</li>
                  <li><strong>Excellence:</strong> Always pushing boundaries and setting new standards in the game</li>
                  <li><strong>Resilience:</strong> Overcoming challenges and adapting to new environments</li>
                  <li><strong>Global Icon:</strong> Uniting millions of fans across the world through football</li>
                </ul>
                <p>
                  At Daily Primes, we don't just analyze football - we celebrate the human spirit that makes it beautiful. Cristiano Ronaldo embodies that spirit, and that's what drives us every day.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="container">
            <div className="section-title">
              <h2>By The Numbers</h2>
              <div className="title-underline"></div>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Growing Community</h4>
                <p className="stat-number">26K+</p>
                <p>Subscribers</p>
              </div>
              <div className="stat-card">
                <h4>Content Reach</h4>
                <p className="stat-number">2M+</p>
                <p>Monthly Views</p>
              </div>
              <div className="stat-card">
                <h4>Engagement</h4>
                <p className="stat-number">100K+</p>
                <p>Active Comments Monthly</p>
              </div>
              <div className="stat-card">
                <h4>Content Library</h4>
                <p className="stat-number">65+</p>
                <p>Videos & Articles</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <h2>Be Part of the Daily Primes Family</h2>
            <p>Join thousands of football fans who are already part of our community</p>
            <a href="https://www.youtube.com/channel/UCnSUPkD48P03XqOLnudRBUg" target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
              <i className="fab fa-youtube"></i> Subscribe Now
            </a>
          </div>
        </section>

        <section className="ads-container">
          <ins className="adsbygoogle"
               style={{ display: 'block', maxWidth: '1200px', margin: '0 auto' }}
               data-ad-client="ca-pub-8544354064796718"
               data-ad-slot="3413764842"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Daily Primes</h4>
              <p>Your daily dose of football excellence and Cristiano Ronaldo content.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/about">About</Link></li>
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
      <Script id="adsbygoogle-init-about" strategy="afterInteractive">{`(adsbygoogle = window.adsbygoogle || []).push({});`}</Script>
    </>
  );
}
