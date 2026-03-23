import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';

import { VenueVisualizerItem } from '@/types/tool/venueVisualizer';

const STYLE_LABELS: Record<string, string> = {
  'glamour': 'Glamour',
  'industrial': 'Industrial',
  'jardin-floral': 'Jardín Floral',
  'mediterraneo': 'Mediterráneo',
  'minimalista': 'Minimalista',
  'romantico': 'Romántico',
  'rustico-boho': 'Rústico Boho',
  'tropical': 'Tropical',
};

const ROOM_LABELS: Record<string, string> = {
  'finca': 'Finca',
  'iglesia': 'Iglesia / Capilla',
  'jardin': 'Jardín',
  'restaurante': 'Restaurante',
  'rooftop': 'Rooftop',
  'salon-banquetes': 'Salón de Banquetes',
  'terraza': 'Terraza',
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#7C3AED',
    borderRadius: 4,
    color: '#fff',
    fontSize: 9,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  card: {
    backgroundColor: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
    width: '48%',
  },
  footer: {
    borderTop: '1px solid #e5e7eb',
    color: '#9ca3af',
    fontSize: 8,
    marginTop: 20,
    paddingTop: 8,
    textAlign: 'center',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  header: {
    borderBottom: '1px solid #e5e7eb',
    marginBottom: 20,
    paddingBottom: 12,
  },
  image: {
    height: 160,
    objectFit: 'cover',
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    fontSize: 10,
    height: 160,
    justifyContent: 'center',
  },
  meta: {
    color: '#6b7280',
    fontSize: 8,
    marginTop: 2,
  },
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 32,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardInfo: {
    padding: 8,
  },
});

interface VenuePdfDocumentProps {
  eventName?: string;
  items: VenueVisualizerItem[];
}

const VenuePdfDocument = ({ items, eventName }: VenuePdfDocumentProps) => {
  const date = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Propuesta de Diseño de Espacios</Text>
          {eventName && <Text style={styles.subtitle}>{eventName}</Text>}
          <Text style={styles.meta}>{date}</Text>
        </View>

        <View style={styles.grid}>
          {items
            .filter((item) => item.generatedUrl)
            .map((item, i) => {
              const styleLabel = STYLE_LABELS[item.style] || item.style;
              const roomLabel = ROOM_LABELS[item.roomType] || item.roomType;
              return (
                <View key={i} style={styles.card}>
                  <Image src={item.generatedUrl!} style={styles.image} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.badge}>{styleLabel}</Text>
                    <Text style={styles.meta}>{roomLabel}</Text>
                  </View>
                </View>
              );
            })}
        </View>

        <Text style={styles.footer}>
          Generado con IA · Bodas de Hoy · {date}
        </Text>
      </Page>
    </Document>
  );
};

export async function exportVenuePdf(
  items: VenueVisualizerItem[],
  eventName?: string,
): Promise<void> {
  const doc = <VenuePdfDocument eventName={eventName} items={items} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `propuesta-decoracion-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
