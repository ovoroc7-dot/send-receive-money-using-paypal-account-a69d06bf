const KEY = "pp:saved-recipients";

export function getSavedRecipients(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecipient(name: string) {
  const n = name.trim();
  if (!n || typeof window === "undefined") return;
  const list = getSavedRecipients().filter((x) => x.toLowerCase() !== n.toLowerCase());
  list.unshift(n);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
}
