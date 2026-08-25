import { FC, ReactNode, useEffect, useState } from "react";
import { AuthContextProvider } from "../../../context";
import { phoneUtil, useAuthentication } from "../../../utils/Authentication";
import { GoogleProvider, FacebookProvider } from "../../../firebase";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithCustomToken, updateProfile, UserCredential } from "firebase/auth";
import { fetchApiBodas, queries } from "../../../utils/Fetching";
import { setCrossAppIdToken } from "@bodasdehoy/shared/auth";
import { useToast } from "../../../hooks/useToast";
import { useActivity } from "../../../hooks/useActivity";
import { useTranslation } from "react-i18next";

/**
 * LoginStudio — rediseño visual (gate `?studio`) fiel a Login.dc.html.
 * SOLO cambia el aspecto: reusa EXACTAMENTE el mismo backend que el flujo legacy.
 *  - Login (email/Google/Facebook) → `useAuthentication().signIn`
 *  - Recuperar contraseña → `useAuthentication().resetPassword`
 *  - Registro → mismo backend que `FormRegister`: `createUserWithEmailAndPassword`
 *    (+ fallback `createUserWithPassword`/`signInWithCustomToken` si el email ya existe)
 *    → `updateProfile(displayName)` → `createUser({role,uid,email,phoneNumber})`.
 * La auth "demo" del HTML (setTimeout) se sustituye por las llamadas reales.
 *
 * NOTA (validación backend): el HTML define 3 perfiles nuevos (Wedding planner /
 * Organizador / Novios) distintos de los legacy (novia/novio/otro). `createUser`
 * acepta `role:[String]` libre y ningún flujo de negocio ramifica por ese valor
 * (solo se compara con 'admin'), así que se guardan tal cual, sin romper nada.
 */

interface Props {
  logo?: ReactNode;
  config?: any;
  whoYouAre: string;
  setStage: (s: string) => void;
  onClose: () => void;
  /** Vista inicial (p.ej. "register" cuando se llega con ?q=register). */
  initialView?: "login" | "register";
}

type View = "login" | "forgot" | "sent" | "register" | "regform";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const eye = (open: boolean) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.1-5.9M9.9 4.2A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-2.9 3.9" />
        <path d="M1 1l22 22" />
      </>
    )}
  </svg>
);

// Iconos de perfil (PNG incrustados en el HTML, extraídos a /studio). El filtro
// grayscale del contenedor los apaga cuando el perfil no está seleccionado.
const ROLES: { key: string; label: string; icon: ReactNode }[] = [
  { key: "wedding planner", label: "Wedding planner", icon: <img src="/studio/role-wp.png" alt="" style={{ width: 46, height: 46, objectFit: "contain" }} /> },
  { key: "organizador", label: "Organizador de eventos", icon: <img src="/studio/role-organizador.png" alt="" style={{ width: 46, height: 46, objectFit: "contain" }} /> },
  { key: "novios", label: "Novios", icon: <img src="/studio/role-novios.png" alt="" style={{ width: 50, height: 50, objectFit: "contain" }} /> },
];

