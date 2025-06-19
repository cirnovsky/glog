import React from 'react';

async function fetchDailyArticle() {
  let title, author, html
  const res = await fetch('https://www.qhsou.com/one/api.php')
      .then(response => response.json())
      .then(data => {
          title = data.title
          author = data.author
          html = data.content.replace(/\n/g, "<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
      })
      .catch(error => console.error('Error:', error));
  return { title, author, html }
}

export default async function DailyArticlePage() {
  const { title, author, html } = await fetchDailyArticle();
  return (
    <div className="markdown-body" style={{ padding: '2rem' }}>
      <h1>每日一文</h1>
      <a href="https://www.qhsou.com/one/" target="_blank">原作者，侵删</a>
      <h2>{title}</h2>
      <p><strong>作者：</strong>{author}</p>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p>加载失败，请稍后再试。</p>
      )}
    </div>
  );
} 