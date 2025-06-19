'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ClientOnlyProps {
  children: React.ReactNode;
}

export default function ClientOnly({ children }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingSpinner text="Loading..." size="small" />;
  }

  return <>{children}</>;
} 