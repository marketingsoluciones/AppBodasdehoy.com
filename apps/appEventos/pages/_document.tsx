import { Html, Head, Main, NextScript } from 'next/document';

/**
 * _document.tsx personalizado para apps/web.
 * Añade meta tags para PWA e iOS, el manifest.json y
 * configuración de viewport extendida.
 */
export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Poppins — la fuente de todos los diseños (Chat_Widget.dc.html y compañía).
            globals.css declaraba `:root { font-family: Poppins }` desde hace tiempo pero
            NADIE la cargaba: ni @font-face, ni next/font, ni este enlace. O sea que toda
            la app caía a la fuente por defecto del navegador salvo que el usuario tuviera
            Poppins instalada en su equipo, cosa que en un Mac no pasa. Los pesos son los
            que usan los diseños: 400 normal, 500 cuerpo, 600 semi, 700 títulos. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme color (Chrome Android) */}
        <meta name="theme-color" content="#f43f5e" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bodas de Hoy" />

        {/* Apple touch icon (usa el logo existente) */}
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Mobile web app */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Bodas de Hoy" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
