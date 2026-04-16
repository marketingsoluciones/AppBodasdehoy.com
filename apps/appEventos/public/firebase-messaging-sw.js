// Firebase Cloud Messaging Service Worker
// Maneja notificaciones push en background cuando la app está cerrada o minimizada

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// La config se inyecta dinámicamente via postMessage desde el cliente
// o se usa la config por defecto de bodasdehoy
let firebaseConfig = {
  apiKey: "AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM",
  authDomain: "bodasdehoy-1063.firebaseapp.com",
  projectId: "bodasdehoy-1063",
  storageBucket: "bodasdehoy-1063.appspot.com",
  messagingSenderId: "593952495916",
  appId: "1:593952495916:web:c63cf15fd16a6796f6f489",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Notificación en background (app cerrada/minimizada)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};
  const notifTitle = title || 'Bodasdehoy';
  const notifOptions = {
    body: body || '',
    icon: icon || '/favicon.png',
    badge: '/favicon.png',
    tag: data?.tag || 'default',
    data: data || {},
    requireInteraction: false,
    actions: data?.action
      ? [{ action: 'open', title: '→ Ver' }]
      : [],
  };
  self.registration.showNotification(notifTitle, notifOptions);
});

// Click en notificación: abrir/enfocar la app en la URL correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
