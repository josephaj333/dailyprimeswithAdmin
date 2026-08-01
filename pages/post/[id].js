import React, { useState } from 'react';
import { getAllPosts, getPostById } from '../../lib/posts';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function PostPage({ post }) {
  const [showVideo, setShowVideo] = useState(false);
  if (!post) {
    return (
      <main className="container">
        <h1>Post not found</h1>
        <p>The story you requested does not exist.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div style={{ margin: '3rem 0' }}>
        <Link href="/" className="btn">Back to Home</Link>
      </div>

      <article className="post-body">
        <header className="post-header">
          <div>
            <span className="section-heading">{new Date(post.date).toLocaleDateString()}</span>
            <h1 className="page-title">{post.title}</h1>
            <p className="card-text muted">{post.description}</p>
          </div>

          {post.youtubeVideoUrl ? (
            <div className="post-actions">
              <button
                className="btn btn-youtube btn-lg"
                onClick={() => window.location.href = post.youtubeVideoUrl}
                type="button"
              >
                <i className="fab fa-youtube"></i> Watch
              </button>
            </div>
          ) : null}
        </header>

        <div className="post-image" style={{ margin: '1.5rem 0' }}>
          <img src={post.image} alt={post.title} />
        </div>

        <div className="post-content">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {showVideo && post.youtubeVideoUrl ? (
          <div className="video-modal" role="dialog" aria-modal="true">
            <div className="video-modal-backdrop" onClick={() => setShowVideo(false)} />
            <div className="video-modal-body">
              <button className="video-modal-close" onClick={() => setShowVideo(false)} aria-label="Close video">×</button>
              <div className="video-wrapper">
                <iframe
                  src={post.youtubeVideoUrl.includes('watch?v=') ? post.youtubeVideoUrl.replace('watch?v=', 'embed/') : post.youtubeVideoUrl}
                  title={post.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        ) : null}
      </article>
    </main>
  );
}

export async function getStaticPaths() {
  const posts = getAllPosts();
  return {
    paths: posts.map((post) => ({ params: { id: post.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = getPostById(params.id);
  return {
    props: {
      post: post || null,
    },
  };
}
