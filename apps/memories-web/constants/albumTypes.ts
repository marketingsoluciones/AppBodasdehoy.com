import type { AlbumType } from '@bodasdehoy/memories';

export type AlbumTypeConfig = { label: string; icon: string; from: string; to: string };

export const ALBUM_TYPE_CONFIG: Record<string, AlbumTypeConfig> = {
  general:              { label: 'General',             icon: '📁', from: '#6366f1', to: '#4f46e5' },
  guestbook:            { label: 'Libro de visitas',    icon: '📖', from: '#f43f5e', to: '#e11d48' },
  photographer:         { label: 'Fotógrafo oficial',   icon: '📷', from: '#1e293b', to: '#0f172a' },
  wedding_childhood:    { label: 'Infancia',            icon: '👶', from: '#f59e0b', to: '#d97706' },
  wedding_engagement:   { label: 'Pedida de mano',      icon: '💍', from: '#ec4899', to: '#db2777' },
  wedding_bachelor:     { label: 'Despedida',           icon: '🎉', from: '#a855f7', to: '#7c3aed' },
  wedding_ceremony:     { label: 'Ceremonia',           icon: '💒', from: '#f43f5e', to: '#e11d48' },
  wedding_reception:    { label: 'Recepción/Banquete',  icon: '🥂', from: '#10b981', to: '#0d9488' },
  wedding_honeymoon:    { label: 'Luna de miel',        icon: '✈️',  from: '#3b82f6', to: '#2563eb' },
  birthday_party:       { label: 'La fiesta',           icon: '🎂', from: '#f97316', to: '#ea580c' },
  birthday_history:     { label: 'Historia de vida',    icon: '🎞️',  from: '#8b5cf6', to: '#7c3aed' },
  birthday_surprise:    { label: 'Sorpresa',            icon: '🎁', from: '#06b6d4', to: '#0891b2' },
  xv_childhood:         { label: 'Infancia',            icon: '🌸', from: '#f9a8d4', to: '#ec4899' },
  xv_preparation:       { label: 'Preparación',         icon: '💄', from: '#e879f9', to: '#c026d3' },
  xv_ceremony:          { label: 'Ceremonia',           icon: '👑', from: '#fbbf24', to: '#d97706' },
  xv_party:             { label: 'La fiesta',           icon: '🪩', from: '#a855f7', to: '#7c3aed' },
  graduation_ceremony:  { label: 'Graduación',          icon: '🎓', from: '#1e40af', to: '#1d4ed8' },
  graduation_memories:  { label: 'Recuerdos',           icon: '🏫', from: '#059669', to: '#047857' },
  graduation_trip:      { label: 'Viaje de fin de curso', icon: '🗺️', from: '#0891b2', to: '#0e7490' },
  trip_day:             { label: 'Día del viaje',       icon: '📍', from: '#16a34a', to: '#15803d' },
  trip_destination:     { label: 'Destino',             icon: '🌍', from: '#2563eb', to: '#1d4ed8' },
  corporate_event:      { label: 'Evento',              icon: '🏢', from: '#475569', to: '#334155' },
  corporate_team:       { label: 'Equipo',              icon: '🤝', from: '#0369a1', to: '#075985' },
  communion:            { label: 'Primera comunión',    icon: '✝️',  from: '#d4b483', to: '#b8972a' },
  bar_mitzvah:          { label: 'Bar/Bat Mitzvah',     icon: '✡️',  from: '#3b82f6', to: '#1d4ed8' },
  baptism:              { label: 'Bautizo',             icon: '🕊️',  from: '#7dd3fc', to: '#38bdf8' },
};

export const FALLBACK_GRADIENTS: [string, string][] = [
  ['#f43f5e', '#e11d48'],
  ['#a855f7', '#7c3aed'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#0d9488'],
  ['#3b82f6', '#2563eb'],
  ['#ec4899', '#db2777'],
  ['#f97316', '#ea580c'],
  ['#06b6d4', '#0891b2'],
];

export const ALBUM_TYPE_GROUPS: { label: string; types: AlbumType[] }[] = [
  { label: 'General', types: ['general', 'guestbook', 'photographer'] },
  { label: 'Boda', types: ['wedding_childhood', 'wedding_engagement', 'wedding_bachelor', 'wedding_ceremony', 'wedding_reception', 'wedding_honeymoon'] },
  { label: 'Cumpleaños', types: ['birthday_party', 'birthday_history', 'birthday_surprise'] },
  { label: 'Quinceañera / Sweet 16', types: ['xv_childhood', 'xv_preparation', 'xv_ceremony', 'xv_party'] },
  { label: 'Graduación', types: ['graduation_ceremony', 'graduation_memories', 'graduation_trip'] },
  { label: 'Viaje', types: ['trip_day', 'trip_destination'] },
  { label: 'Corporativo', types: ['corporate_event', 'corporate_team'] },
  { label: 'Celebraciones religiosas', types: ['communion', 'bar_mitzvah', 'baptism'] },
];

export const CATEGORY_META: { key: string; label: string; icon: string; types: AlbumType[] }[] = [
  { key: 'general',    label: 'General',     icon: '📁', types: ['general', 'guestbook', 'photographer'] },
  { key: 'boda',       label: 'Boda',        icon: '💍', types: ['wedding_ceremony', 'wedding_reception', 'wedding_engagement', 'wedding_bachelor', 'wedding_childhood', 'wedding_honeymoon'] },
  { key: 'cumple',     label: 'Cumpleaños',  icon: '🎂', types: ['birthday_party', 'birthday_surprise', 'birthday_history'] },
  { key: 'xv',         label: 'XV / Sweet 16', icon: '👑', types: ['xv_ceremony', 'xv_party', 'xv_preparation', 'xv_childhood'] },
  { key: 'graduacion', label: 'Graduación',  icon: '🎓', types: ['graduation_ceremony', 'graduation_trip', 'graduation_memories'] },
  { key: 'viaje',      label: 'Viaje',       icon: '✈️',  types: ['trip_destination', 'trip_day'] },
  { key: 'corp',       label: 'Corporativo', icon: '🏢', types: ['corporate_event', 'corporate_team'] },
  { key: 'religion',   label: 'Religioso',   icon: '🕊️',  types: ['baptism', 'communion', 'bar_mitzvah'] },
];
