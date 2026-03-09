export interface WhatsAppSession {
  id: string;
  development?: string;
  userId?: string;
  isConnected: boolean;
  qrCode?: string;
  phoneNumber?: string;
  connectionTime?: string;
  lastActivity?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  session?: WhatsAppSession;
  qrCode?: string;
  error?: string;
}

