import { useEffect, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { publicApi } from "../lib/endpoints";
import { Card, Spinner } from "./ui";

const STATUS_STYLE = {
  AVAILABLE: "var(--available)",
  OCCUPIED: "var(--occupied)",
  RESERVED: "var(--reserved)",
  MAINTENANCE: "var(--maintenance)",
  LOCKED: "var(--locked)",
};

const STATUS_LABEL = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  MAINTENANCE: "Maintenance",
  LOCKED: "Locked",
};

export default function SlotMap() {
  const [buildings, setBuildings] = useState(null);
  const [selected, setSelected] = useState(null);
  const [floors, setFloors] = useState(null);
  const [openFloor, setOpenFloor] = useState(null);
  const [slots, setSlots] = useState({});

  useEffect(() => {
    publicApi.buildings().then((b) => {
      setBuildings(b);
      if (b.length > 0) setSelected(b[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setFloors(null);
    setOpenFloor(null);
    setSlots({});
    publicApi.publicFloors(selected).then(setFloors);
  }, [selected]);

  const loadSlots = (floorId) => {
    if (slots[floorId]) return;
    publicApi.publicSlots(floorId).then((s) =>
      setSlots((prev) => ({ ...prev, [floorId]: s }))
    );
  };

  const toggleFloor = (floorId) => {
    setOpenFloor((prev) => (prev === floorId ? null : floorId));
    loadSlots(floorId);
  };

  if (!buildings) return <Spinner label="Loading buildings" />;

  return (
    <div>
      {buildings.length > 1 && (
        <div className="mb-4 flex gap-2">
          {buildings.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                selected === b.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-text"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {!floors ? (
        <Spinner label="Loading floors" />
      ) : (
        <div className="space-y-2">
          {floors.map((f) => {
            const open = openFloor === f.id;
            const fSlots = slots[f.id];
            const counts = fSlots
              ? Object.entries(
                  fSlots.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] || 0) + 1 }), {})
                )
              : null;
            return (
              <Card key={f.id} className="overflow-hidden">
                <button
                  onClick={() => toggleFloor(f.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-elevated"
                >
                  <Building2 size={16} className="text-muted" />
                  <span className="text-sm font-medium flex-1">{f.name}</span>
                  {counts && (
                    <div className="flex gap-2">
                      {counts.map(([status, count]) => (
                        <span key={status} className="flex items-center gap-1 text-xs text-muted">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_STYLE[status] }} />
                          {count}
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronDown size={14} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="border-t border-line px-4 py-3">
                    {!fSlots ? (
                      <Spinner label="Loading slots" />
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {fSlots.map((s) => (
                            <div
                              key={s.id}
                              title={`${s.code} — ${STATUS_LABEL[s.status]}`}
                              className="flex h-9 w-12 items-center justify-center rounded text-xs font-medium text-white transition hover:opacity-80"
                            style={{ backgroundColor: STATUS_STYLE[s.status] }}
                            >
                              {s.code.split("-").pop()}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                          {Object.entries(STATUS_STYLE).map(([status, color]) => (
                            <span key={status} className="flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                              {STATUS_LABEL[status]}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
