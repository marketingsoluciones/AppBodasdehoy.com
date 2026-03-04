'use client';

import { use, memo } from 'react';

import InvoiceDetail from '@/components/billing/InvoiceDetail';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

const InvoiceDetailPage = memo<InvoiceDetailPageProps>(({ params }) => {
  const { id } = use(params);
  return <InvoiceDetail invoiceId={id} />;
});

InvoiceDetailPage.displayName = 'InvoiceDetailPage';

export default InvoiceDetailPage;
