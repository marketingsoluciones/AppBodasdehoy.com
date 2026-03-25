module.exports = {
  apps: [
    // ── Entorno TEST (producción local, next start) ──────────────────────────
    {
      name: 'app-test',
      script: './apps/appEventos/start.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'chat-test',
      script: './apps/chat-ia/start.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G'
    },

    // ── Entorno DEV (next dev, hot reload) ──────────────────────────────────
    {
      name: 'app-dev',
      script: './apps/appEventos/dev.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'chat-dev',
      script: './apps/chat-ia/dev.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '3G'
    }
  ]
};
