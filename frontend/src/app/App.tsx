import { useEffect, useState } from "react";
import { Database, MapPinned } from "lucide-react";
import { getHealth, type HealthResponse } from "../api/client";
import { TripWorkspace } from "../pages/TripWorkspace";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then((payload) => {
        setHealth(payload);
        setHealthError(null);
      })
      .catch((error: Error) => {
        setHealth(null);
        setHealthError(error.message);
      });
  }, []);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand-mark">
          <MapPinned size={24} aria-hidden="true" />
          <div>
            <h1>Private Memory Map</h1>
            <p>Trip workspace</p>
          </div>
        </div>
        <div className={`status-pill ${health ? "online" : "offline"}`}>
          <Database size={16} aria-hidden="true" />
          <span>{health ? `${health.gemma_model} ready` : "Backend offline"}</span>
        </div>
      </header>

      <TripWorkspace health={health} healthError={healthError} />
    </main>
  );
}
