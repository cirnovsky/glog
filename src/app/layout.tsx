import './globals.css';
import 'semantic-ui-css/semantic.min.css';
import type { Metadata } from 'next';
import Navbar from './components/Navbar';

export const metadata: Metadata = {
  title: 'GLog - GitHub Discussions Blog',
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
        <Navbar />
        <div style={{ paddingTop: '70px', minHeight: '100vh' }}>
          <div className="ui container">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
} 