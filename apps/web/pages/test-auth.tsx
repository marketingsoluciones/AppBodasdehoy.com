import { useEffect, useState } from "react";
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { AuthContextProvider } from "../context";

const TestAuthPage = () => {
  const { config, user, verificationDone } = AuthContextProvider();
  const [authState, setAuthState] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      const auth = getAuth();
      setAuthState({
        appName: auth?.app?.name || "No app",
        authDomain: config?.fileConfig?.authDomain || "No authDomain",
        development: config?.development || "No development",
        domain: config?.domain || "No domain",
        currentUser: auth?.currentUser?.email || "No user",
      });

      // Check for redirect result
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log("[Test Auth] Redirect result:", result.user?.email);
            setAuthState((prev: any) => ({
              ...prev,
              redirectResult: result.user?.email || "Got result but no email",
            }));
          } else {
            console.log("[Test Auth] No redirect result");
          }
        })
        .catch((err) => {
          console.error("[Test Auth] Redirect error:", err);
          setError(err.message);
        });
    }
  }, [config]);

  const handleGoogleLogin = async () => {
    try {
      console.log("[Test Auth] Iniciando Google login...");
      setError(null);
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      console.log("[Test Auth] Auth:", auth);
      console.log("[Test Auth] Provider:", provider);
      console.log("[Test Auth] Auth domain:", auth?.app?.options?.authDomain);

      await signInWithRedirect(auth, provider);
      console.log("[Test Auth] signInWithRedirect llamado");
    } catch (err: any) {
      console.error("[Test Auth] Error:", err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Firebase Auth Test Page</h1>

      <h2>Config Status:</h2>
      <pre style={{ background: "#f0f0f0", padding: "10px" }}>
        {JSON.stringify(authState, null, 2)}
      </pre>

      <h2>Context Status:</h2>
      <pre style={{ background: "#f0f0f0", padding: "10px" }}>
        {JSON.stringify({
          verificationDone,
          userEmail: user?.email || "No user",
          userName: user?.displayName || "No name",
        }, null, 2)}
      </pre>

      {error && (
        <div style={{ background: "#ffcccc", padding: "10px", margin: "10px 0" }}>
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Test Google Login (signInWithRedirect)
        </button>
      </div>

      <div style={{ marginTop: "20px", color: "#666" }}>
        <p>Instructions:</p>
        <ol>
          <li>Check the Config Status above to verify Firebase is initialized correctly</li>
          <li>Open browser console (F12) to see debug logs</li>
          <li>Click the button to test Google login</li>
          <li>You should be redirected to Google&apos;s login page</li>
          <li>After login, you&apos;ll be redirected back here</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAuthPage;
