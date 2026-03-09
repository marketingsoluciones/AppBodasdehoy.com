'use client';

import { ApolloProvider } from '@apollo/client/react';
import { ReactNode } from 'react';

import { apolloClient } from '@/libs/graphql/client';

interface ApolloProviderWrapperProps {
  children: ReactNode;
}

/**
 * ApolloProvider wrapper for client-side GraphQL operations
 * Wraps children with Apollo Client context
 */
const ApolloProviderWrapper = ({ children }: ApolloProviderWrapperProps) => {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};

export default ApolloProviderWrapper;
