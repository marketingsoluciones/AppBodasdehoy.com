import { getAuth } from "firebase/auth";
import { Comment, Event, Itinerary, Task } from "../../../utils/Interfaces";

export const getDateString = (value: Date | string) => {
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const getTimeString = (value: Date | string) => {
  const d = new Date(value);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Función para generar enlace de Google Calendar
export const generateGoogleCalendarLink = (task: Task, event: Event): string => {
  // Formatear la fecha y hora
  const taskDate = new Date(task.fecha);
  // Formatear fechas para Google Calendar (formato: YYYYMMDDTHHMMSSZ)
  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  let startDateStr: string;
  let endDateStr: string;
  if (task.horaActiva) {
    // Evento con hora específica
    const startTime = new Date(task.fecha);
    const endTime = new Date(startTime.getTime() + (task.duracion || 30) * 60000); // duración en minutos
    startDateStr = formatDateForGoogle(startTime);
    endDateStr = formatDateForGoogle(endTime);
  } else {
    // Evento de día completo
    const startOfDay = new Date(taskDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(taskDate);
    endOfDay.setHours(23, 59, 59, 999);
    startDateStr = formatDateForGoogle(startOfDay);
    endDateStr = formatDateForGoogle(endOfDay);
  }
  // Codificar los parámetros para URL
  const title = encodeURIComponent(task.descripcion || 'Tarea del evento');
  const details = encodeURIComponent(task.tips || task.descripcion || '');
  const location = encodeURIComponent(event?.nombre || 'Evento');
  const attendees = task.responsable?.map(elem => {
    const userDetail = event?.detalles_compartidos_array?.find(user => user.displayName === elem || user.email === elem);
    return userDetail?.email || '';
  });
  attendees.unshift(getAuth().currentUser?.email || '');
  const attendeesParam = attendees ? `&add=${encodeURIComponent(attendees.filter(email => email).join(','))}` : '';
  const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}${attendeesParam}`;
  return link;
};

interface CopyToClipboard {
  link: string
  navigator: any
  toast: any
  t: any
  document: any
}
const copyToClipboard = ({ link, navigator, toast, t, document }: CopyToClipboard) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      toast('success', t('Enlace copiado al portapapeles'));
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast('success', t('Enlace copiado al portapapeles'));
    });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast('success', t('Enlace copiado al portapapeles'));
  }
}
interface HandleCopyLink {
  task: Task
  type: "task" | "calendar"
  event: Event
  navigator: any
  toast: any
  t: any
  document: any
  itinerario: Itinerary
}
export const handleCopyLink = ({ task, type, event, navigator, toast, t, document, itinerario }: HandleCopyLink) => {
  if (type === "calendar") {
    const calendarLink = generateGoogleCalendarLink(task, event);
    console.log(calendarLink);
    copyToClipboard({ link: calendarLink, navigator, toast, t, document });
  } else {
    copyToClipboard({ link: `${window.location.origin}/servicios?event=${event?._id}&itinerario=${itinerario?._id}&task=${task?._id}`, navigator, toast, t, document });
  }
};

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