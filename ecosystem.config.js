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
      max_memory_restart: '4G',  // next start (prod) necesita más de 2G con el bundle de LobeChat
      restart_delay: 30000,       // 30s entre reinicios para evitar loops
      max_restarts: 5,            // parar tras 5 fallos (no loop infinito)
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
      max_memory_restart: '6G',  // Turbopack primera compilación usa 4-5G — con 3G entraba en bucle
      restart_delay: 60000,       // 60s entre reinicios (compilación tarda varios min)
      max_restarts: 10,           // parar tras 10 fallos para diagnóstico
    },
    {
      name: 'memories-dev',
      script: './apps/memories-web/dev.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M'
    },
    {
      name: 'editor-dev',
      script: './apps/editor-web/dev.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M'
    }
  ]
};
