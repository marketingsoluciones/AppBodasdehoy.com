/**
 * Página de login rápido para desarrollo
 * Permite establecer las cookies de sesión rápidamente sin depender del botón de Google
 * 
 * Uso:
 * 1. Ve a https://chat-test.bodasdehoy.com/login-rapido
 * 2. Ingresa tu email
 * 3. Haz clic en "Login Rápido"
 * 4. Las cookies se establecerán automáticamente
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContextProvider } from "../context";

const LoginRapido = () => {
  const [email, setEmail] = useState("bodasdehoy.com@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { config } = AuthContextProvider();

  const handleQuickLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/dev/refresh-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Esperar un momento y recargar
        setTimeout(() => {
          const queryD = new URLSearchParams(window.location.search).get("d");
          const redirectPath = queryD || "/";
          window.location.href = redirectPath;
        }, 1000);
      } else {
        setError(data.error || "Error al hacer login");
        console.error("[Login Rápido] ❌ Error:", data);
      }
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor");
      console.error("[Login Rápido] ❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        width: "100%"
      }}>
        <h1 style={{ marginBottom: "20px", color: "#333" }}>🚀 Login Rápido</h1>
        <p style={{ marginBottom: "30px", color: "#666", fontSize: "14px" }}>
          Ingresa tu email para establecer las cookies de sesión automáticamente.
          Solo funciona en desarrollo/test.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "16px",
              boxSizing: "border-box"
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !loading) {
                handleQuickLogin();
              }
            }}
          />
        </div>

        <button
          onClick={handleQuickLogin}
          disabled={loading || !email}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#ccc" : "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "500",
            cursor: loading || !email ? "not-allowed" : "pointer",
            marginBottom: "20px"
          }}
        >
          {loading ? "⏳ Iniciando sesión..." : "✅ Login Rápido"}
        </button>

        {error && (
          <div style={{
            padding: "12px",
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c33",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            ❌ Error: {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: "12px",
            background: "#efe",
            border: "1px solid #cfc",
            borderRadius: "4px",
            color: "#3c3",
            marginBottom: "20px",
            fontSize: "14px"
          }}>
            ✅ Login exitoso! Redirigiendo...
          </div>
        )}

        <div style={{ 
          marginTop: "30px", 
          paddingTop: "20px", 
          borderTop: "1px solid #eee",
          fontSize: "12px",
          color: "#999"
        }}>
          <p><strong>Uso desde consola:</strong></p>
          <pre style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "11px"
          }}>
{`fetch('/api/dev/refresh-session', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: '${email}'}),
  credentials: 'include'
}).then(r => r.json())
 .then(d => {
   console.log(d);
   if(d.success) location.reload()
 })`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LoginRapido;
