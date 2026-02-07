import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), '.browser-logs.json');

interface BrowserLog {
  timestamp: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'navigation' | 'click' | 'scroll' | 'network' | 'dom';
  data: unknown;
  url?: string;
  userAgent?: string;
}

// Initialize log file if it doesn't exist
function initLogFile() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify({ logs: [], lastUpdate: new Date().toISOString() }, null, 2));
  }
}

// Read logs from file
function readLogs(): { logs: BrowserLog[]; lastUpdate: string } {
  initLogFile();
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { logs: [], lastUpdate: new Date().toISOString() };
  }
}

// Write logs to file (keep last 500 logs)
function writeLogs(logs: BrowserLog[]) {
  const trimmedLogs = logs.slice(-500);
  fs.writeFileSync(
    LOG_FILE,
    JSON.stringify({ logs: trimmedLogs, lastUpdate: new Date().toISOString() }, null, 2)
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }

  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Receive new log
    try {
      const logEntry: BrowserLog = {
        timestamp: new Date().toISOString(),
        type: req.body.type || 'log',
        data: req.body.data || req.body,
        url: req.body.url,
        userAgent: req.headers['user-agent'],
      };

      const { logs } = readLogs();
      logs.push(logEntry);
      writeLogs(logs);

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to write log', details: error });
    }
  }

  if (req.method === 'GET') {
    // Read logs - optionally filter by type or limit
    const { type, limit, since } = req.query;
    let { logs, lastUpdate } = readLogs();

    if (type && typeof type === 'string') {
      logs = logs.filter((l) => l.type === type);
    }

    if (since && typeof since === 'string') {
      logs = logs.filter((l) => new Date(l.timestamp) > new Date(since));
    }

    if (limit && typeof limit === 'string') {
      logs = logs.slice(-parseInt(limit, 10));
    }

    return res.status(200).json({ logs, lastUpdate, total: logs.length });
  }

  if (req.method === 'DELETE') {
    // Clear logs
    writeLogs([]);
    return res.status(200).json({ success: true, message: 'Logs cleared' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
