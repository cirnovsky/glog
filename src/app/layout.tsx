import './globals.css';
import 'semantic-ui-css/semantic.min.css';
import 'prismjs/themes/prism.css';
import 'katex/dist/katex.min.css';
import 'prismjs/plugins/toolbar/prism-toolbar.css';
// import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.css';
import type { Metadata } from 'next';
import Navbar from './components/Navbar';
import { Card } from 'semantic-ui-react';

export const metadata: Metadata = {
  title: 'Cirnovsky\'s Blog',
  description: 'A blog powered by GitHub Discussions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="ui segment page-segment-wrapper" style={{ width: '50vw', minWidth: 320, margin: '40px auto', borderRadius: 18, padding: 0, background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
          <div className="post-content-responsive">
            <Navbar />
            <div style={{ paddingTop: '70px', minHeight: '100vh', width: '100%' }}>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 