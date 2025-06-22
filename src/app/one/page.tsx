'use client'

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

interface DailyArticle {
  title: string;
  author: string;
  html: string;
}

export default function DailyArticlePage() {
  const [article, setArticle] = useState<DailyArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDailyArticle() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/daily-article');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (!data.title || !data.author || !data.content) {
          throw new Error('Invalid API response format');
        }

        const html = data.content.replace(/\n/g, "<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
        
        setArticle({
          title: data.title,
          author: data.author,
          html: html
        });
      } catch (err) {
        console.error('Error fetching daily article:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    fetchDailyArticle();
  }, []);

  if (loading) {
    return (
      <div className="markdown-body" style={{ padding: '2rem' }}>
        <h1>每日一文</h1>
        <LoadingSpinner text="正在加载每日一文..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="markdown-body" style={{ padding: '2rem' }}>
        <h1>每日一文</h1>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <p style={{ color: '#dc3545', margin: 0 }}>
            <strong>加载失败：</strong>{error}
          </p>
          <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            请稍后再试或检查网络连接。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-body" style={{ padding: '2rem' }}>
      <h1>每日一文</h1>
      <a href="https://www.qhsou.com/one/" target="_blank" rel="noopener noreferrer">
        原作者，侵删
      </a>
      {article && (
        <>
          <h2>{article.title}</h2>
          <p><strong>作者：</strong>{article.author}</p>
          <div dangerouslySetInnerHTML={{ __html: article.html }} />
        </>
      )}
    </div>
  );
} 