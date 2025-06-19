'use client';

import { Menu, Container } from 'semantic-ui-react';
import Link from 'next/link';
import ClientOnly from './ClientOnly';

export default function Navbar() {
  return (
    <ClientOnly>
      <Menu fixed="top" inverted className='centered-fixed-menu'>
        <Container>
          <Menu.Item as={Link} href="/" header>
            GLog
          </Menu.Item>
          <Menu.Item as={Link} href="/">
            Home
          </Menu.Item>
          <Menu.Item as={Link} href="/posts">
            Posts
          </Menu.Item>
        </Container>
      </Menu>
    </ClientOnly>
  );
} 