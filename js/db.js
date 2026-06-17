/* db.js — IndexedDB-Datenschicht für ToDo Maki
   Stores:
     areas        { id, name, emoji, color, order, createdAt }
     tasks        { id, areaId, title, notes, due, priority, emoji, color,
                    myDay, myDayDate, repeat, subtasks[], done, completedAt,
                    archived, archivedAt, order, createdAt, updatedAt }
     attachments  { id, taskId, name, type, blob }
     meta         { key, value }   (z.B. letzter Bereinigungslauf, Budget-Kategorien)
     goals        { id, title, notes, category, targetYear, mediaId, steps[],
                    achieved, achievedAt, order, createdAt }            (Bucketlist)
     places       { id, name, type, notes, website, phone, address, mapsUrl,
                    rating, price, status, visitedAt, mediaId, tags[], order, createdAt }
     expenses     { id, amount, category, note, date, createdAt }       (Budget)
     media        { id, blob }   (Bilder für goals/places)
*/

const DB = (() => {
  const DB_NAME = "todo-maki";
  const DB_VERSION = 2;
  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("areas")) {
          const s = db.createObjectStore("areas", { keyPath: "id" });
          s.createIndex("order", "order");
        }
        if (!db.objectStoreNames.contains("tasks")) {
          const s = db.createObjectStore("tasks", { keyPath: "id" });
          s.createIndex("areaId", "areaId");
          s.createIndex("due", "due");
          s.createIndex("archived", "archived");
        }
        if (!db.objectStoreNames.contains("attachments")) {
          const s = db.createObjectStore("attachments", { keyPath: "id" });
          s.createIndex("taskId", "taskId");
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("goals")) {
          db.createObjectStore("goals", { keyPath: "id" }).createIndex("order", "order");
        }
        if (!db.objectStoreNames.contains("places")) {
          const s = db.createObjectStore("places", { keyPath: "id" });
          s.createIndex("type", "type");
        }
        if (!db.objectStoreNames.contains("expenses")) {
          db.createObjectStore("expenses", { keyPath: "id" }).createIndex("date", "date");
        }
        if (!db.objectStoreNames.contains("media")) {
          db.createObjectStore("media", { keyPath: "id" });
        }
      };
      req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function tx(store, mode = "readonly") {
    return open().then((db) => db.transaction(store, mode).objectStore(store));
  }

  function reqToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    async getAll(store) {
      const s = await tx(store);
      return reqToPromise(s.getAll());
    },
    async get(store, id) {
      const s = await tx(store);
      return reqToPromise(s.get(id));
    },
    async getByIndex(store, index, value) {
      const s = await tx(store);
      return reqToPromise(s.index(index).getAll(value));
    },
    async put(store, obj) {
      const s = await tx(store, "readwrite");
      await reqToPromise(s.put(obj));
      return obj;
    },
    async del(store, id) {
      const s = await tx(store, "readwrite");
      return reqToPromise(s.delete(id));
    },
    async clear(store) {
      const s = await tx(store, "readwrite");
      return reqToPromise(s.clear());
    },
    async metaGet(key) {
      const s = await tx("meta");
      const row = await reqToPromise(s.get(key));
      return row ? row.value : undefined;
    },
    async metaSet(key, value) {
      const s = await tx("meta", "readwrite");
      return reqToPromise(s.put({ key, value }));
    }
  };
})();

window.DB = DB;
