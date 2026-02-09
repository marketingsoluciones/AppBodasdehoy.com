'use client';

import dynamic from 'next/dynamic';
import { PropsWithChildren } from 'react';

import { authEnv } from '@/envs/auth';

import NoAuth from './NoAuth';

// Dynamic imports para evitar cargar módulos innecesarios
const Clerk = dynamic(() => import('./Clerk'), { ssr: false });
const NextAuth = dynamic(() => import('./NextAuth'), { ssr: false });

const AuthProvider = ({ children }: PropsWithChildren) => {
  if (authEnv.NEXT_PUBLIC_ENABLE_CLERK_AUTH) return <Clerk>{children}</Clerk>;

  if (authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH) return <NextAuth>{children}</NextAuth>;

  return <NoAuth>{children}</NoAuth>;
};

export default AuthProvider;
