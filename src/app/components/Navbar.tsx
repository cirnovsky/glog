'use client';

import { Menu, Container } from 'semantic-ui-react';
import Link from 'next/link';
import ClientOnly from './ClientOnly';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <ClientOnly>
      <Menu fixed="top" inverted className='centered-fixed-menu margin-top'>
        <Container>
          <Menu.Item 
            as={Link} 
            href="/" 
            header
            active={pathname === '/'}
          >
            Cirnovsky's Blog
          </Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item 
              as={Link} 
              href="/"
              active={pathname === '/'}
            >
              Home
            </Menu.Item>
            <Menu.Item 
              as={Link} 
              href="/posts"
              active={pathname.startsWith('/posts')}
            >
              Posts
            </Menu.Item>
            <Menu.Item 
              as={Link} 
              href="/one"
              active={pathname === '/one'}
            >
              每日一文
            </Menu.Item>
          </Menu.Menu>
        </Container>
      </Menu>
    </ClientOnly>
  );
} 