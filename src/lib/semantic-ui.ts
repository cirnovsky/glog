'use client';

import dynamic from 'next/dynamic';

// Dynamically import Semantic UI components with no SSR
const components = {
  Header: dynamic(() => import('semantic-ui-react').then(mod => mod.Header), { ssr: false }),
  Segment: dynamic(() => import('semantic-ui-react').then(mod => mod.Segment), { ssr: false }),
  Card: dynamic(() => import('semantic-ui-react').then(mod => mod.Card), { ssr: false }),
  Button: dynamic(() => import('semantic-ui-react').then(mod => mod.Button), { ssr: false }),
  Label: dynamic(() => import('semantic-ui-react').then(mod => mod.Label), { ssr: false }),
  Message: dynamic(() => import('semantic-ui-react').then(mod => mod.Message), { ssr: false }),
  Pagination: dynamic(() => import('semantic-ui-react').then(mod => mod.Pagination), { ssr: false }),
  Search: dynamic(() => import('semantic-ui-react').then(mod => mod.Search), { ssr: false }),
  Dropdown: dynamic(() => import('semantic-ui-react').then(mod => mod.Dropdown), { ssr: false }),
  Input: dynamic(() => import('semantic-ui-react').then(mod => mod.Input), { ssr: false }),
  Menu: dynamic(() => import('semantic-ui-react').then(mod => mod.Menu), { ssr: false }),
  Icon: dynamic(() => import('semantic-ui-react').then(mod => mod.Icon), { ssr: false }),
};

export const {
  Header,
  Segment,
  Card,
  Button,
  Label,
  Message,
  Pagination,
  Search,
  Dropdown,
  Input,
  Menu,
  Icon,
} = components; 