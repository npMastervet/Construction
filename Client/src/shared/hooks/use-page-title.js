import { useEffect } from 'react';
import { setPageTitle } from '@/shared/lib/utils';

export function usePageTitle(title) {
  useEffect(() => {
    setPageTitle(title);
  }, [title]);
}