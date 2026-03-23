import { redirect } from 'next/navigation';

// Las tareas pendientes están integradas en la bandeja de mensajes (/messages)
export default function TasksPage() {
  redirect('/messages');
}
