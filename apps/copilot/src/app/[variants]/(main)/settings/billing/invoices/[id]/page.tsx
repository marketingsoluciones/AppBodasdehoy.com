'use client';

import { memo } from 'react';

import InvoiceDetail from '@/components/billing/InvoiceDetail';

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

const InvoiceDetailPage = memo<InvoiceDetailPageProps>(({ params }) => {
  return <InvoiceDetail invoiceId={params.id} />;
});

InvoiceDetailPage.displayName = 'InvoiceDetailPage';

export default InvoiceDetailPage;
