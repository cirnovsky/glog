'use client';

import { Menu, Container } from 'semantic-ui-react';
import Link from 'next/link';
import ClientOnly from './ClientOnly';

export default function Navbar() {
  return (
    <ClientOnly>
      <Menu fixed="top" inverted className='centered-fixed-menu margin-top'>
        <Container>
          <Menu.Item as={Link} href="/" header>
            Cirnovsky's Blog
          </Menu.Item>
          <Menu.Menu position="right">
            <Menu.Item as={Link} href="/">
              Home
            </Menu.Item>
            <Menu.Item as={Link} href="/posts">
              Posts
            </Menu.Item>
          </Menu.Menu>
        </Container>
      </Menu>
    </ClientOnly>
  );
} 