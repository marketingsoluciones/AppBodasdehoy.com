'use client';

import { Button, Modal, message } from 'antd';
import { createStyles } from 'antd-style';
import { QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const useStyles = createStyles(({ css, token }) => ({
  errorMessage: css`
    color: ${token.colorError};
    margin-top: 16px;
    text-align: center;
  `,
  instructions: css`
    margin-top: 16px;
    padding: 12px;
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    font-size: 12px;
    color: ${token.colorTextSecondary};
    text-align: center;
  `,
  overlay: css`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `,
  scanArea: css`
    width: 250px;
    height: 250px;
    border: 3px solid ${token.colorPrimary};
    border-radius: ${token.borderRadius}px;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  `,
  scannerContainer: css`
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  `,
  video: css`
    width: 100%;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
  `,
}));

interface QRScannerProps {
  onClose?: () => void;
  onScan?: (url: string) => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      
      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', 
          height: { ideal: 720 },
          // Cámara trasera en móviles
width: { ideal: 1280 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }

      // ✅ Usar la API nativa de detección de códigos de barras/QR del navegador
      // Si está disponible (Chrome/Edge Android)
      if ('BarcodeDetector' in window) {
        // @ts-ignore - BarcodeDetector puede no estar en los tipos
        const barcodeDetector = new BarcodeDetector({
          formats: ['qr_code'],
        });

        const detectQR = async () => {
          if (!videoRef.current || !isScanning) return;

          try {
            // @ts-ignore
            const barcodes = await barcodeDetector.detect(videoRef.current);
            
            if (barcodes.length > 0) {
              const qrData = barcodes[0].rawValue;
              handleQRScanned(qrData);
            }
          } catch {
            // Ignorar errores de detección (puede fallar si no hay QR visible)
          }
        };

        scanIntervalRef.current = setInterval(detectQR, 500); // Escanear cada 500ms
      } else {
        // Fallback: Mostrar instrucciones para usar app externa o copiar URL
        setError('Tu navegador no soporta escaneo de QR. Puedes copiar el enlace manualmente.');
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.'
          : err.name === 'NotFoundError'
            ? 'No se encontró ninguna cámara en tu dispositivo.'
            : 'No se pudo acceder a la cámara. Asegúrate de tener una cámara conectada y permisos otorgados.'
      );
      setIsScanning(false);
    }
  }, [isScanning]);

  const handleQRScanned = useCallback((url: string) => {
    stopScanning();
    
    // Detectar si es un enlace compartido de álbum
    if (url.includes('/memories/shared/')) {
      const token = url.split('/memories/shared/')[1]?.split('?')[0];
      if (token) {
        message.success('QR escaneado correctamente. Redirigiendo...');
        router.push(`/memories/shared/${token}`);
        setIsOpen(false);
        onClose?.();
        return;
      }
    }
    
    // Si tiene un callback personalizado
    if (onScan) {
      onScan(url);
      setIsOpen(false);
      onClose?.();
    } else {
      message.info(`QR escaneado: ${url}`);
    }
  }, [router, onScan, onClose, stopScanning]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    stopScanning();
    setIsOpen(false);
    onClose?.();
  }, [stopScanning, onClose]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <>
      <Button
        icon={<QrCode size={16} />}
        onClick={handleOpen}
        type="default"
      >
        Escanear QR
      </Button>

      <Modal
        cancelText="Cerrar"
        okText={isScanning ? 'Detener Escaneo' : 'Iniciar Escáner'}
        onCancel={handleClose}
        onOk={isScanning ? stopScanning : startScanning}
        open={isOpen}
        title="Escanear QR Code"
        width={600}
      >
        <div className={styles.scannerContainer}>
          {!isScanning ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <QrCode size={64} style={{ color: theme.colorTextSecondary, marginBottom: 16 }} />
              <p style={{ color: theme.colorTextSecondary, marginBottom: 24 }}>
                Haz clic en "Iniciar Escáner" para activar la cámara y escanear un código QR
              </p>
              {error && <div className={styles.errorMessage}>{error}</div>}
            </div>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <video
                  autoPlay
                  className={styles.video}
                  playsInline
                  ref={videoRef}
                  style={{ display: 'block' }}
                />
                <div className={styles.overlay}>
                  <div className={styles.scanArea} />
                </div>
              </div>
              {error && <div className={styles.errorMessage}>{error}</div>}
              <div className={styles.instructions}>
                <p>🔍 Apunta la cámara hacia el código QR</p>
                <p style={{ fontSize: 11, marginTop: 8 }}>
                  Si tu navegador no soporta escaneo automático, puedes copiar el enlace del QR manualmente
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}




































