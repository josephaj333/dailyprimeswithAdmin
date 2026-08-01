import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

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

export async function getServerSideProps({ params }) {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Supabase story fetch error:', error);
      return { props: { post: null } };
    }

    const post = data
      ? {
          id: data.id,
          title: data.title,
          description: data.description,
          content: data.content,
          image: data.image_url || '/images/defaultfootball.png',
          youtubeVideoUrl: data.youtube_url || '',
          date: data.created_at || new Date().toISOString(),
        }
      : null;

    return { props: { post } };
  } catch (error) {
    console.error('Failed to load story:', error);
    return { props: { post: null } };
  }
}
