import {
  compressToUTF16,
  decompressFromUTF16,
} from "lz-string";

const DB_NAME = "jsonprober";
const DB_VERSION = 1;
const STORE_NAME = "blobs";
const KEY = "jsonprober-explore-data";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPromise<T>(tx: IDBTransaction, result: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(result());
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveExploreJson(json: string): Promise<void> {
  const compressed = compressToUTF16(json);
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(compressed, KEY);
  await txPromise(tx, () => undefined);
  db.close();
}

export async function loadExploreJson(): Promise<string | null> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const req = tx.objectStore(STORE_NAME).get(KEY);
  const value = await new Promise<unknown>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (typeof value !== "string") return null;
  return decompressFromUTF16(value);
}
