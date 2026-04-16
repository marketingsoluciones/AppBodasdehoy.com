'use client';

import { Breadcrumb } from 'antd';
import Link from 'next/link';
import { memo } from 'react';

interface BreadcrumbItem {
  href?: string;
  title: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = memo<BreadcrumbsProps>(({ items }) => {
  const breadcrumbItems = items.map((item, index) => {
    if (item.href && index < items.length - 1) {
      return {
        title: <Link href={item.href}>{item.title}</Link>,
      };
    }
    return {
      title: item.title,
    };
  });

  return <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 16 }} />;
});

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;
