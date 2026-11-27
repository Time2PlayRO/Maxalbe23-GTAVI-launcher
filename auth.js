// Only the public publishable key belongs in this file. Never put a database
// password or service-role/secret key in a browser download.
const SUPABASE_URL = "https://bkvsimqhmalrkudxnxbz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DcK5NZMB9az-lHgqfeffTA_GfY6wbj3";
const configured = Boolean(
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
);
const sb = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

let isRegisterMode = false;
let currentSession = null;
let currentUser = null;

const byId = (id) => document.getElementById(id);
const tabLogin = byId("tabLogin");
const tabRegister = byId("tabRegister");
const usernameGroup = byId("usernameGroup");
const authSubmitBtn = byId("authSubmitBtn");
const authForm = byId("authForm");
const authGuestView = byId("authGuestView");
const authLoggedView = byId("authLoggedView");
const loggedUserEmail = byId("loggedUserEmail");
const navUserBadge = byId("navUserBadge");
const authAlert = byId("authAlert");
const keyAlert = byId("keyAlert");
const userKeyDisplay = byId("userKeyDisplay");
const keyStatusVal = byId("keyStatusVal");
const hwidStatusVal = byId("hwidStatusVal");
const supabaseStatusText = byId("supabaseStatusText");
const releaseMeta = byId("releaseMeta");
const dlFeedback = byId("dlFeedback");
const downloadLinks = document.querySelectorAll("[data-dl]");

function showAlert(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.className = `alert-msg show ${isError ? "alert-err" : "alert-ok"}`;
}

function setSignedIn(session) {
  currentSession = session || null;
  currentUser = session && session.user ? session.user : null;
  if (currentUser) {
    authGuestView.style.display = "none";
    authLoggedView.style.display = "block";
    loggedUserEmail.textContent = currentUser.email || "Cont autentificat";
    navUserBadge.textContent = (currentUser.email || "Cont").split("@")[0];
    loadUserKey();
  } else {
    authGuestView.style.display = "block";
    authLoggedView.style.display = "none";
    navUserBadge.textContent = "Contul Meu";
    userKeyDisplay.textContent = "AUTENTIFICĂ-TE PENTRU KEY";
    keyStatusVal.textContent = "Neautentificat";
    keyStatusVal.style.color = "#fff";
    hwidStatusVal.textContent = "Neasociat";
  }
}

async function invokeAccount(action) {
  if (!sb || !currentSession) throw new Error("Autentifică-te mai întâi.");
  const { data, error } = await sb.functions.invoke("launcher-account", {
    body: { action }
  });
  if (error) throw error;
  return data || {};
}

async function loadUserKey() {
  try {
    const data = await invokeAccount("status");
    userKeyDisplay.textContent = data.hasKey
      ? "CHEIE ACTIVĂ · VIZIBILĂ LA GENERARE"
      : "NU AI ÎNCĂ O CHEIE";
    keyStatusVal.textContent = data.isActive ? "Activă" : data.hasKey ? "Suspendată" : "Fără cheie";
    keyStatusVal.style.color = data.isActive ? "#34d399" : "#fca5a5";
    hwidStatusVal.textContent = data.deviceBound ? "Asociată acestui PC" : "Neasociat (Liber)";
  } catch (error) {
    showAlert(keyAlert, "Nu pot citi licența: " + (error.message || "verifică funcția Supabase"), true);
  }
}

if (tabLogin) tabLogin.addEventListener("click", () => {
  isRegisterMode = false;
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  usernameGroup.style.display = "none";
  authSubmitBtn.textContent = "Intră în cont";
  authAlert.className = "alert-msg";
});

