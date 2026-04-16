import Head from 'next/head';
import dynamic from 'next/dynamic';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';

const SocialProof = dynamic(() => import('../components/landing/SocialProof'));
const HowItWorks = dynamic(() => import('../components/landing/HowItWorks'));
const Features = dynamic(() => import('../components/landing/Features'));
const UseCases = dynamic(() => import('../components/landing/UseCases'));
const Testimonials = dynamic(() => import('../components/landing/Testimonials'));
const Pricing = dynamic(() => import('../components/landing/Pricing'));
const FinalCTA = dynamic(() => import('../components/landing/FinalCTA'));
const Footer = dynamic(() => import('../components/landing/Footer'));

export default function HomePage() {
  const { t } = useTranslation('common');
  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={t('meta.title')} />
        <meta property="og:description" content={t('meta.description')} />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://memories.bodasdehoy.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://memories.bodasdehoy.com/og-image.jpg" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <Features />
        <UseCases />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'es', ['common'])),
    },
  };
};
