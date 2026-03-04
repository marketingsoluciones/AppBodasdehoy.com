import { memo, useEffect } from 'react';

import { BRANDING_NAME } from '@/const/branding';
import { useDeveloperName } from '@/hooks/useDeveloperBranding';

const PageTitle = memo<{ title: string }>(({ title }) => {
  const developerName = useDeveloperName();
  const appName = developerName || BRANDING_NAME;

  useEffect(() => {
    document.title = title ? `${title} · ${appName}` : appName;
  }, [title, appName]);

  return null;
});

export default PageTitle;