if (tabRegister) tabRegister.addEventListener("click", () => {
  isRegisterMode = true;
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  usernameGroup.style.display = "block";
  authSubmitBtn.textContent = "Creează cont";
  authAlert.className = "alert-msg";
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!sb) {
    showAlert(authAlert, "Autentificarea nu e activă încă. Configurează cheia publică Supabase.", true);
    return;
  }

  const email = byId("emailInput").value.trim();
  const password = byId("passwordInput").value;
  const username = byId("usernameInput").value.trim();
  authSubmitBtn.disabled = true;
  try {
    if (isRegisterMode) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { username: username || email.split("@")[0] } }
      });
      if (error) throw error;
      if (data.session) setSignedIn(data.session);
      showAlert(authAlert, data.session
        ? "Cont creat și autentificat. Generează cheia de acces din dreapta."
        : "Cont creat. Confirmă adresa de e-mail, apoi autentifică-te.");
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSignedIn(data.session);
      showAlert(authAlert, "Te-ai autentificat. Generează sau verifică cheia de acces.");
    }
  } catch (error) {
    showAlert(authAlert, error.message || "Eroare la autentificare.", true);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

byId("logoutBtn").addEventListener("click", async () => {
  if (sb) await sb.auth.signOut();
  setSignedIn(null);
  showAlert(authAlert, "Te-ai deconectat.");
});

byId("generateKeyBtn").addEventListener("click", async () => {
  if (!currentUser) {
    showAlert(keyAlert, "Autentifică-te înainte să generezi o cheie.", true);
    return;
  }
  try {
    const data = await invokeAccount("issue");
    if (!data.licenseKey) throw new Error("Serverul nu a returnat cheia. Încearcă din nou.");
    userKeyDisplay.textContent = data.licenseKey;
    keyStatusVal.textContent = "Activă";
    keyStatusVal.style.color = "#34d399";
    hwidStatusVal.textContent = "Neasociat (Liber)";
    showAlert(keyAlert, "Cheia nouă e afișată o singură dată. Copiaz-o și păstreaz-o în siguranță.");
  } catch (error) {
    showAlert(keyAlert, error.message || "Nu am putut genera cheia.", true);
  }
});

byId("resetHwidBtn").addEventListener("click", async () => {
  if (!currentUser) return;
  try {
    await invokeAccount("reset-device");
    hwidStatusVal.textContent = "Neasociat (Liber)";
    showAlert(authAlert, "Asocierea cu PC-ul a fost resetată.");
  } catch (error) {
    showAlert(authAlert, error.message || "Nu am putut reseta asocierea.", true);
  }
});

byId("copyKeyBtn").addEventListener("click", async () => {
  const value = userKeyDisplay.textContent;
  if (!value.startsWith("MAX23-")) return;
  try {
    await navigator.clipboard.writeText(value);
    showAlert(keyAlert, "Cheia a fost copiată.");
  } catch (_) {
    showAlert(keyAlert, "Selectează și copiază cheia manual.", true);
  }
});

async function beginDownload(event) {
  event.preventDefault();
  if (!currentUser || !currentSession) {
    showAlert(authAlert, "Intră în cont pentru a descărca installerul.", true);
    byId("portal").scrollIntoView({ behavior: "smooth" });
    return;
  }
  const link = event.currentTarget;
  link.setAttribute("aria-disabled", "true");
  try {
    const { data, error } = await sb.functions.invoke("create-download", { body: {} });
    if (error) throw error;
    if (!data || !data.signedUrl) throw new Error("Nu am primit linkul temporar de descărcare.");
    const signedUrl = new URL(data.signedUrl, SUPABASE_URL).href;
    releaseMeta.textContent = "Link temporar securizat · expiră în scurt timp";
    dlFeedback.textContent = "Descărcarea securizată începe acum.";
    window.location.assign(signedUrl);
  } catch (error) {
    showAlert(keyAlert, error.message || "Descărcarea nu este disponibilă.", true);
  } finally {
    link.removeAttribute("aria-disabled");
  }
}

downloadLinks.forEach((link) => link.addEventListener("click", beginDownload));

if (!configured) {
  supabaseStatusText.textContent = "SUPABASE NECONFIGURAT";
  releaseMeta.textContent = "Descărcarea este blocată până la configurarea autentificării.";
} else {
  supabaseStatusText.textContent = "SUPABASE CONFIGURAT";
  sb.auth.onAuthStateChange((_event, session) => setSignedIn(session));
  sb.auth.getSession().then(({ data }) => setSignedIn(data.session));
}

if (new URLSearchParams(window.location.search).get("download") === "1") {
  window.addEventListener("load", () => byId("mainDownloadBtn").click(), { once: true });
}
