import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@income-expense-app/notebook";
const DEFAULT_USER_ID = "local-user";

const DEFAULT_NOTES = [];

const readAll = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (error) {
    console.warn("Failed to read stored notes", error);
    return {};
  }
};

const writeAll = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to persist notes locally", error);
    throw error;
  }
};

const generateLocalId = () => {
  const random = Math.random().toString(36).slice(2, 8);
  return `local-note-${Date.now()}-${random}`;
};

const normalizeNote = (note) => {
  return {
    id: note?.id || generateLocalId(),
    text: note?.text || "",
    date: note?.date || new Date().toISOString().slice(0, 10),
    frequency: note?.frequency || "monthly",
    completed: Boolean(note?.completed),
    createdAt: note?.createdAt || new Date().toISOString(),
    updatedAt: note?.updatedAt || new Date().toISOString(),
  };
};

const prepareForStorage = (note) => {
  const normalized = normalizeNote(note);
  return {
    id: normalized.id,
    text: normalized.text,
    date: normalized.date,
    frequency: normalized.frequency,
    completed: normalized.completed,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
  };
};

const sortNotes = (list) =>
  [...list].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    const validA = !Number.isNaN(timeA);
    const validB = !Number.isNaN(timeB);

    if (validA && validB && timeA !== timeB) {
      return timeB - timeA;
    }
    if (validA && !validB) return -1;
    if (!validA && validB) return 1;
    return String(b.id).localeCompare(String(a.id));
  });

export const getLocalNotes = async (userId = DEFAULT_USER_ID) => {
  const all = await readAll();
  const existing = Array.isArray(all[userId]) ? all[userId] : [];
  if (existing.length === 0) {
    const seeded = DEFAULT_NOTES.map((note) => prepareForStorage(note));
    if (seeded.length > 0) {
      all[userId] = seeded;
      await writeAll(all);
    }
    return sortNotes(seeded.map((note) => normalizeNote(note)));
  }
  return sortNotes(existing.map((note) => normalizeNote(note)));
};

export const addLocalNote = async (userId, note) => {
  const targetUser = userId || DEFAULT_USER_ID;
  const all = await readAll();
  const existing = Array.isArray(all[targetUser]) ? all[targetUser] : [];
  const normalized = normalizeNote(note);
  const stored = prepareForStorage(normalized);
  const deduped = existing.filter((item) => item.id !== stored.id);
  all[targetUser] = [stored, ...deduped];
  await writeAll(all);
  return normalized;
};

export const updateLocalNote = async (userId, noteId, updates) => {
  if (!noteId) return null;
  const targetUser = userId || DEFAULT_USER_ID;
  const all = await readAll();
  const existing = Array.isArray(all[targetUser]) ? all[targetUser] : [];
  let updatedNote = null;
  const mapped = existing.map((note) => {
    if (note.id !== noteId) {
      return note;
    }
    const merged = normalizeNote({
      ...note,
      ...updates,
      id: noteId,
      updatedAt: new Date().toISOString(),
    });
    updatedNote = merged;
    return prepareForStorage(merged);
  });
  all[targetUser] = mapped;
  await writeAll(all);
  return updatedNote;
};

export const setLocalNotes = async (userId, notes) => {
  const targetUser = userId || DEFAULT_USER_ID;
  const all = await readAll();
  const normalized = Array.isArray(notes)
    ? notes.map((note) => prepareForStorage(note))
    : [];
  all[targetUser] = normalized;
  await writeAll(all);
  return sortNotes(normalized.map((note) => normalizeNote(note)));
};

export const deleteLocalNote = async (userId, noteId) => {
  if (!noteId) return null;
  const targetUser = userId || DEFAULT_USER_ID;
  const all = await readAll();
  const existing = Array.isArray(all[targetUser]) ? all[targetUser] : [];
  const filtered = existing.filter((note) => note.id !== noteId);
  all[targetUser] = filtered;
  await writeAll(all);
  return sortNotes(filtered.map((note) => normalizeNote(note)));
};
