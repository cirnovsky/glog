'use client';

import { Search, Dropdown, Input, Button } from 'semantic-ui-react';
import { Category, Label } from '@/types/github';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, KeyboardEvent, ChangeEvent } from 'react';
import ClientOnly from './ClientOnly';

interface SearchBarProps {
  categories: Category[];
  labels: Label[];
}

export default function SearchBar({ categories, labels }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');

  const categoryOptions = categories.map(category => ({
    key: category.id,
    text: category.name,
    value: category.id,
  }));

  const tagOptions = labels.map(label => ({
    key: label.id,
    text: label.name,
    value: label.name,
  }));

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTag) params.set('tag', selectedTag);
    
    router.push(`/posts?${params.toString()}`);
  }, [searchQuery, selectedCategory, selectedTag, router]);

  return (
    <ClientOnly>
      <div className="ui segment">
        <div className="ui form">
          <div className="fields">
            <div className="field">
              <Input
                icon="search"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="field">
              <Dropdown
                placeholder="Select Category"
                selection
                options={categoryOptions}
                value={selectedCategory}
                onChange={(_, data) => setSelectedCategory(data.value as string)}
              />
            </div>
            <div className="field">
              <Dropdown
                placeholder="Select Tag"
                selection
                options={tagOptions}
                value={selectedTag}
                onChange={(_, data) => setSelectedTag(data.value as string)}
              />
            </div>
            <div className="field">
              <Button primary onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
} 