'use client';

/**
 * Wedding Site Public View
 * ========================
 * Pagina publica de la web de boda (production mode)
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WeddingSiteRenderer } from '@/components/wedding-site';
import type { WeddingWebData, RSVPSubmission } from '@/components/wedding-site/types';

// Demo data para preview - en produccion esto vendria de la API
const getDemoWedding = (slug: string): WeddingWebData => ({
  couple: {
    partner1: { name: 'Maria' },
    partner2: { name: 'Juan' },
  },
  createdAt: new Date().toISOString(),
  date: {
    date: new Date('2025-06-15').toISOString(),
    time: '17:00',
  },
  hero: {
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920',
    showCountdown: true,
    subtitle: 'Nos casamos',
  },
  id: `wedding-${slug}`,
  published: true,
  sections: [
    {
      data: {
        events: [
          { description: 'Ceremonia intima con familia y amigos cercanos', id: '1', location: 'Parroquia San Jose', time: '17:00', title: 'Ceremonia Religiosa', type: 'ceremony' },
          { description: 'Bebidas y aperitivos mientras tomamos fotos', id: '2', location: 'Jardin del Salon', time: '18:30', title: 'Coctel de Bienvenida', type: 'cocktail' },
          { description: 'Cena de 3 tiempos con opciones vegetarianas', id: '3', location: 'Salon Principal', time: '20:00', title: 'Cena', type: 'dinner' },
          { description: 'A bailar hasta que el cuerpo aguante!', id: '4', location: 'Pista de Baile', time: '22:00', title: 'Fiesta', type: 'party' },
        ],
        title: 'Programa del Dia',
      },
      enabled: true,
      order: 1,
      type: 'schedule',
    },
    {
      data: {
        showDirections: true,
        showMap: true,
        title: 'Donde Celebramos',
        venues: [
          {
            address: 'Carretera a Colima Km 15',
            city: 'Guadalajara, Jalisco',
            coordinates: { lat: 20.6736, lng: -103.344 },
            description: 'Un lugar magico rodeado de naturaleza',
            id: '1',
            name: 'Hacienda Los Olivos',
            parkingInfo: 'Estacionamiento amplio disponible',
            type: 'both',
          },
        ],
      },
      enabled: true,
      order: 2,
      type: 'location',
    },
    {
      data: {
        layout: 'masonry',
        photos: [
          { caption: 'Donde nos conocimos', id: '1', url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800' },
          { caption: 'Primera cita', id: '2', url: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800' },
          { caption: 'El dia que dijo si', id: '3', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800' },
          { caption: 'Nuestra familia', id: '4', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800' },
          { caption: 'Aventuras juntos', id: '5', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800' },
          { caption: 'Siempre sonriendo', id: '6', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        ],
        subtitle: 'Momentos que nos trajeron hasta aqui',
        title: 'Nuestra Historia',
      },
      enabled: true,
      order: 3,
      type: 'gallery',
    },
    {
      data: {
        accommodations: [
          {
            description: 'A 10 minutos del venue',
            discountCode: 'MARIAJUAN2025',
            id: '1',
            name: 'Hotel Camino Real',
            priceRange: '$1,500 - $2,500 MXN/noche',
            website: 'https://caminoreal.com',
          },
          {
            description: 'Opcion economica a 15 minutos',
            id: '2',
            name: 'Hampton Inn',
            priceRange: '$900 - $1,200 MXN/noche',
            website: 'https://hamptoninn.com',
          },
        ],
        dressCode: {
          avoid: ['Blanco', 'Colores muy claros'],
          description: 'Vestimenta formal. Caballeros: traje; Damas: vestido largo o coctel',
          type: 'formal',
        },
        faqs: [
          {
            answer: 'Por tratarse de un evento para adultos, les pedimos que esta vez vengan sin los pequenos. Queremos que disfruten la noche sin preocupaciones!',
            id: '1',
            question: 'Puedo llevar ninos?',
          },
          {
            answer: 'Si, el venue cuenta con estacionamiento amplio y gratuito para todos los invitados.',
            id: '2',
            question: 'Hay estacionamiento?',
          },
          {
            answer: 'El salon cuenta con areas techadas y un plan B por si el clima no coopera. No te preocupes!',
            id: '3',
            question: 'Que pasa si llueve?',
          },
        ],
        title: 'Informacion Importante',
      },
      enabled: true,
      order: 4,
      type: 'info',
    },
    {
      data: {
        config: {
          allowPlusOne: true,
          askDietaryRestrictions: true,
          askMessage: true,
          askSongRequest: true,
          deadline: '2025-05-15',
          maxGuests: 4,
        },
        message: 'Por favor confirma antes del 15 de mayo de 2025',
        subtitle: 'Nos encantaria contar contigo en este dia tan especial',
        title: 'Confirma tu Asistencia',
      },
      enabled: true,
      order: 5,
      type: 'rsvp',
    },
    {
      data: {
        cashOption: {
          bankDetails: {
            accountHolder: 'Maria Garcia Lopez',
            accountNumber: '0123456789',
            bankName: 'BBVA',
            routingNumber: '012345678901234567',
          },
          enabled: true,
          message: 'Si prefieres ayudarnos con nuestra luna de miel:',
        },
        links: [
          { description: 'Mesa de regalos tradicional', id: '1', name: 'Liverpool', url: 'https://liverpool.com.mx/mesa/mariajuan2025' },
          { description: 'Para los que prefieren comprar en linea', id: '2', name: 'Amazon', url: 'https://amazon.com.mx/wedding/mariajuan' },
        ],
        message: 'Tu presencia es nuestro mejor regalo. Sin embargo, si deseas obsequiarnos algo, aqui hay algunas opciones:',
        title: 'Mesa de Regalos',
      },
      enabled: true,
      order: 6,
      type: 'registry',
    },
  ],
  seo: {
    description: 'Estamos muy emocionados de compartir este dia tan especial contigo. Confirma tu asistencia!',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200',
    title: 'Boda de Maria & Juan - 15 de Junio 2025',
  },
  slug,
  style: {
    palette: 'romantic',
  },
  updatedAt: new Date().toISOString(),
});

export default function WeddingPublicPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [wedding, setWedding] = useState<WeddingWebData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWedding = async () => {
      try {
        // TODO: In production, fetch from API
        // const response = await fetch(`/api/wedding/${slug}`);
        // const data = await response.json();

        // For now, use demo data
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = getDemoWedding(slug);
        setWedding(data);
      } catch {
        setError('No se pudo cargar la web de boda');
      } finally {
        setLoading(false);
      }
    };

    loadWedding();
  }, [slug]);

  const handleRSVPSubmit = async (submission: RSVPSubmission) => {
    console.log('RSVP Submission:', submission);
    // TODO: Send to API
    // await fetch(`/api/wedding/${slug}/rsvp`, {
    //   method: 'POST',
    //   body: JSON.stringify(submission),
    // });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">💒</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">😕</div>
          <h1 className="mb-2 text-2xl font-bold">Web no encontrada</h1>
          <p className="text-gray-600">{error || 'Esta web de boda no existe o no esta publicada.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      {wedding.seo && (
        <head>
          <title>{wedding.seo.title}</title>
          <meta content={wedding.seo.description} name="description" />
          <meta content={wedding.seo.title} property="og:title" />
          <meta content={wedding.seo.description} property="og:description" />
          {wedding.seo.image && <meta content={wedding.seo.image} property="og:image" />}
        </head>
      )}

      <WeddingSiteRenderer
        mode="production"
        onRSVPSubmit={handleRSVPSubmit}
        wedding={wedding}
      />
    </>
  );
}
