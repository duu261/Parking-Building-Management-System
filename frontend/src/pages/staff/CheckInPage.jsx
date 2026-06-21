import { useEffect, useState, useRef } from "react";
import { Sparkles, CheckCircle2, Search, Camera, X, Hand } from "lucide-react";
import { Card, Field, Input, Select, Button, Alert, StatusBadge } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";

const MODE = { AUTO: "auto", RESERVATION: "reservation", MANUAL: "manual" };

export default function CheckInPage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [mode, setMode] = useState(MODE.AUTO);
  const [reservationId, setReservationId] = useState("");
  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [buildingId, setBuildingId] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Manual mode states
  const [floors, setFloors] = useState([]);
  const [floorId, setFloorId] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");

  // Initial lookups.
  useEffect(() => {
    Promise.all([staffApi.vehicleTypes(), staffApi.buildings()])
      .then(([vt, b]) => {
        setVehicleTypes(vt);
        setBuildings(b);
      })
      .catch((e) => setError(e.message));
  }, []);


  const selectMode = (next) => {
    setMode(next);
    // Reset manual mode states when switching modes
    if (next !== MODE.MANUAL) {
      setFloorId("");
      setFloors([]);
      setSlotId("");
      setSlots([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let body;
      if (mode === MODE.RESERVATION) {
        body = { reservationId: Number(reservationId) };
      } else if (mode === MODE.MANUAL) {
        body = { slotId: Number(slotId), licensePlate: plate.trim(), vehicleTypeId: Number(vehicleTypeId) };
      } else {
        // AUTO mode
        body = { licensePlate: plate.trim(), vehicleTypeId: Number(vehicleTypeId), buildingId: Number(buildingId) };
      }

      const session = await staffApi.checkIn(body);
      setResult(session);
      setPlate("");
      setReservationId("");
      setSlotId("");
      setFloorId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load floors when buildingId changes (manual mode only)
  useEffect(() => {
    if (mode === MODE.MANUAL && buildingId) {
      staffApi.floors(buildingId)
        .then((f) => {
          setFloors(f);
          setFloorId("");
          setSlots([]);
          setSlotId("");
        })
        .catch((e) => setError(e.message));
    }
  }, [buildingId, mode]);

  // Load slots when floorId changes (manual mode only)
  useEffect(() => {
    if (mode === MODE.MANUAL && floorId) {
      staffApi.slots(floorId)
        .then((s) => {
          setSlots(s);
          setSlotId("");
        })
        .catch((e) => setError(e.message));
    }
  }, [floorId, mode]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold tracking-tight">Check in a vehicle</h1>
      <p className="mt-1 text-sm text-muted">AI picks the best slot automatically, or check in a reservation.</p>

      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <ModeButton active={mode === MODE.AUTO} onClick={() => selectMode(MODE.AUTO)} icon={Sparkles}>
              Auto-allocate
            </ModeButton>
            <ModeButton active={mode === MODE.RESERVATION} onClick={() => selectMode(MODE.RESERVATION)} icon={CheckCircle2}>
              Reservation
            </ModeButton>
            <ModeButton active={mode === MODE.MANUAL} onClick={() => selectMode(MODE.MANUAL)} icon={Hand}>
              Manual
            </ModeButton>
          </div>

          {mode === MODE.RESERVATION ? (
            <Field label="Reservation ID">
              <Input
                className="nums"
                type="number"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="e.g. 1"
                required
              />
            </Field>
          ) : (
            <>
              <Field label="License plate">
                <Input
                  className="nums"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="51F-123.45"
                  maxLength={20}
                  required
                />
              </Field>

              <Field label="Vehicle type">
                <Select value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)} required>
                  <option value="" disabled>
                    Select type
                  </option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </Select>
              </Field>

              {mode === MODE.AUTO && (
                <Field label="Building">
                  <Select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required>
                    <option value="" disabled>
                      Select building
                    </option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {mode === MODE.MANUAL && (
                <>
                  <Field label="Building">
                    <Select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required>
                      <option value="" disabled>
                        Select building
                      </option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  {buildingId && (
                    <Field label="Floor">
                      <Select value={floorId} onChange={(e) => setFloorId(e.target.value)} required>
                        <option value="" disabled>
                          Select floor
                        </option>
                        {floors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}

                  {slots.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted mb-2">
                        {slots.filter(s => s.status === "AVAILABLE").length} available of {slots.length}
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {slots.map((s) => {
                          const available = s.status === "AVAILABLE";
                          const selected = slotId === String(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={!available}
                              onClick={() => setSlotId(String(s.id))}
                              className={`rounded-[var(--radius)] border px-2 py-1.5 text-xs font-medium nums transition
                                ${selected ? "border-accent bg-accent/10 text-accent ring-1 ring-accent" : ""}
                                ${available && !selected ? "border-line bg-surface hover:border-accent/50 hover:bg-accent/5 cursor-pointer" : ""}
                                ${!available ? "border-line/50 bg-elevated/30 text-muted/40 cursor-not-allowed" : ""}`}
                            >
                              {s.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <Alert>{error}</Alert>
          <Button type="submit" loading={loading} className="w-full">
            Check in
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="mt-4 border-available/40 p-5">
          <div className="flex items-center gap-2 text-available">
            <CheckCircle2 size={18} />
            <span className="font-medium">Checked in</span>
            <span className="ml-auto text-xs text-muted">
              {result.autoAllocated ? "Auto-allocated" : "Manual"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Plate" value={<span className="nums">{result.licensePlate}</span>} />
            <Info label="Slot" value={result.buildingName ? `${result.buildingName} › ${result.floorName} › ${result.slotCode}` : result.slotCode ?? result.slotId} />
            <Info label="Session" value={<span className="nums">#{result.id}</span>} />
            <Info label="Status" value={<StatusBadge status={result.status} />} />
          </div>
          {result.allocationScore && (
            <div className="mt-4">
              <ScoreBreakdownCard score={result.allocationScore} />
            </div>
          )}
        </Card>
      )}

      <TicketLookup />
    </div>
  );
}

function TicketLookup() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const [plateResults, setPlateResults] = useState(null);
  const [lookupErr, setLookupErr] = useState("");
  const [searching, setSearching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const readerRef = useRef(null);

  const [checkedIn, setCheckedIn] = useState(null);

  const lookup = async (scannedText) => {
    const text = scannedText.trim();
    if (!text) return;
    setSearching(true);
    setLookupErr("");
    setFound(null);
    setPlateResults(null);
    setCheckedIn(null);
    try {
      if (text.startsWith("RES:")) {
        const resId = Number(text.slice(4));
        const session = await staffApi.checkIn({ reservationId: resId });
        setCheckedIn(session);
      } else {
        try {
          const session = await staffApi.sessionByTicket(text);
          setFound(session);
        } catch {
          const results = await staffApi.sessionsByPlate(text);
          if (results.length > 0) {
            setPlateResults(results);
          } else {
            setLookupErr("No session found for this ticket code or plate");
          }
        }
      }
    } catch (err) {
      setLookupErr(err.message);
    } finally {
      setSearching(false);
    }
  };

  const search = (e) => {
    e.preventDefault();
    lookup(code);
  };

  const stopScanner = async () => {
    if (readerRef.current) {
      try { await readerRef.current.stop(); } catch { /* scanner already stopped */ }
      readerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setScanning(true);
    setLookupErr("");
    const { Html5Qrcode } = await import("html5-qrcode");
    const reader = new Html5Qrcode(scannerRef.current.id);
    readerRef.current = reader;
    try {
      await reader.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          setCode(text);
          stopScanner();
          lookup(text);
        },
        () => {},
      );
    } catch {
      setLookupErr("Camera access denied or unavailable.");
      setScanning(false);
    }
  };

  useEffect(() => () => { if (readerRef.current) readerRef.current.stop().catch(() => {}); }, []);

  return (
    <Card className="mt-6 p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Ticket lookup</h2>
      <form onSubmit={search} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ticket code or plate number..."
          className="flex-1"
        />
        <Button type="submit" variant="secondary" loading={searching}>
          <Search size={16} />
        </Button>
        <Button type="button" variant="secondary" onClick={scanning ? stopScanner : startScanner}>
          {scanning ? <X size={16} /> : <Camera size={16} />}
        </Button>
      </form>

      {scanning && (
        <div className="mt-3 overflow-hidden rounded-[var(--radius)] border border-line">
          <div id="qr-reader" ref={scannerRef} />
        </div>
      )}

      {lookupErr && <p className="mt-2 text-sm text-occupied">{lookupErr}</p>}
      {found && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Session" value={<span className="nums">#{found.id}</span>} />
            <Info label="Plate" value={<span className="nums">{found.licensePlate}</span>} />
            <Info label="Status" value={<StatusBadge status={found.status} />} />
            <Info label="Slot" value={found.buildingName ? `${found.buildingName} › ${found.floorName} › ${found.slotCode}` : found.slotCode ?? found.slotId} />
            <Info label="Checked in" value={new Date(found.checkInAt).toLocaleString()} />
          </div>
          {found.status === "ACTIVE" && (
            <CheckOutAction sessionId={found.id} onDone={() => lookup(code)} />
          )}
        </>
      )}
      {plateResults && (
        <div className="mt-3">
          <p className="text-sm font-medium text-muted">
            {plateResults.length} active session{plateResults.length > 1 ? "s" : ""} for this plate
          </p>
          <div className="mt-2 space-y-2">
            {plateResults.map((s) => (
              <div key={s.id} className="rounded-[var(--radius)] border border-line bg-elevated/50 p-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Session" value={<span className="nums">#{s.id}</span>} />
                  <Info label="Plate" value={<span className="nums">{s.licensePlate}</span>} />
                  <Info label="Slot" value={s.buildingName ? `${s.buildingName} › ${s.floorName} › ${s.slotCode}` : s.slotCode ?? s.slotId} />
                  <Info label="Checked in" value={new Date(s.checkInAt).toLocaleString()} />
                </div>
                {s.status === "ACTIVE" && (
                  <CheckOutAction sessionId={s.id} onDone={() => lookup(code)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {checkedIn && (
        <div className="mt-3">
          <p className="flex items-center gap-1 text-sm text-available"><CheckCircle2 size={14} /> Reservation checked in</p>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <Info label="Session" value={<span className="nums">#{checkedIn.id}</span>} />
            <Info label="Plate" value={<span className="nums">{checkedIn.licensePlate}</span>} />
            <Info label="Slot" value={<span className="nums">{checkedIn.buildingName ? `${checkedIn.buildingName} › ${checkedIn.floorName} › ${checkedIn.slotCode}` : checkedIn.slotCode ?? checkedIn.slotId}</span>} />
          </div>
        </div>
      )}
    </Card>
  );
}

function ModeButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
        active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:bg-elevated"
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function CheckOutAction({ sessionId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const doCheckOut = async () => {
    setLoading(true);
    setErr("");
    try {
      await staffApi.checkOut(sessionId);
      setDone(true);
      setTimeout(onDone, 1500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) return <p className="mt-3 text-sm text-available flex items-center gap-1"><CheckCircle2 size={14} /> Checked out</p>;

  return (
    <div className="mt-3">
      {err && <p className="mb-2 text-sm text-occupied">{err}</p>}
      <Button onClick={doCheckOut} loading={loading} className="w-full">
        Check out session #{sessionId}
      </Button>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