const LoginStudio: FC<Props> = ({ logo, config, whoYouAre, setStage, onClose, initialView }) => {
  const { SetWihtProvider, setIsStartingRegisterOrLogin, setUser, setVerificationDone, geoInfo, linkMedia, preregister } = AuthContextProvider() as any;
  const { signIn, resetPassword, getSessionCookie } = useAuthentication();
  const toast = useToast();
  const { t } = useTranslation();
  const [updateActivity, updateActivityLink] = useActivity() as any;

  const [view, setView] = useState<View>(initialView === "register" ? "register" : "login");
  // `?q=register` llega como stage async → initialView cambia login→register tras
  // el 1er render; sincronizamos la vista para abrir en "¿Quién eres?" (no login).
  useEffect(() => {
    if (initialView === "register") setView("register");
  }, [initialView]);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [authErr, setAuthErr] = useState("");

  const [fEmail, setFEmail] = useState("");
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // Registro
  const [role, setRole] = useState<string>("");
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPw, setRPw] = useState("");
  const [rShowPw, setRShowPw] = useState(false);
  const [rPhone, setRPhone] = useState("");
  const [rLoading, setRLoading] = useState(false);
  const [rNameErr, setRNameErr] = useState("");
  const [rEmailErr, setREmailErr] = useState("");
  const [rPwErr, setRPwErr] = useState("");
  const [rAuthErr, setRAuthErr] = useState("");

  const ccNum = phoneUtil?.getCountryCodeForRegion(geoInfo?.ipcountry);
  const countryCode = "+" + (ccNum ? ccNum : "58");

  const translateError = (err: any): string => {
    const code = err?.code || "";
    if (
      code === "auth/wrong-password" || code === "auth/invalid-credential" ||
      code === "auth/invalid-login-credentials" || code === "auth/user-not-found" || code === "auth/invalid-email"
    ) return "Usuario o contraseña inválida";
    if (code === "auth/too-many-requests") return "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
    if (code === "auth/user-disabled") return "Esta cuenta está deshabilitada. Contacta con soporte.";
    if (code === "auth/weak-password") return "La contraseña es demasiado débil (mínimo 6 caracteres).";
    if (err?.message?.includes("Timeout Mongo") || err?.message?.includes("Mongo save user"))
      return "El servidor tardó demasiado. Reintenta en unos segundos.";
    return err?.message || "No se pudo completar. Reintenta.";
  };

  const submit = async () => {
    if (loading) return;
    const em = email.trim();
    const emErr = em === "" ? "Escribe tu email" : EMAIL_RE.test(em) ? "" : "Ese email no parece válido";
    const pErr = pw === "" ? "Escribe tu contraseña" : "";
    setEmailErr(emErr); setPwErr(pErr); setAuthErr("");
    if (emErr || pErr) return;
    setLoading(true);
    try {
      await signIn({ type: "credentials", payload: { identifier: em, password: pw }, setStage, setIsStartingRegisterOrLogin });
    } catch (err: any) {
      setAuthErr(translateError(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setAuthErr(""); setRAuthErr("");
    try {
      await signIn({ type: "provider", payload: GoogleProvider(), setStage, whoYouAre: role || whoYouAre, setIsStartingRegisterOrLogin });
    } catch (err: any) { view === "regform" ? setRAuthErr(translateError(err)) : setAuthErr(translateError(err)); }
  };

  const facebook = async () => {
    setAuthErr(""); setRAuthErr("");
    try {
      await signIn({ type: "provider", payload: FacebookProvider, setStage, whoYouAre: role || whoYouAre, setIsStartingRegisterOrLogin });
    } catch (err: any) { view === "regform" ? setRAuthErr(translateError(err)) : setAuthErr(translateError(err)); }
  };

  const sendLink = async () => {
    if (fLoading) return;
    const em = fEmail.trim();
    const err = em === "" ? "Escribe tu email" : EMAIL_RE.test(em) ? "" : "Ese email no parece válido";
    setFErr(err);
    if (err) return;
    setFLoading(true); setResent(false);
    try {
      await resetPassword({ identifier: em }, () => setView("sent"));
    } finally { setFLoading(false); }
  };

  const goRegister = () => {
    // Flujos especiales (invitación media / preregistro) siguen usando el legacy.
    if (linkMedia != null || preregister) {
      setStage("register"); SetWihtProvider(false);
      try { signOut(getAuth()); } catch { }
      return;
    }
    setRAuthErr(""); setRNameErr(""); setREmailErr(""); setRPwErr("");
    setView("register");
  };

  // Crear cuenta — MISMO backend que FormRegister (camino estándar linkMedia==null).
  const handleRegister = async () => {
    if (rLoading) return;
    const nm = rName.trim(), em = rEmail.trim();
    const e1 = nm === "" ? "Escribe tu nombre" : "";
    const e2 = em === "" ? "Escribe tu email" : EMAIL_RE.test(em) ? "" : "Ese email no parece válido";
    const e3 = rPw === "" ? "Escribe una contraseña" : rPw.length < 6 ? "Mínimo 6 caracteres" : "";
    setRNameErr(e1); setREmailErr(e2); setRPwErr(e3); setRAuthErr("");
    if (e1 || e2 || e3) return;
    setRLoading(true);
    let UserFirebase: any = null;
    try {
      setIsStartingRegisterOrLogin(true);
      try {
        const cred: UserCredential = await createUserWithEmailAndPassword(getAuth(), em, rPw);
        UserFirebase = cred.user;
        const idToken = await cred.user.getIdToken();
        if (idToken) setCrossAppIdToken(idToken);
      } catch (error: any) {
        if (error?.code === "auth/email-already-in-use") {
          const result = await fetchApiBodas({ query: queries.createUserWithPassword, variables: { email: em, password: rPw }, development: config?.development });
          if (result === "apiBodas/email-already-in-use") {
            setRAuthErr("Ese email ya está registrado. Inicia sesión.");
            setRLoading(false);
            return;
          }
          const cred: UserCredential = await signInWithCustomToken(getAuth(), result);
          UserFirebase = cred.user;
          const idToken = await cred.user.getIdToken();
          if (idToken) setCrossAppIdToken(idToken);
          await getSessionCookie(idToken);
        } else {
          setRAuthErr(translateError(error));
          setRLoading(false);
          return;
        }
      }
      const digits = rPhone.replace(/\D/g, "");
      const phone = digits ? `${countryCode}${digits}` : countryCode;
      await updateProfile(UserFirebase, { displayName: nm });
      const moreInfo: any = await fetchApiBodas({
        query: queries.createUser,
        variables: { role, uid: UserFirebase.uid, email: UserFirebase?.email, phoneNumber: phone.length < 5 ? undefined : phone },
        development: config?.development,
      });
      setUser({ ...UserFirebase, ...(moreInfo || {}), displayName: UserFirebase?.reloadUserInfo?.displayName ?? nm });
      toast("success", t("successfulsessionregistration"));
      try { updateActivity("registered"); updateActivityLink("registered"); } catch { }
      setVerificationDone(true);
      // El redirect lo hace el useEffect de pages/login.tsx (user + verificationDone).
    } catch (err: any) {
      setRAuthErr(translateError(err));
    } finally {
      setRLoading(false);
    }
  };

  const brandHost = (() => {
    const d = typeof config?.pathDomain === "string" ? config.pathDomain.trim() : "";
    const raw = d || "bodasdehoy.com";
    try { return new URL(raw.startsWith("http") ? raw : "https://" + raw).host.replace(/^www\./, ""); }
    catch { return raw.replace(/^https?:\/\//, "").replace(/^www\./, ""); }
  })();
  const brandHref = brandHost.startsWith("http") ? brandHost : "https://" + brandHost;

  const canSubmit = email.trim() !== "" && pw !== "" && !loading;
  const canCreate = rName.trim() !== "" && rEmail.trim() !== "" && rPw !== "";
  const inSt: any = { width: "100%", padding: "11px 15px", borderRadius: 10, font: "500 13.5px Poppins", color: "#3A3A42", outline: "none", background: "#fff" };
  const provBtn: any = { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "10px 16px", borderRadius: 10, background: "#fff", border: "1.5px solid #E7E7EA", color: "#3A3A42", font: "600 13px Poppins", cursor: "pointer" };
  const lbl: any = { display: "block", font: "600 12px Poppins", color: "#6b6b72", marginBottom: 5 };
  const iconWrap: any = { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" };

  const GoogleIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.8z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.2 17.2C3.2 21.2 7.3 24 12 24z" /><path fill="#FBBC05" d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.2 6.8C.4 8.4 0 10.1 0 12s.4 3.6 1.2 5.2l3.9-2.9z" /><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.4-3.3C17 1.1 15.2 0 12 0 7.3 0 3.2 2.8 1.2 6.8l3.9 2.9C6 6.7 8.8 4.7 12 4.7z" /></svg>
  );
  const FbIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
  );

  const showHeader = view !== "register";
  const headSub =
    view === "login" ? "Inicia sesión para seguir organizando tus eventos" :
    view === "forgot" ? "Te enviaremos un enlace para restablecerla" :
    view === "regform" ? "Completa tus datos para crear tu cuenta" :
    view === "sent" ? "Un paso más y recuperas el acceso" : "";

  const topBack = () => {
    if (view === "regform") { setView("register"); return; }
    if (view !== "login") { setView("login"); return; }
    onClose();
  };

  return (
    <div style={{ height: "100vh", minHeight: 640, display: "flex", background: "#fff", overflow: "hidden", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ls-fadein{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes ls-spin{to{transform:rotate(360deg);}}
        .ls-in:focus{border-color:#EF5B94 !important;}
        .ls-prov:hover{border-color:#c8c8ce !important;background:#faf9fb !important;}
        .ls-primary:hover:not(:disabled){background:#D83E7C !important;}
        .ls-link{color:#EF5B94;text-decoration:none;}
        .ls-link:hover{color:#D83E7C;}
        .ls-eye:hover{background:#faf9fb;color:#6b6b72;}
        .ls-topback:hover{color:#3A3A42 !important;}
        .ls-role:hover{filter:none !important;transform:scale(1.04);}
        @media(max-width:820px){.ls-left{display:none !important;}}
        /* MÓVIL (fiel al HTML): sin píldora de marca y formulario SIN tarjeta (va sobre el fondo). */
        @media(max-width:560px){
          .ls-brandpill{display:none !important;}
          .ls-card{background:transparent !important;border:none !important;box-shadow:none !important;padding:2px 0 0 !important;}
          .ls-roles-desk{display:none !important;}
          .ls-roles-mob{display:flex !important;}
        }
      ` }} />

      {/* PANEL IZQUIERDO · marca */}
      <div className="ls-left" style={{ width: 440, flex: "none", color: "#fff", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "#D83E7C" }}>
        {/* Foto floral del panel (image-slot del HTML, extraída del bundle) — bajo el gradiente */}
        <img src="/login-hero.jpg" alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(200deg,rgba(216,62,124,.22) 0%,rgba(216,62,124,.5) 55%,rgba(122,20,60,.85) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "56px 46px 52px", pointerEvents: "none" }}>
          <div style={{ font: "700 31px/1.25 Poppins", marginBottom: 10, textShadow: "0 2px 14px rgba(0,0,0,.2)" }}>Todos tus eventos, <span style={{ color: "#FCE7F0" }}>bajo control</span></div>
          <div style={{ font: "500 13px/1.55 Poppins", marginBottom: 26, textShadow: "0 1px 8px rgba(0,0,0,.2)" }}>La herramienta profesional para wedding planners, organizadores y novios.</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, alignSelf: "flex-start", padding: "10px 16px", borderRadius: 999, background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.4)", backdropFilter: "blur(6px)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.8 4.7 1.2-4.7 1.2L12 15l-1.8-4.8L5.5 9l4.7-1.2z" /><path d="M18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" /></svg>
            <span style={{ font: "600 12.5px Poppins", color: "#fff", whiteSpace: "nowrap" }}>Copiloto IA para planificar</span>
            <span style={{ padding: "2px 9px", borderRadius: 999, background: "#fff", color: "#D83E7C", font: "700 9.5px Poppins", letterSpacing: ".5px" }}>NUEVO</span>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO · formulario */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#faf9fb", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 30px", flex: "none" }}>
          <button type="button" onClick={topBack} className="ls-topback" style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "600 13px Poppins", color: "#6b6b72", textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Volver
          </button>
          <a className="ls-brandpill" href={brandHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12.5px Poppins", color: "#6b6b72", textDecoration: "none", border: "1.5px solid #E7E7EA", borderRadius: 10, padding: "7px 14px", background: "#fff" }}>Ir a <b style={{ color: "#3A3A42" }}>{brandHost}</b><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M7 17L17 7M9 7h8v8" /></svg></a>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", overflow: "auto", padding: "0 20px 16px", minHeight: 0 }}>
          <div style={{ width: 400, maxWidth: "100%", margin: "auto", padding: "16px 0", animation: "ls-fadein .4s ease" }}>
            {showHeader && (
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                {logo ? <div style={{ display: "flex", justifyContent: "center", maxWidth: 225, margin: "0 auto" }}>{logo}</div> : <div style={{ font: "800 24px Poppins", color: "#EF5B94" }}>{config?.brand || "Bodas de Hoy"}</div>}
                {!!headSub && <div style={{ font: "500 12.5px Poppins", color: "#8a8a90", marginTop: 8 }}>{headSub}</div>}
              </div>
            )}

            {view === "login" && (
              <>
                <div className="ls-card" style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 20, padding: "24px 28px 22px", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
                    <button type="button" className="ls-prov" style={provBtn} onClick={google}>{GoogleIcon}Continuar con Google</button>
                    <button type="button" className="ls-prov" style={provBtn} onClick={facebook}>{FbIcon}Continuar con Facebook</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: "#ececef" }} />
                    <span style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>o con tu email</span>
                    <div style={{ flex: 1, height: 1, background: "#ececef" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label htmlFor="ls-email" style={lbl}>Email</label>
                      <input id="ls-email" className="ls-in" type="email" autoComplete="email" value={email} placeholder="nombre@correo.com"
                        onChange={(e) => { setEmail(e.target.value); setEmailErr(""); setAuthErr(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                        style={{ ...inSt, border: `1.5px solid ${emailErr ? "#D83E7C" : "#E7E7EA"}` }} />
                      {emailErr && <div style={{ font: "500 11.5px Poppins", color: "#D83E7C", marginTop: 5 }}>{emailErr}</div>}
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                        <label htmlFor="ls-pw" style={{ font: "600 12px Poppins", color: "#6b6b72" }}>Contraseña</label>
                        <a href="#" className="ls-link" onClick={(e) => { e.preventDefault(); setFEmail(email); setFErr(""); setView("forgot"); }} style={{ font: "500 11.5px Poppins" }}>¿Olvidaste tu contraseña?</a>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input id="ls-pw" className="ls-in" type={showPw ? "text" : "password"} autoComplete="current-password" value={pw}
                          onChange={(e) => { setPw(e.target.value); setPwErr(""); setAuthErr(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                          style={{ ...inSt, padding: "11px 42px 11px 15px", border: `1.5px solid ${pwErr ? "#D83E7C" : "#E7E7EA"}` }} />
                        <button type="button" className="ls-eye" title="Mostrar u ocultar contraseña" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}>{eye(showPw)}</button>
                      </div>
                      {pwErr && <div style={{ font: "500 11.5px Poppins", color: "#D83E7C", marginTop: 5 }}>{pwErr}</div>}
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
                      <span onClick={() => setRemember(!remember)} style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${remember ? "#EF5B94" : "#cfced4"}`, background: remember ? "#EF5B94" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        {remember && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                      </span>
                      <span onClick={() => setRemember(!remember)} style={{ font: "500 12.5px Poppins", color: "#6b6b72" }}>Mantener sesión iniciada</span>
                    </label>
                    {authErr && (
                      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 15px", borderRadius: 999, background: "#FBE4EF", border: "1px solid #f2b9d3" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D83E7C" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                        <span style={{ font: "600 12px Poppins", color: "#D83E7C" }} role="alert" data-testid="login-inline-error">{authErr}</span>
                      </div>
                    )}
                    <button type="button" className="ls-primary" onClick={submit} disabled={!canSubmit} style={{ width: "100%", padding: 12, borderRadius: 10, background: canSubmit || loading ? "#EF5B94" : "#f2c9d9", border: "none", color: "#fff", font: "600 14px Poppins", cursor: canSubmit ? "pointer" : "default", boxShadow: canSubmit ? "0 6px 16px rgba(239,91,148,.3)" : "none", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                      {loading && <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "ls-spin .8s linear infinite", display: "inline-block" }} />}
                      {loading ? "Iniciando sesión…" : "Iniciar sesión"}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "center", font: "500 12.5px Poppins", color: "#6b6b72", marginTop: 14 }}>¿Aún no tienes cuenta? <a href="#" className="ls-link" onClick={(e) => { e.preventDefault(); goRegister(); }} style={{ fontWeight: 600 }}>Regístrate gratis</a></div>
              </>
            )}

            {view === "register" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ font: "600 24px Poppins", color: "#EF5B94", marginBottom: 34 }}>¿Quién eres?</div>
                {/* ESCRITORIO: roles en fila (columnas con círculo) */}
                <div className="ls-roles-desk" style={{ display: "flex", justifyContent: "center", gap: 30, marginBottom: 36, flexWrap: "nowrap" }}>
                  {ROLES.map((r) => {
                    const sel = role === r.key;
                    return (
                      <button key={r.key} type="button" onClick={() => setRole(r.key)} style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <span className="ls-role" style={{ width: 96, height: 96, borderRadius: "50%", background: "#f0f0f2", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", filter: sel ? "none" : "grayscale(1) opacity(.55)", transition: "filter .2s, transform .2s", boxShadow: sel ? "0 8px 20px rgba(239,91,148,.28)" : "none" }}>{r.icon}</span>
                        <span style={{ font: "500 15px Poppins", color: sel ? "#EF5B94" : "#6b6b72", textAlign: "center" }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* MÓVIL: roles apilados como tarjetas (fiel al HTML) */}
                <div className="ls-roles-mob" style={{ display: "none", flexDirection: "column", gap: 14, marginBottom: 30, textAlign: "left" }}>
                  {ROLES.map((r) => {
                    const sel = role === r.key;
                    return (
                      <button key={r.key} type="button" onClick={() => setRole(r.key)} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: `1.5px solid ${sel ? "#EF5B94" : "#f0f0f2"}`, borderRadius: 16, padding: "14px 18px", minHeight: 76, width: "100%", cursor: "pointer" }}>
                        <span style={{ width: 56, height: 56, flex: "none", borderRadius: "50%", background: "#f0f0f2", display: "flex", alignItems: "center", justifyContent: "center", filter: sel ? "none" : "grayscale(1) opacity(.55)", transition: "filter .2s" }}>{r.icon}</span>
                        <span style={{ font: "600 14.5px Poppins", color: sel ? "#EF5B94" : "#6b6b72" }}>{r.label}</span>
                        <span style={{ marginLeft: "auto", flex: "none", width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${sel ? "#EF5B94" : "#cfced4"}`, background: sel ? "#EF5B94" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {sel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="ls-primary" onClick={() => { if (role) setView("regform"); }} disabled={!role} style={{ padding: "13px 48px", borderRadius: 12, background: role ? "#EF5B94" : "#f2c9d9", border: "none", color: "#fff", font: "600 14px Poppins", cursor: role ? "pointer" : "default", boxShadow: role ? "0 6px 16px rgba(239,91,148,.3)" : "none" }}>Siguiente</button>
                <div style={{ font: "500 12.5px Poppins", color: "#6b6b72", marginTop: 22 }}>¿Ya tienes cuenta? <a href="#" className="ls-link" onClick={(e) => { e.preventDefault(); setView("login"); }} style={{ fontWeight: 600 }}>Inicia sesión</a></div>
              </div>
            )}

            {view === "regform" && (
              <div style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 20, padding: "24px 28px 22px", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
                  <button type="button" className="ls-prov" style={provBtn} onClick={google}>{GoogleIcon}Continúa con Google</button>
                  <button type="button" className="ls-prov" style={provBtn} onClick={facebook}>{FbIcon}Continúa con Facebook</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: "#ececef" }} />
                  <span style={{ font: "500 11.5px Poppins", color: "#a0a0a8" }}>o con tu email</span>
                  <div style={{ flex: 1, height: 1, background: "#ececef" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label htmlFor="ls-rname" style={lbl}>Nombre y apellido</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={iconWrap}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>
                      <input id="ls-rname" className="ls-in" autoComplete="name" value={rName} placeholder="María González"
                        onChange={(e) => { setRName(e.target.value); setRNameErr(""); }}
                        style={{ ...inSt, padding: "11px 15px 11px 38px", border: `1.5px solid ${rNameErr ? "#D83E7C" : "#E7E7EA"}` }} />
                    </div>
                    {rNameErr && <div style={{ font: "500 11.5px Poppins", color: "#D83E7C", marginTop: 5 }}>{rNameErr}</div>}
                  </div>
                  <div>
                    <label htmlFor="ls-remail" style={lbl}>Correo electrónico</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={iconWrap}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                      <input id="ls-remail" className="ls-in" type="email" autoComplete="email" value={rEmail} placeholder="nombre@correo.com"
                        onChange={(e) => { setREmail(e.target.value); setREmailErr(""); setRAuthErr(""); }}
                        style={{ ...inSt, padding: "11px 15px 11px 38px", border: `1.5px solid ${rEmailErr ? "#D83E7C" : "#E7E7EA"}` }} />
                    </div>
                    {rEmailErr && <div style={{ font: "500 11.5px Poppins", color: "#D83E7C", marginTop: 5 }}>{rEmailErr}</div>}
                  </div>
                  <div>
                    <label htmlFor="ls-rpw" style={lbl}>Contraseña</label>
                    <div style={{ position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a0a0a8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={iconWrap}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                      <input id="ls-rpw" className="ls-in" type={rShowPw ? "text" : "password"} autoComplete="new-password" value={rPw} placeholder="Mínimo 8 caracteres"
                        onChange={(e) => { setRPw(e.target.value); setRPwErr(""); }}
                        style={{ ...inSt, padding: "11px 42px 11px 38px", border: `1.5px solid ${rPwErr ? "#D83E7C" : "#E7E7EA"}` }} />
                      <button type="button" className="ls-eye" title="Mostrar u ocultar contraseña" onClick={() => setRShowPw(!rShowPw)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#a0a0a8", background: "none", border: "none", cursor: "pointer" }}>{eye(rShowPw)}</button>
                    </div>
                    {rPwErr && <div style={{ font: "500 11.5px Poppins", color: "#D83E7C", marginTop: 5 }}>{rPwErr}</div>}
                  </div>
                  <div>
                    <label htmlFor="ls-rphone" style={lbl}>Número de teléfono <span style={{ font: "500 11px Poppins", color: "#b3b3ba" }}>(opcional)</span></label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "11px 12px", borderRadius: 10, border: "1.5px solid #E7E7EA", background: "#faf9fb", font: "600 12.5px Poppins", color: "#6b6b72" }}>{countryCode}</span>
                      <input id="ls-rphone" className="ls-in" type="tel" autoComplete="tel" value={rPhone} placeholder="412 000 0000"
                        onChange={(e) => setRPhone(e.target.value)}
                        style={{ ...inSt, flex: 1, minWidth: 0, border: "1.5px solid #E7E7EA" }} />
                    </div>
                  </div>
                  {rAuthErr && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 15px", borderRadius: 999, background: "#FBE4EF", border: "1px solid #f2b9d3" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D83E7C" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
                      <span style={{ font: "600 12px Poppins", color: "#D83E7C" }} role="alert">{rAuthErr}</span>
                    </div>
                  )}
                  <button type="button" className="ls-primary" onClick={handleRegister} disabled={!canCreate || rLoading} style={{ width: "100%", padding: 12, borderRadius: 10, background: canCreate || rLoading ? "#EF5B94" : "#f2c9d9", border: "none", color: "#fff", font: "600 14px Poppins", cursor: canCreate ? "pointer" : "default", boxShadow: canCreate ? "0 6px 16px rgba(239,91,148,.3)" : "none", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                    {rLoading && <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "ls-spin .8s linear infinite", display: "inline-block" }} />}
                    {rLoading ? "Creando cuenta…" : "Crear cuenta"}
                  </button>
                </div>
              </div>
            )}

            {view === "forgot" && (
              <>
                <div className="ls-card" style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 20, padding: "26px 28px 24px", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
                  <div style={{ font: "700 17px Poppins", color: "#3A3A42", marginBottom: 6 }}>Recuperar contraseña</div>
                  <div style={{ font: "500 12.5px/1.6 Poppins", color: "#8a8a90", marginBottom: 18 }}>Escribe el email de tu cuenta y te enviaremos un enlace para restablecerla.</div>
                  <label htmlFor="ls-femail" style={lbl}>Email</label>
                  <input id="ls-femail" className="ls-in" type="email" autoComplete="email" value={fEmail} placeholder="nombre@correo.com"
                    onChange={(e) => { setFEmail(e.target.value); setFErr(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") sendLink(); }}
                    style={{ ...inSt, border: `1.5px solid ${fErr ? "#D83E7C" : "#E7E7EA"}` }} />
                  {fErr && <div style={{ font: "500 11.5px Poppins", color: "#D83E7C", marginTop: 5 }}>{fErr}</div>}
                  <button type="button" className="ls-primary" onClick={sendLink} disabled={fEmail.trim() === "" || fLoading} style={{ width: "100%", padding: 12, borderRadius: 10, background: fEmail.trim() !== "" || fLoading ? "#EF5B94" : "#f2c9d9", border: "none", color: "#fff", font: "600 14px Poppins", cursor: fEmail.trim() !== "" ? "pointer" : "default", boxShadow: fEmail.trim() !== "" ? "0 6px 16px rgba(239,91,148,.3)" : "none", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                    {fLoading && <span style={{ width: 15, height: 15, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "ls-spin .8s linear infinite", display: "inline-block" }} />}
                    {fLoading ? "Enviando…" : "Enviar enlace"}
                  </button>
                </div>
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <a href="#" className="ls-link" onClick={(e) => { e.preventDefault(); setView("login"); setFErr(""); setResent(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 12.5px Poppins" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Volver a iniciar sesión
                  </a>
                </div>
              </>
            )}

            {view === "sent" && (
              <>
                <div className="ls-card" style={{ background: "#fff", border: "1px solid #f0f0f2", borderRadius: 20, padding: "34px 28px 28px", boxShadow: "0 10px 30px rgba(0,0,0,.06)", textAlign: "center" }}>
                  <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#E4F5EE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2FB37E" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div style={{ font: "700 17px Poppins", color: "#3A3A42", marginBottom: 8 }}>Revisa tu correo</div>
                  <div style={{ font: "500 12.5px/1.6 Poppins", color: "#8a8a90", marginBottom: 4 }}>Hemos enviado un enlace de recuperación a</div>
                  <div style={{ font: "600 13px Poppins", color: "#3A3A42", marginBottom: 16 }}>{fEmail}</div>
                  <div style={{ font: "500 11.5px/1.6 Poppins", color: "#a0a0a8", marginBottom: 18 }}>Si no lo ves en unos minutos, mira en la carpeta de spam.</div>
                  <button type="button" onClick={async () => { await resetPassword({ identifier: fEmail.trim() }, () => { }); setResent(true); }} style={{ padding: "11px 20px", borderRadius: 10, background: "#fff", border: "1.5px solid #EF5B94", color: "#EF5B94", font: "600 13px Poppins", cursor: "pointer" }}>{resent ? "Enlace reenviado ✓" : "Reenviar enlace"}</button>
                </div>
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <a href="#" className="ls-link" onClick={(e) => { e.preventDefault(); setView("login"); setResent(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, font: "600 12.5px Poppins" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>Volver a iniciar sesión
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginStudio;
