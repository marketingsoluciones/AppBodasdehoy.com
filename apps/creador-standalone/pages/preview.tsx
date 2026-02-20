/**
 * Vista previa de ejemplo: renderiza una web de boda con datos mock
 * usando @bodasdehoy/wedding-creator (sin backend).
 */
import { WeddingSiteRenderer } from '@bodasdehoy/wedding-creator';
import type { WeddingWebData } from '@bodasdehoy/wedding-creator';
import Head from 'next/head';
import Link from 'next/link';

const mockWedding: WeddingWebData = {
  id: 'demo-1',
  slug: 'maria-y-juan',
  couple: {
    partner1: { name: 'María', fullName: 'María García' },
    partner2: { name: 'Juan', fullName: 'Juan López' },
  },
  date: {
    date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    time: '18:00',
    timezone: 'Europe/Madrid',
  },
  style: { palette: 'romantic' },
  hero: {
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920',
    showCountdown: true,
    subtitle: 'Nos casamos',
  },
  sections: [
    {
      type: 'schedule',
      enabled: true,
      order: 1,
      data: {
        title: 'Programa del día',
        subtitle: 'Un día inolvidable',
        events: [
          { id: '1', type: 'ceremony', title: 'Ceremonia', time: '18:00', location: 'Iglesia de San Pedro' },
          { id: '2', type: 'cocktail', title: 'Cóctel', time: '19:30', location: 'Jardines' },
          { id: '3', type: 'dinner', title: 'Cena', time: '21:00', location: 'Salón principal' },
          { id: '4', type: 'party', title: 'Fiesta', time: '23:00', location: 'Salón principal' },
        ],
      },
    },
    {
      type: 'location',
      enabled: true,
      order: 2,
      data: {
        title: 'Ubicación',
        showMap: true,
        showDirections: true,
        venues: [
          {
            id: '1',
            name: 'Hacienda Los Olivos',
            type: 'both',
            address: 'Carretera N-340, km 42',
            city: 'Córdoba',
          },
        ],
      },
    },
    {
      type: 'gallery',
      enabled: true,
      order: 3,
      data: {
        title: 'Nuestra historia',
        layout: 'grid',
        photos: [],
      },
    },
    {
      type: 'rsvp',
      enabled: true,
      order: 4,
      data: {
        title: 'Confirma tu asistencia',
        config: {
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          allowPlusOne: true,
          askDietaryRestrictions: true,
          askMessage: true,
          askSongRequest: false,
        },
      },
    },
  ],
  published: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function PreviewPage() {
  return (
    <>
      <Head>
        <title>Vista previa · Creador de webs</title>
      </Head>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', padding: '12px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#ec4899', fontWeight: 600, textDecoration: 'none' }}>
          ← Volver
        </Link>
        <span style={{ fontSize: 14, color: '#666' }}>Vista previa de ejemplo (datos mock)</span>
      </div>
      <WeddingSiteRenderer mode="production" wedding={mockWedding} />
    </>
  );
}
