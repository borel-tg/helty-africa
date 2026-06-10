/** Remove a single field error when the user edits that field. */
export function clearFormFieldError(setErrors, field) {
  setErrors((prev) => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

/** Remove several field errors at once (e.g. when category changes). */
export function clearFormFieldErrors(setErrors, fields) {
  setErrors((prev) => {
    let changed = false;
    const next = { ...prev };
    for (const field of fields) {
      if (next[field]) {
        delete next[field];
        changed = true;
      }
    }
    return changed ? next : prev;
  });
}
