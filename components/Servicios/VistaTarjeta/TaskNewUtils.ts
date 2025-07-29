import { Comment } from "../../../utils/Interfaces";

// Función para limpiar HTML
export const stripHtml = (html: string): string => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// Conversor de minutos a formato legible
export const minutesToReadableFormat = (minutes: number): string => {
  if (!minutes || minutes === 0) return "0 min";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};

// Conversor de formato legible a minutos
export const readableFormatToMinutes = (value: string): number => {
  const hoursMatch = value.match(/(\d+)\s*h/);
  const minsMatch = value.match(/(\d+)\s*min/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1]) : 0;

  return hours * 60 + mins;
};

// Función para formatear fecha
export const formatDate = ({ locale, date }: { locale: string, date: string | Date }): string => {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Función para formatear hora
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Función para calcular hora de finalización
export const calculateEndTime = (startDate: string | Date, durationMinutes: number): string => {
  if (!startDate || !durationMinutes) return '';
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return formatTime(end);
};

// Función para formatear texto con límite de líneas
export const formatTextWithLineLimit = (text: string, maxChars: number, maxLines: number): string => {
  if (!text) return '';
  const lines = text.split('\n');
  const limitedLines = lines.slice(0, maxLines);
  return limitedLines.map(line =>
    line.length > maxChars ? line.substring(0, maxChars) + '...' : line
  ).join('\n');
};

// Función para ordenar comentarios por fecha
export const sortCommentsByDate = (comments: Comment[]): Comment[] => {
  return [...comments].sort((a, b) => {
    const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateA - dateB;
  });
};

// Función para verificar si los comentarios han cambiado
export const haveCommentsChanged = (prevComments: Comment[], newComments: Comment[]): boolean => {
  const prevIds = prevComments.map(c => c._id).sort().join(',');
  const newIds = newComments.map(c => c._id).sort().join(',');

  if (prevIds !== newIds || prevComments.length !== newComments.length) {
    return true;
  }

  return newComments.some((newComment, index) => {
    const oldComment = prevComments[index];
    return !oldComment ||
      oldComment._id !== newComment._id ||
      oldComment.comment !== newComment.comment ||
      oldComment.attachments?.length !== newComment.attachments?.length;
  });
};