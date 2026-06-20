import { useEffect, useState } from "react";
import { Sparkles, Hand, CheckCircle2, Search } from "lucide-react";
import { Card, Field, Input, Select, Button, Alert, StatusBadge } from "../../components/ui";
import { staffApi } from "../../lib/endpoints";

const MODE = { AUTO: "auto", MANUAL: "manual" };

export default function CheckInPage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [mode, setMode] = useState(MODE.AUTO);
  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [slotId, setSlotId] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Initial lookups.
  useEffect(() => {
    Promise.all([staffApi.vehicleTypes(), staffApi.buildings()])
      .then(([vt, b]) => {
        setVehicleTypes(vt);
        setBuildings(b);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Load floors when a building is chosen (manual mode).
  useEffect(() => {
    if (!buildingId) return;
    staffApi.floors(buildingId).then(setFloors).catch((e) => setError(e.message));
  }, [buildingId]);

  // Load slots when a floor is chosen.
  useEffect(() => {
    if (!floorId) return;
    staffApi.slots(floorId).then(setSlots).catch((e) => setError(e.message));
  }, [floorId]);

  const selectMode = (next) => {
    setMode(next);
    setFloorId("");
    setSlotId("");
    setSlots([]);
  };

  const onBuilding = (e) => {
    setBuildingId(e.target.value);
    setFloorId("");
    setSlotId("");
    setFloors([]);
    setSlots([]);
  };

  const onFloor = (e) => {
    setFloorId(e.target.value);
    setSlotId("");
    setSlots([]);
  };

  const availableSlots = slots.filter((s) => s.status === "AVAILABLE");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const body = { licensePlate: plate.trim(), vehicleTypeId: Number(vehicleTypeId) };
      if (mode === MODE.AUTO) body.buildingId = Number(buildingId);
      else body.slotId = Number(slotId);

      const session = await staffApi.checkIn(body);
      setResult(session);
      setPlate("");
      setSlotId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold tracking-tight">Check in a vehicle</h1>
      <p className="mt-1 text-sm text-muted">Auto-allocate a slot, or pick one manually.</p>

      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-2">
            <ModeButton active={mode === MODE.AUTO} onClick={() => selectMode(MODE.AUTO)} icon={Sparkles}>
              Auto-allocate
            </ModeButton>
            <ModeButton active={mode === MODE.MANUAL} onClick={() => selectMode(MODE.MANUAL)} icon={Hand}>
              Manual pick
            </ModeButton>
          </div>

          <Field label="Building">
            <Select value={buildingId} onChange={onBuilding} required>
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

          {mode === MODE.MANUAL && (
            <>
              <Field label="Floor">
                <Select value={floorId} onChange={onFloor} required disabled={!buildingId}>
                  <option value="" disabled>
                    Select floor
                  </option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (level {f.level})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Available slot">
                <Select value={slotId} onChange={(e) => setSlotId(e.target.value)} required disabled={!floorId}>
                  <option value="" disabled>
                    {floorId && availableSlots.length === 0 ? "No available slots" : "Select slot"}
                  </option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </Select>
              </Field>
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
            <Info label="Slot ID" value={<span className="nums">{result.slotId}</span>} />
            <Info label="Session" value={<span className="nums">#{result.id}</span>} />
            <Info label="Status" value={<StatusBadge status={result.status} />} />
          </div>
        </Card>
      )}

      <TicketLookup />
    </div>
  );
}

function TicketLookup() {
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const [lookupErr, setLookupErr] = useState("");
  const [searching, setSearching] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSearching(true);
    setLookupErr("");
    setFound(null);
    try {
      const session = await staffApi.sessionByTicket(code.trim());
      setFound(session);
    } catch (err) {
      setLookupErr(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Card className="mt-6 p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Ticket lookup</h2>
      <form onSubmit={search} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter ticket code..."
          className="flex-1"
        />
        <Button type="submit" variant="secondary" loading={searching}>
          <Search size={16} /> Look up
        </Button>
      </form>
      {lookupErr && <p className="mt-2 text-sm text-occupied">{lookupErr}</p>}
      {found && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Info label="Session" value={<span className="nums">#{found.id}</span>} />
          <Info label="Plate" value={<span className="nums">{found.licensePlate}</span>} />
          <Info label="Status" value={<StatusBadge status={found.status} />} />
          <Info label="Checked in" value={new Date(found.checkedInAt).toLocaleString()} />
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

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
