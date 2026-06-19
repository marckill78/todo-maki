/* sync.js — Google-Login (Firebase Auth) + Geräte-Sync (Firestore)
   Hängt sich an die DB-Schicht: lokale Schreibvorgänge werden gespiegelt,
   Remote-Änderungen kommen per Live-Listener zurück.
   Hinweis: Die Firebase-Web-Config ist nicht geheim — die Sicherheit läuft
   über Login + Firestore-Regeln (jeder Nutzer nur seine eigenen Daten). */

const Sync = (() => {
  const firebaseConfig = {
    apiKey: "AIzaSyDI_mXFvgV4ONkTDhYXVN1ST37V9DMgUB4",
    authDomain: "todo-7d85d.firebaseapp.com",
    projectId: "todo-7d85d",
    storageBucket: "todo-7d85d.firebasestorage.app",
    messagingSenderId: "856776079286",
    appId: "1:856776079286:web:ff7526cc0f0a7ff426b317"
  };

  // Diese Stores werden synchronisiert (Bilder/Anhänge bleiben lokal pro Gerät)
  const COLLECTIONS = ["areas", "tasks", "goals", "places", "expenses"];

  let auth = null, db = null;
  let user = null;
  let status = "off";           // off | syncing | on | error
  let applyingRemote = false;   // verhindert Echo-Schleifen
  let unsubs = [];
  let onChange = () => {};
  let renderTimer = null;

  const isReady = () => !!(auth && db);
  const isOn = () => !!user;

  function setStatus(s) { status = s; updateUI(); }
  function updateUI() {
    // app.js kann eine Callback setzen, um Konto-UI zu aktualisieren
    if (Sync._onStatus) Sync._onStatus();
  }
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(async () => { await Store.reload(); onChange(); }, 120);
  }

  function init(changeCb) {
    onChange = changeCb || (() => {});
    if (typeof firebase === "undefined") { console.warn("Firebase nicht geladen"); return; }
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); // Offline-Cache
      auth.onAuthStateChanged(async (u) => {
        user = u;
        if (u) { await onLogin(u.uid); }
        else { onLogout(); }
      });
      // Falls Redirect-Login verwendet wurde
      auth.getRedirectResult().catch(() => {});
    } catch (e) { console.error("Sync init", e); setStatus("error"); }
  }

  async function login() {
    if (!isReady()) return;
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      // Popup blockiert (häufig in installierter PWA) → Redirect
      if (e && (e.code === "auth/popup-blocked" || e.code === "auth/cancelled-popup-request" || e.code === "auth/operation-not-supported-in-this-environment")) {
        await auth.signInWithRedirect(provider);
      } else { console.error("Login", e); }
    }
  }
  async function logout() {
    stopListeners();
    if (auth) await auth.signOut();
  }

  function docRef(uid, coll, id) { return db.collection("users").doc(uid).collection(coll).doc(String(id)); }
  function collRef(uid, coll) { return db.collection("users").doc(uid).collection(coll); }

  // Lokale Schreibvorgänge → Firestore (von db.js aufgerufen)
  function pushDoc(coll, obj) {
    if (!isOn() || applyingRemote) return;
    docRef(user.uid, coll, obj.id).set(sanitize(obj)).catch(e => console.warn("push", coll, e));
  }
  function pushDelete(coll, id) {
    if (!isOn() || applyingRemote) return;
    docRef(user.uid, coll, id).delete().catch(e => console.warn("del", coll, e));
  }
  // Firestore mag kein undefined
  function sanitize(o) { return JSON.parse(JSON.stringify(o)); }

  async function onLogin(uid) {
    setStatus("syncing");
    try {
      // Ist dieses Gerät „frisch" (nur Default-Seed, keine echten Inhalte)?
      const localEmpty = !(await DB.getAll("tasks")).length && !(await DB.getAll("goals")).length &&
                         !(await DB.getAll("places")).length && !(await DB.getAll("expenses")).length;
      // Hat die Cloud bereits Daten?
      let remoteHasData = false;
      const remoteCache = {};
      for (const coll of COLLECTIONS) {
        const snap = await collRef(uid, coll).get();
        remoteCache[coll] = snap;
        if (!snap.empty) remoteHasData = true;
      }

      applyingRemote = true;
      if (localEmpty && remoteHasData) {
        // Frisches Gerät: Default-Seed verwerfen, nur Cloud übernehmen
        for (const coll of COLLECTIONS) {
          await DB.clear(coll);
          remoteCache[coll].forEach(d => DB.put(coll, d.data(), { fromRemote: true }));
        }
      } else {
        // Zwei-Wege-Merge nach updatedAt (neuere Version gewinnt)
        for (const coll of COLLECTIONS) {
          const remote = {}; remoteCache[coll].forEach(d => remote[d.id] = d.data());
          const local = {}; (await DB.getAll(coll)).forEach(o => local[o.id] = o);
          const ids = new Set([...Object.keys(remote), ...Object.keys(local)]);
          for (const id of ids) {
            const r = remote[id], l = local[id];
            if (r && l) {
              if ((r.updatedAt || 0) > (l.updatedAt || 0)) await DB.put(coll, r, { fromRemote: true });
              else if ((l.updatedAt || 0) > (r.updatedAt || 0)) await docRef(uid, coll, id).set(sanitize(l));
            } else if (r) { await DB.put(coll, r, { fromRemote: true }); }
            else if (l) { await docRef(uid, coll, id).set(sanitize(l)); }
          }
        }
      }
      applyingRemote = false;

      await Store.reload(); onChange();
      startListeners(uid);
      setStatus("on");
    } catch (e) { console.error("onLogin", e); applyingRemote = false; setStatus("error"); }
  }

  function onLogout() { stopListeners(); user = null; setStatus("off"); }

  function startListeners(uid) {
    stopListeners();
    for (const coll of COLLECTIONS) {
      const unsub = collRef(uid, coll).onSnapshot({ includeMetadataChanges: false }, (snap) => {
        let touched = false;
        snap.docChanges().forEach(async (ch) => {
          applyingRemote = true;
          try {
            if (ch.type === "removed") await DB.del(coll, ch.doc.id, { fromRemote: true });
            else await DB.put(coll, ch.doc.data(), { fromRemote: true });
          } finally { applyingRemote = false; }
          touched = true;
        });
        if (touched) scheduleRender();
      }, (err) => console.warn("listener", coll, err));
      unsubs.push(unsub);
    }
  }
  function stopListeners() { unsubs.forEach(u => { try { u(); } catch {} }); unsubs = []; }

  return {
    init, login, logout, pushDoc, pushDelete, isOn, isReady,
    get user() { return user; },
    get status() { return status; },
    _onStatus: null
  };
})();

window.Sync = Sync;
