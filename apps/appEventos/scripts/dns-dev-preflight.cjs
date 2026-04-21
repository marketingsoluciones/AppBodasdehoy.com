'use strict';
/**
 * Solo se carga con: node -r ./scripts/dns-dev-preflight.cjs … (scripts "dev" del package.json).
 * No entra en Webpack. Desactivar: DNS_OVERRIDE_DISABLED=1
 */
(function dnsDevPreflight() {
  if (process.env.DNS_OVERRIDE_DISABLED === '1') return;
  try {
    const dns = require('dns');
    dns.setDefaultResultOrder('ipv4first');
    const servers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (servers.length) {
      dns.setServers(servers);
      console.info('[dns-dev-preflight]', dns.getServers().join(', '));
    }
  } catch (e) {
    console.warn('[dns-dev-preflight]', e && e.message);
  }
})();
