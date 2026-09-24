import { HELP_LOCK, HELP_PASSWORD } from "./config";

/* Una vez ingresada la contraseña, las ayudas quedan libres hasta recargar la página. */
let unlocked = false;
/* Acción pendiente mientras el cuadro de contraseña está abierto (null = cerrado). */
let pending = null;
const listeners = new Set();
const emit = () => listeners.forEach((f) => f());

export const subscribe = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};
export const getPending = () => pending;

/** Alterna una ayuda. Ocultarla es libre; mostrarla abre el cuadro de contraseña si HELP_LOCK está activo. */
export function toggleHelp(shown, setShown) {
  if (shown) return setShown(false);
  if (!HELP_LOCK || unlocked) return setShown(true);
  pending = () => setShown(true);
  emit();
}

export function cancelUnlock() {
  pending = null;
  emit();
}

/** Devuelve true (y muestra la ayuda pedida) si la contraseña es correcta. */
export function tryUnlock(pw) {
  if (pw.trim() !== HELP_PASSWORD) return false;
  unlocked = true;
  const go = pending;
  pending = null;
  emit();
  go?.();
  return true;
}
