module.exports = {
  apps: [
    {
      name: 'app-test',
      script: './apps/web/start.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'chat-test',
      script: './apps/copilot/start.sh',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G'
    }
  ]
};
