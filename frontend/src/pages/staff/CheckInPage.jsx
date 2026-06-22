import { useEffect, useState, useRef } from "react";
import { Sparkles, CheckCircle2, Search, Camera, X, Hand, CreditCard } from "lucide-react";
import { Card, Field, Input, Select, Button, Alert } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";
import ScoreBreakdownCard from "../../components/ScoreBreakdownCard";

const TAB = { SCAN: "scan", CHECKIN: "checkin" };
const MODE = { AUTO: "auto", MANUAL: "manual" };

export default function CheckInPage() {
  const [tab, setTab] = useState(TAB.SCAN);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([staffApi.vehicleTypes(), staffApi.buildings()])
      .then(([vt, b]) => { setVehicleTypes(vt); setBuildings(b); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold tracking-tight">Gate Operations</h1>
      <p className="mt-1 text-sm text-muted">Scan any QR — ticket, reservation, or monthly pass.</p>

      <div className="mt-4 flex gap-1 rounded-lg border border-line bg-elevated/50 p-1">
        <TabBtn active={tab === TAB.SCAN} onClick={() => setTab(TAB.SCAN)} icon={Search}>
          Scan / Lookup
        </TabBtn>
        <TabBtn active={tab === TAB.CHECKIN} onClick={() => setTab(TAB.CHECKIN)} icon={Hand}>
          Walk-in Check In
        </TabBtn>
      </div>

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      {tab === TAB.SCAN ? (
        <UniversalScanner buildings={buildings} vehicleTypes={vehicleTypes} />
      ) : (
        <CheckInForm buildings={buildings} vehicleTypes={vehicleTypes} />
      )}
    </div>
  );
}

/* ─── Tab 1: Universal Scanner ──────────────────────────────────── */

function UniversalScanner({ buildings }) {
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const [plateResults, setPlateResults] = useState(null);
  const [passResult, setPassResult] = useState(null);
  const [checkedIn, setCheckedIn] = useState(null);
  const [lookupErr, setLookupErr] = useState("");
  const [searching, setSearching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const readerRef = useRef(null);

  const reset = () => {
    setFound(null);
    setPlateResults(null);
    setPassResult(null);
    setCheckedIn(null);
    setLookupErr("");
  };

  const lookup = async (scannedText) => {
    const text = scannedText.trim();
    if (!text) return;
    setSearching(true);
    reset();
    try {
      if (text.startsWith("PASS:")) {
        const plate = text.split("|")[1];
        if (!plate) { setLookupErr("Invalid pass QR format"); return; }
        const pass = await staffApi.passLookup(plate);
        setPassResult(pass);
      } else if (text.startsWith("RES:")) {
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
            setLookupErr("No match — try a ticket code, plate, or QR scan");
          }
        }
      }
    } catch (err) {
      setLookupErr(err.message);
    } finally {
      setSearching(false);
    }
  };

  const search = (e) => { e.preventDefault(); lookup(code); };

  const stopScanner = async () => {
    if (readerRef.current) {
      try { await readerRef.current.stop(); } catch { /* already stopped */ }
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
        (text) => { setCode(text); stopScanner(); lookup(text); },
        () => {},
      );
    } catch {
      setLookupErr("Camera access denied or unavailable.");
      setScanning(false);
    }
  };

  useEffect(() => () => { if (readerRef.current) readerRef.current.stop().catch(() => {}); }, []);

  return (
    <Card className="mt-4 p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Scan or search</h2>
      <form onSubmit={search} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ticket code, plate, or RES:123 / PASS:..."
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

      {/* ── Pass QR result ── */}
      {passResult && (
        <PassCheckIn passInfo={passResult} buildings={buildings} onDone={() => { reset(); setCode(""); }} />
      )}

      {/* ── Ticket / session result ── */}
      {found && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Info label="Session" value={<span className="nums">#{found.id}</span>} />
            <Info label="Plate" value={<span className="nums">{found.licensePlate}</span>} />
            <Info label="Vehicle" value={found.vehicleTypeName} />
            <Info label="Slot" value={found.buildingName ? `${found.buildingName} › ${found.floorName} › ${found.slotCode}` : found.slotCode ?? found.slotId} />
            <Info label="Status" value={found.status} />
            <Info label="Checked in" value={found.checkInAt ? new Date(found.checkInAt).toLocaleString("vi-VN") : "-"} />
          </div>
          {found.status === "ACTIVE" && (
            <CheckOutAction sessionId={found.id} onDone={() => lookup(code)} />
          )}
          {found.status === "AWAITING_PAYMENT" && found.paymentId && (
            <SettlePayment paymentId={found.paymentId} amount={found.amountCharged} onDone={() => lookup(code)} />
          )}
        </>
      )}

      {/* ── Plate search results ── */}
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
                  <Info label="Vehicle" value={s.vehicleTypeName} />
                  <Info label="Slot" value={s.buildingName ? `${s.buildingName} › ${s.floorName} › ${s.slotCode}` : s.slotCode ?? s.slotId} />
                  <Info label="Status" value={s.status} />
                </div>
                {s.status === "ACTIVE" && (
                  <CheckOutAction sessionId={s.id} onDone={() => lookup(code)} />
                )}
                {s.status === "AWAITING_PAYMENT" && s.paymentId && (
                  <SettlePayment paymentId={s.paymentId} amount={s.amountCharged} onDone={() => lookup(code)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reservation check-in result ── */}
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

/* ─── Pass QR → quick check-in ──────────────────────────────────── */

function PassCheckIn({ passInfo, buildings, onDone }) {
  const [buildingId, setBuildingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!buildingId) return;
    setLoading(true);
    setErr("");
    try {
      const session = await staffApi.checkIn({
        licensePlate: passInfo.licensePlate,
        vehicleTypeId: passInfo.vehicleTypeId,
        buildingId: Number(buildingId),
      });
      setResult(session);
      setTimeout(onDone, 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) return (
    <div className="mt-3">
      <p className="flex items-center gap-1 text-sm text-available">
        <CheckCircle2 size={14} /> Pass holder checked in — {result.buildingName} › {result.floorName} › {result.slotCode}
      </p>
      {result.allocationScore && (
        <div className="mt-2"><ScoreBreakdownCard score={result.allocationScore} /></div>
      )}
    </div>
  );

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-available/30 bg-available/5 p-3">
        <p className="text-sm font-medium text-available flex items-center gap-1.5">
          <CheckCircle2 size={13} /> Monthly Pass Holder
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <Info label="Plate" value={passInfo.licensePlate} />
          <Info label="Vehicle" value={passInfo.vehicleTypeName} />
          <Info label="Valid" value={`${passInfo.validFrom} → ${passInfo.validUntil}`} />
          <Info label="Owner" value={passInfo.userFullName} />
        </div>
      </div>
      <Field label="Building (AI auto-allocates slot)">
        <Select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required>
          <option value="">Select building</option>
          {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </Field>
      <Button onClick={submit} loading={loading} className="w-full">
        <Sparkles size={16} /> Check in with pass
      </Button>
      {err && <p className="text-sm text-occupied">{err}</p>}
    </div>
  );
}

/* ─── Tab 2: Walk-in Check In form ──────────────────────────────── */

function CheckInForm({ buildings, vehicleTypes }) {
  const [mode, setMode] = useState(MODE.AUTO);
  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [passInfo, setPassInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [floors, setFloors] = useState([]);
  const [floorId, setFloorId] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");

  useEffect(() => {
    if (plate.trim().length < 3) { setPassInfo(null); return; }
    const t = setTimeout(() => {
      staffApi.passLookup(plate.trim())
        .then((p) => { setPassInfo(p); setVehicleTypeId(String(p.vehicleTypeId)); })
        .catch(() => setPassInfo(null));
    }, 400);
    return () => clearTimeout(t);
  }, [plate]);

  const selectMode = (next) => {
    setMode(next);
    if (next !== MODE.MANUAL) { setFloorId(""); setFloors([]); setSlotId(""); setSlots([]); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let body;
      if (mode === MODE.MANUAL) {
        body = { slotId: Number(slotId), licensePlate: plate.trim(), vehicleTypeId: Number(vehicleTypeId) };
      } else {
        body = { licensePlate: plate.trim(), vehicleTypeId: Number(vehicleTypeId), buildingId: Number(buildingId) };
      }
      const session = await staffApi.checkIn(body);
      setResult(session);
      setPlate("");
      setSlotId("");
      setFloorId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === MODE.MANUAL && buildingId) {
      staffApi.floors(buildingId)
        .then((f) => { setFloors(f); setFloorId(""); setSlots([]); setSlotId(""); })
        .catch((e) => setError(e.message));
    }
  }, [buildingId, mode]);

  useEffect(() => {
    if (mode === MODE.MANUAL && floorId) {
      staffApi.slots(floorId)
        .then((s) => { setSlots(s); setSlotId(""); })
        .catch((e) => setError(e.message));
    }
  }, [floorId, mode]);

  return (
    <>
      <Card className="mt-4 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <ModeButton active={mode === MODE.AUTO} onClick={() => selectMode(MODE.AUTO)} icon={Sparkles}>
              AI Auto
            </ModeButton>
            <ModeButton active={mode === MODE.MANUAL} onClick={() => selectMode(MODE.MANUAL)} icon={Hand}>
              Manual Slot
            </ModeButton>
          </div>

          <Field label="License plate">
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="51F-123.45"
              maxLength={20}
              required
            />
            {passInfo && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-available">
                <CheckCircle2 size={13} /> Monthly pass — {passInfo.vehicleTypeName} — {passInfo.userFullName}
              </p>
            )}
          </Field>

          <Field label="Vehicle type">
            <Select value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)} required>
              <option value="" disabled>Select type</option>
              {vehicleTypes.map((vt) => (
                <option key={vt.id} value={vt.id}>{vt.name}</option>
              ))}
            </Select>
          </Field>

          {mode === MODE.AUTO && (
            <Field label="Building (AI picks best slot)">
              <Select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required>
                <option value="" disabled>Select building</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
          )}

          {mode === MODE.MANUAL && (
            <>
              <Field label="Building">
                <Select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} required>
                  <option value="" disabled>Select building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </Field>

              {buildingId && (
                <Field label="Floor">
                  <Select value={floorId} onChange={(e) => setFloorId(e.target.value)} required>
                    <option value="" disabled>Select floor</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
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

          {error && <Alert variant="error">{error}</Alert>}
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
            <Info label="Session" value={<span className="nums">#{result.id}</span>} />
            <Info label="Plate" value={<span className="nums">{result.licensePlate}</span>} />
            <Info label="Slot" value={`${result.buildingName} › ${result.floorName} › ${result.slotCode}`} />
            <Info label="Ticket" value={<span className="nums">{result.ticketCode}</span>} />
          </div>
          {result.allocationScore && (
            <div className="mt-4">
              <ScoreBreakdownCard score={result.allocationScore} />
            </div>
          )}
        </Card>
      )}
    </>
  );
}

/* ─── Shared helpers ────────────────────────────────────────────── */

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
        active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
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

const money = (n) => Number(n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function SettlePayment({ paymentId, amount, onDone }) {
  const [settling, setSettling] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const settleCash = async () => {
    setSettling(true);
    setErr("");
    try {
      await staffApi.settlePayment(paymentId, "CASH");
      setDone(true);
      setTimeout(onDone, 1500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSettling(false);
    }
  };

  if (done) return <p className="mt-3 text-sm text-available flex items-center gap-1"><CheckCircle2 size={14} /> Paid — slot freed</p>;

  return (
    <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
      <p className="text-sm font-medium">Awaiting payment: <span className="nums text-base font-bold text-warning">{money(amount)}</span></p>
      <div className="mt-3 flex gap-3">
        <button
          onClick={settleCash}
          disabled={settling}
          className="rounded-md bg-available px-4 py-2 text-sm font-medium text-white transition hover:bg-available/80 disabled:opacity-50"
        >
          {settling ? "Processing…" : "Settle Cash"}
        </button>
        <span className="flex items-center text-xs text-muted">or driver pays via VNPay on their phone</span>
      </div>
      {err && <p className="mt-2 text-sm text-occupied">{err}</p>}
    </div>
  );
}

function CheckOutAction({ sessionId, onDone }) {
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [settled, setSettled] = useState(false);

  const doCheckOut = async () => {
    setLoading(true);
    setErr("");
    try {
      const session = await staffApi.checkOut(sessionId);
      if (session.status === "COMPLETED") {
        setSettled(true);
        setTimeout(onDone, 1500);
      } else {
        setResult(session);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const settleCash = async () => {
    setSettling(true);
    setErr("");
    try {
      await staffApi.settlePayment(result.paymentId, "CASH");
      setSettled(true);
      setTimeout(onDone, 1500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSettling(false);
    }
  };

  if (settled) return <p className="mt-3 text-sm text-available flex items-center gap-1"><CheckCircle2 size={14} /> Completed — slot freed</p>;

  if (result) return (
    <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
      <p className="text-sm font-medium">Amount due: <span className="nums text-base font-bold text-warning">{money(result.amountCharged)}</span></p>
      <div className="mt-3 flex gap-3">
        <button
          onClick={settleCash}
          disabled={settling}
          className="rounded-md bg-available px-4 py-2 text-sm font-medium text-white transition hover:bg-available/80 disabled:opacity-50"
        >
          {settling ? "Processing…" : "Settle Cash"}
        </button>
        <span className="flex items-center text-xs text-muted">or driver pays via VNPay on their phone</span>
      </div>
      {err && <p className="mt-2 text-sm text-occupied">{err}</p>}
    </div>
  );

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
