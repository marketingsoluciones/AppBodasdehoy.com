import { FC, useRef, useState } from "react";
import { getAuth, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { AuthContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useTranslation } from "react-i18next";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { createURL } from "../../utils/UrlImage";
import { convertHeicIfNeeded, validateFile, withRetry } from "@bodasdehoy/shared/upload";
import { setCrossAppIdToken } from "@bodasdehoy/shared/auth";

const cap1 = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s || "");
// Ciudades: primera letra de cada palabra en mayúscula (ej. "MARACAIBO"/"maracaibo" -> "Maracaibo").
const titleCase = (s?: string) => String(s || "").toLowerCase().split(" ").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

const ProfileStudio: FC = () => {
  const { t } = useTranslation();
  const { user, setUser, config } = AuthContextProvider() as any;
  const toast = useToast();
  const auth = getAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameEdit, setNameEdit] = useState(false);
  const [nameVal, setNameVal] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [pwEdit, setPwEdit] = useState(false);
  const [pwVis, setPwVis] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initial = String(user?.displayName || user?.email || "?").charAt(0).toUpperCase();
  const rol = cap1(user?.role?.length ? user.role[0] : "usuario");
  const ciudad = titleCase(user?.city || user?.ciudad || "");
  const creado = (() => {
    try { const c = auth.currentUser?.metadata?.creationTime; if (!c) return ""; const d = new Date(c); return `${cap1(d.toLocaleDateString("es-ES", { month: "long" }))} ${d.getFullYear()}`; } catch { return ""; }
  })();
  const meta = [
    { k: t("Rol"), v: rol },
    ...(ciudad ? [{ k: t("Ciudad"), v: ciudad }] : []),
    ...(creado ? [{ k: t("Miembro desde"), v: creado }] : []),
  ];

  const saveName = async () => {
    if (savingName) return;
    if (!nameVal.trim()) { toast("error", t("El nombre no puede estar en blanco")); return; }
    setSavingName(true);
    try {
      if (nameVal.trim() !== (user?.displayName ?? "") && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nameVal.trim() });
        setUser((old: any) => ({ ...old, displayName: nameVal.trim() }));
        toast("success", t("success"));
      }
      setNameEdit(false);
    } catch { toast("warning", t("warning")); } finally { setSavingName(false); }
  };

  const savePw = async () => {
    if (savingPw) return;
    if (!pwCurrent || (pwNew || "").length <= 5) { toast("error", t("Debe contener más de 5 caracteres")); return; }
    setSavingPw(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser!.email!, pwCurrent);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, pwNew);
      const idToken = await getAuth().currentUser?.getIdToken(true);
      if (idToken) setCrossAppIdToken(idToken);
      setPwEdit(false); setPwVis(false); setPwCurrent(""); setPwNew("");
      toast("success", t("passwordsuccess"));
    } catch (error: any) {
      if (error?.code === "auth/wrong-password") toast("error", t("warningpassword"));
      else toast("error", t("warningpasswordagain"));
    } finally { setSavingPw(false); }
  };

  const onPhoto = async (e: any) => {
    const file0 = e.target.files?.[0];
    if (!file0 || uploading) return;
    setUploading(true);
    try {
      const v = validateFile(file0, { maxSize: 10 * 1024 * 1024 });
      if (!v.valid) { toast("error", v.error || t("Archivo no válido")); setUploading(false); return; }
      const file = await convertHeicIfNeeded(file0);
      const result: any = await withRetry(
        () => fetchApiBodas({ query: queries.uploadProfileImage, variables: { file, development: config?.development || "bodasdehoy", userId: user?.uid || "", category: "profile" }, type: "formData", development: config?.development }),
        { maxRetries: 2, initialDelay: 1000, backoffMultiplier: 2 }
      );
      const url = result?.file?.publicUrls?.optimized400w ?? result?.file?.publicUrls?.optimized800w ?? result?.file?.publicUrls?.original ?? null;
      if (url && auth?.currentUser) { await updateProfile(auth.currentUser, { photoURL: createURL(url) }); setUser((old: any) => ({ ...old, photoURL: createURL(url) })); }
      toast("success", t("imagesuccessfully"));
    } catch { toast("error", t("errorloadingimage")); } finally { setUploading(false); }
  };

  const eye = (on: boolean) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? "#EF5B94" : "#8a8a90"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{!on && <path d="M4 4l16 16" />}</svg>
  );
  const editBtn = (active: boolean): any => ({ padding: "12px 20px", borderRadius: 10, background: active ? "#EF5B94" : "#fff", border: `1.5px solid ${active ? "#EF5B94" : "#E7E7EA"}`, color: active ? "#fff" : "#6b6b72", font: "600 13px Poppins", boxShadow: active ? "0 6px 16px rgba(239,91,148,.3)" : "none", whiteSpace: "nowrap", cursor: "pointer" });

  return (
    <div style={{ width: "100%", maxWidth: 1160, margin: "0 auto", padding: "32px 20px 60px", fontFamily: "'Poppins',sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: ".ps-in:focus{border-color:#EF5B94!important;}.ps-pwlbl-m{display:none;}@media (max-width:767px){.ps-grid{grid-template-columns:1fr!important;gap:16px!important;}.ps-acc{grid-template-columns:1fr!important;}.ps-pw{grid-template-columns:1fr!important;align-items:stretch!important;}.ps-pw>button{width:100%!important;}.ps-grid>section,.ps-grid section{padding:22px 20px!important;}.ps-pwlbl-d{display:none!important;}.ps-pwlbl-m{display:inline!important;}}" }} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} />

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }} className="ps-grid">
        {/* TARJETA PERFIL */}
        <section style={{ background: "#fff", border: "1px solid #ececef", borderRadius: 16, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <div style={{ width: 116, height: 116, borderRadius: "50%", background: "#EF5B94", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", font: "800 42px Poppins", boxShadow: "0 10px 26px rgba(239,91,148,.28)", overflow: "hidden" }}>
              {user?.photoURL ? <img src={user.photoURL} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
            </div>
            <button title={t("Cambiar foto")} onClick={() => fileRef.current?.click()} disabled={uploading} style={{ position: "absolute", bottom: 2, right: 2, width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "1px solid #e7e7ea", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(0,0,0,.14)", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b72" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
          </div>
          <div style={{ font: "700 21px Poppins", color: "#3A3A42" }}>{user?.displayName}</div>
          <div style={{ font: "500 12.5px Poppins", color: "#a0a0a8", marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "#FCE7F0", font: "600 12px Poppins", color: "#EF5B94" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.3 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8Z" /></svg>{rol}</span>
            {ciudad && <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "#faf9fb", border: "1px solid #f0f0f2", font: "600 12px Poppins", color: "#6b6b72" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>{ciudad}</span>}
          </div>
          <div style={{ width: "100%", borderTop: "1px solid #f2f2f4", margin: "24px 0 18px" }} />
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            {meta.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ font: "500 12.5px Poppins", color: "#8a8a90" }}>{m.k}</span><span style={{ font: "600 12.5px Poppins", color: "#3A3A42" }}>{m.v}</span></div>
            ))}
          </div>
        </section>

        {/* COLUMNA DERECHA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* DATOS DE ACCESO */}
          <section style={{ background: "#fff", border: "1px solid #ececef", borderRadius: 16, padding: "28px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg></div>
              <div><div style={{ font: "700 16px Poppins", color: "#3A3A42" }}>{t("Datos de acceso")}</div><div style={{ font: "500 12px Poppins", color: "#a0a0a8" }}>{t("Correo y nombre con el que apareces en la plataforma")}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px", marginTop: 20 }} className="ps-acc">
              <div>
                <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 7 }}>{t("Correo electrónico")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "#faf9fb", border: "1.5px solid #f0f0f2" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8a90" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                  <span style={{ font: "500 13.5px Poppins", color: "#6b6b72", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</span>
                  {user?.emailVerified && <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, font: "600 11px Poppins", color: "#1E8F63", background: "#E4F5EE", borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>{t("Verificado")}</span>}
                </div>
              </div>
              <div>
                <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 7 }}>{t("Nombre visible")}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input className="ps-in" value={nameVal} onChange={(e) => setNameVal(e.target.value)} readOnly={!nameEdit} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: nameEdit ? "#fff" : "#faf9fb", border: `1.5px solid ${nameEdit ? "#EF5B94" : "#f0f0f2"}`, font: "500 13.5px Poppins", color: "#3A3A42", minWidth: 0, outline: "none" }} />
                  <button onClick={() => nameEdit ? saveName() : setNameEdit(true)} style={editBtn(nameEdit)}>{nameEdit ? t("Guardar") : t("Editar")}</button>
                </div>
              </div>
            </div>
          </section>

          {/* CONTRASEÑA */}
          <section style={{ background: "#fff", border: "1px solid #ececef", borderRadius: 16, padding: "28px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#FCE7F0", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF5B94" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></div>
              <div style={{ flex: 1 }}><div style={{ font: "700 16px Poppins", color: "#3A3A42" }}>{t("Contraseña")}</div><div style={{ font: "500 12px Poppins", color: "#a0a0a8" }}>{t("Gestiona tu contraseña de acceso")}</div></div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 15px", borderRadius: 999, background: "#FBF0DA", border: "1px solid #EBD298" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4801F" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h0" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg><span style={{ font: "600 11.5px Poppins", color: "#B4801F", whiteSpace: "nowrap" }}>{t("Recomendamos renovarla")}</span></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "18px 20px", marginTop: 20, alignItems: "end" }} className="ps-pw">
              <div>
                <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 7 }}>{t("Contraseña actual")}</div>
                <div style={{ display: "flex", alignItems: "center", padding: "0 6px 0 16px", borderRadius: 10, background: pwEdit ? "#fff" : "#faf9fb", border: `1.5px solid ${pwEdit ? "#EF5B94" : "#f0f0f2"}` }}>
                  <input className="ps-in" type={pwVis ? "text" : "password"} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} readOnly={!pwEdit} placeholder="••••••••" style={{ flex: 1, padding: "12px 0", border: "none", background: "transparent", font: "500 13.5px Poppins", color: "#3A3A42", minWidth: 0, outline: "none" }} />
                  <button onClick={() => setPwVis((v) => !v)} title={t("Mostrar")} style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>{eye(pwVis)}</button>
                </div>
              </div>
              <div>
                <div style={{ font: "600 12px Poppins", color: "#6b6b72", marginBottom: 7 }}>{t("Nueva contraseña")}</div>
                <div style={{ display: "flex", alignItems: "center", padding: "0 6px 0 16px", borderRadius: 10, background: pwEdit ? "#fff" : "#faf9fb", border: `1.5px solid ${pwEdit ? "#EF5B94" : "#f0f0f2"}` }}>
                  <input className="ps-in" type={pwVis ? "text" : "password"} value={pwNew} onChange={(e) => setPwNew(e.target.value)} readOnly={!pwEdit} placeholder={t("Mínimo 8 caracteres") as string} style={{ flex: 1, padding: "12px 0", border: "none", background: "transparent", font: "500 13.5px Poppins", color: "#3A3A42", minWidth: 0, outline: "none" }} />
                  <button onClick={() => setPwVis((v) => !v)} title={t("Mostrar")} style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" }}>{eye(pwVis)}</button>
                </div>
              </div>
              <button onClick={() => pwEdit ? savePw() : (setPwEdit(true), setPwVis(false))} style={editBtn(pwEdit)}><span className="ps-pwlbl-d">{pwEdit ? t("Guardar") : t("Editar")}</span><span className="ps-pwlbl-m">{pwEdit ? t("Guardar cambios") : t("Editar contraseña")}</span></button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfileStudio;
