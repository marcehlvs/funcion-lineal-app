import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Lock } from "lucide-react";
import { cancelUnlock, getPending, subscribe, tryUnlock } from "../helpGate";

/* Cuadro de contraseña para las ayudas. Se monta una sola vez en App. */

function GateForm() {
  const [pw, setPw] = useState("");
  const [bad, setBad] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && cancelUnlock();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!tryUnlock(pw)) {
      setBad(true);
      setPw("");
      input.current?.focus();
    }
  };

  return (
    <div className="gate-backdrop" onMouseDown={(e) => e.target === e.currentTarget && cancelUnlock()}>
      <form className="gate-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <span className="gate-icon"><Lock size={20} /></span>
        <h2 id="gate-title" className="gate-title">Ayuda bloqueada</h2>
        <p className="gate-text">El desarrollo paso a paso lo habilita el docente.</p>
        <input
          ref={input}
          autoFocus
          type="password"
          className={`gate-input ${bad ? "gate-input--bad" : ""}`}
          value={pw}
          onChange={(e) => { setPw(e.target.value); setBad(false); }}
          placeholder="Contraseña"
          aria-label="Contraseña del docente"
          aria-invalid={bad}
          autoComplete="off"
        />
        <p className="gate-error" role="alert">{bad ? "Contraseña incorrecta. Probá de nuevo." : ""}</p>
        <div className="gate-actions">
          <button type="button" className="btn btn--ghost" onClick={cancelUnlock}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={!pw}>Desbloquear</button>
        </div>
      </form>
    </div>
  );
}

export default function HelpGateModal() {
  const open = useSyncExternalStore(subscribe, getPending) !== null;
  return open ? <GateForm /> : null;
}
