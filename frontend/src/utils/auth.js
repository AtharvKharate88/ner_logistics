export function getCurrentUser() {
  try {
    const user = localStorage.getItem("ner_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isFieldOfficer() {
  return getCurrentUser()?.role === "FIELD_OFFICER";
}

export function logout() {
  localStorage.removeItem("ner_token");
  localStorage.removeItem("ner_user");
}