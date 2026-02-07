import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from '../../../utils/firebaseAdmin';

/**
 * Endpoint SOLO para testing
 * Genera custom tokens de Firebase con duración extendida
 *
 * IMPORTANTE: Solo disponible en desarrollo
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo disponible en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Inicializar Firebase Admin (app por defecto)
    initializeFirebaseAdmin();
    const auth = admin.auth();

    // Generar custom token con duración de 1 hora
    const customToken = await auth.createCustomToken(userId, {
      // Claims adicionales si necesitas
      testing: true,
      generatedAt: Date.now(),
    });

    // Obtener información del usuario
    const userRecord = await auth.getUser(userId);

    res.status(200).json({
      success: true,
      customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
      expiresIn: 3600, // 1 hora en segundos
      message: 'Token generado exitosamente. Usa signInWithCustomToken() en el cliente.',
    });
  } catch (error: any) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      details: error.message
    });
  }
}
