import { useMemo, useState } from "react";

export default function BitcoinFeeSegwitVisualizer() {
  const [inputCount, setInputCount] = useState(2);
  const [outputCount, setOutputCount] =
    useState(2);
  const [feeRate, setFeeRate] = useState(15);
  const [format, setFormat] = useState("native");
  const [showAdvanced, setShowAdvanced] =
    useState(false);

  const presets = {
    legacy: {
      name: "Legacy",
      description:
        "All bytes are priced equally. Signatures sit in the main transaction body.",
      inputBase: 148,
      inputWitness: 0,
      outputBytes: 34,
      overheadBase: 10,
      color: "border-zinc-400",
      badge: "No witness discount",
    },
    nested: {
      name: "Nested SegWit",
      description:
        "SegWit data is discounted, but wrapped for backward compatibility.",
      inputBase: 64,
      inputWitness: 107,
      outputBytes: 32,
      overheadBase: 10.5,
      color: "border-blue-400",
      badge: "Partial witness discount",
    },
    native: {
      name: "Native SegWit",
      description:
        "Witness is separated cleanly. Signature-heavy data gets cheaper in fee terms.",
      inputBase: 41,
      inputWitness: 107,
      outputBytes: 31,
      overheadBase: 10.5,
      color: "border-emerald-400",
      badge: "Full SegWit incentive",
    },
    taproot: {
      name: "Taproot",
      description:
        "Schnorr key-path spends are even leaner. Witness still gets the discount.",
      inputBase: 41,
      inputWitness: 66,
      outputBytes: 43,
      overheadBase: 10.5,
      color: "border-violet-400",
      badge: "Efficient modern spend",
    },
  };

  const current = presets[format];

  const stats = useMemo(() => {
    const baseBytes =
      current.overheadBase +
      inputCount * current.inputBase +
      outputCount * current.outputBytes;
    const witnessBytes =
      inputCount * current.inputWitness;
    const weight = baseBytes * 4 + witnessBytes;
    const vbytes = weight / 4;
    const totalFee = vbytes * feeRate;
    const witnessShare =
      weight === 0
        ? 0
        : (witnessBytes / weight) * 100;
    const baseShare =
      weight === 0
        ? 0
        : ((baseBytes * 4) / weight) * 100;

    const legacyWeight =
      (presets.legacy.overheadBase +
        inputCount * presets.legacy.inputBase +
        outputCount *
          presets.legacy.outputBytes) *
      4;
    const legacyVbytes = legacyWeight / 4;
    const savings = legacyVbytes - vbytes;
    const savingsPct =
      legacyVbytes > 0
        ? (savings / legacyVbytes) * 100
        : 0;

    return {
      baseBytes,
      witnessBytes,
      weight,
      vbytes,
      totalFee,
      witnessShare,
      baseShare,
      legacyVbytes,
      savings,
      savingsPct,
    };
  }, [
    inputCount,
    outputCount,
    feeRate,
    current,
    format,
  ]);

  const partRows = [
    {
      label: "Base transaction data",
      explainer:
        "Version, locktime, input references, amounts, output scripts.",
      bytes: stats.baseBytes,
      weighted: stats.baseBytes * 4,
      unitCost: "4 wu per byte",
      emphasis: "More expensive",
    },
    {
      label: "Witness data",
      explainer:
        "Mostly signatures, pubkeys, and witness scripts.",
      bytes: stats.witnessBytes,
      weighted: stats.witnessBytes,
      unitCost: "1 wu per byte",
      emphasis: "Discounted",
    },
  ];

  const legacyComparison = [
    { key: "Legacy", value: stats.legacyVbytes },
    { key: current.name, value: stats.vbytes },
  ];

  const maxBar = Math.max(
    ...legacyComparison.map((item) => item.value),
    1,
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
              Bitcoin Transaction Fee Explorer
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Why SegWit changed fee incentives
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
              This interactive page shows the core
              idea: miners care about{" "}
              <span className="font-semibold text-white">
                feerate
              </span>
              , not just total fee, and SegWit
              makes
              <span className="font-semibold text-white">
                {" "}
                witness data cheaper
              </span>{" "}
              than the rest of the transaction.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Virtual size"
                value={`${stats.vbytes.toFixed(1)} vB`}
                sub="What wallets usually use for fees"
              />
              <StatCard
                label="Total fee"
                value={`${Math.round(stats.totalFee)} sats`}
                sub={`${feeRate} sat/vB × ${stats.vbytes.toFixed(1)} vB`}
              />
              <StatCard
                label="Savings vs legacy"
                value={
                  format === "legacy"
                    ? "0%"
                    : `${stats.savingsPct.toFixed(1)}%`
                }
                sub={
                  format === "legacy"
                    ? "No witness discount here"
                    : `${stats.savings.toFixed(1)} fewer vbytes`
                }
              />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                  Current spend type
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {current.name}
                </h2>
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs ${current.color} text-zinc-200`}
              >
                {current.badge}
              </div>
            </div>
            <p className="mt-4 leading-7 text-zinc-300">
              {current.description}
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <p className="text-sm text-zinc-400">
                Fee rule
              </p>
              <code className="mt-2 block text-lg text-emerald-300">
                fee = input value - output value
              </code>
              <p className="mt-4 text-sm text-zinc-400">
                Miner priority rule
              </p>
              <code className="mt-2 block text-lg text-sky-300">
                priority ≈ sat/vB, not just total
                sats
              </code>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
            <h3 className="text-xl font-semibold">
              Play with the transaction
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Increase inputs to see why
              signatures dominate size, then
              switch formats to watch SegWit move
              much of that cost into discounted
              witness space.
            </p>

            <div className="mt-6 grid gap-6">
              <ControlSlider
                label="Inputs"
                value={inputCount}
                min={1}
                max={8}
                onChange={setInputCount}
                helper="Inputs usually drive size the most."
              />
              <ControlSlider
                label="Outputs"
                value={outputCount}
                min={1}
                max={6}
                onChange={setOutputCount}
                helper="Outputs add size, but typically less than inputs."
              />
              <ControlSlider
                label="Feerate"
                value={feeRate}
                min={1}
                max={80}
                onChange={setFeeRate}
                helper="Measured in satoshis per virtual byte."
              />

              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-300">
                  Spend format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(presets).map(
                    ([key, preset]) => (
                      <button
                        key={key}
                        onClick={() =>
                          setFormat(key)
                        }
                        className={`rounded-2xl border p-4 text-left transition ${format === key ? "border-white bg-white/10" : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"}`}
                      >
                        <div className="font-medium">
                          {preset.name}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-zinc-400">
                          {preset.badge}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  setShowAdvanced((v) => !v)
                }
                className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/60"
              >
                {showAdvanced ? "Hide" : "Show"}{" "}
                formula details
              </button>

              {showAdvanced && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
                  <div>
                    <span className="text-zinc-500">
                      base bytes
                    </span>{" "}
                    = overhead + inputs ×
                    base/input + outputs ×
                    bytes/output
                  </div>
                  <div>
                    <span className="text-zinc-500">
                      witness bytes
                    </span>{" "}
                    = inputs × witness/input
                  </div>
                  <div>
                    <span className="text-zinc-500">
                      weight
                    </span>{" "}
                    = (base bytes × 4) + witness
                    bytes
                  </div>
                  <div>
                    <span className="text-zinc-500">
                      vbytes
                    </span>{" "}
                    = weight ÷ 4
                  </div>
                  <div>
                    <span className="text-zinc-500">
                      fee
                    </span>{" "}
                    = feerate × vbytes
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Where the fee pressure comes
                    from
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    SegWit does not make
                    everything cheaper. It mainly
                    discounts witness data.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                  {stats.weight.toFixed(0)} wu
                  total
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {partRows.map((row) => {
                  const pct =
                    stats.weight === 0
                      ? 0
                      : (row.weighted /
                          stats.weight) *
                        100;
                  return (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {row.label}
                          </div>
                          <div className="mt-1 text-sm text-zinc-400">
                            {row.explainer}
                          </div>
                        </div>
                        <div className="text-right text-sm text-zinc-300">
                          <div>
                            {row.bytes.toFixed(1)}{" "}
                            bytes
                          </div>
                          <div className="text-zinc-500">
                            {row.weighted.toFixed(
                              1,
                            )}{" "}
                            wu
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>
                          {row.unitCost}
                        </span>
                        <span>
                          {row.emphasis}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
              <h3 className="text-xl font-semibold">
                Legacy vs current format
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Same economic transaction,
                different serialization
                incentives.
              </p>

              <div className="mt-6 space-y-4">
                {legacyComparison.map((item) => (
                  <div key={item.key}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-300">
                        {item.key}
                      </span>
                      <span className="text-zinc-500">
                        {item.value.toFixed(1)} vB
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${(item.value / maxBar) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <h4 className="font-medium">
                  Interpretation
                </h4>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  {format === "legacy"
                    ? "In legacy transactions, signatures stay in the main body, so every byte pays full price."
                    : `In ${current.name}, a meaningful share of authentication data moves into witness space, so the same transaction skeleton often clears with fewer vbytes.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <MiniExplain
            title="1. Fee"
            body="A transaction fee is whatever input value is left unassigned after creating the outputs."
            code="fee = total in - total out"
          />
          <MiniExplain
            title="2. Priority"
            body="Miners compare transactions by feerate because block space is scarce."
            code="feerate = sats / vbyte"
          />
          <MiniExplain
            title="3. SegWit incentive"
            body="Witness bytes are discounted, so signatures cost less than equally sized base data."
            code="weight = base×4 + witness"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="text-sm text-zinc-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">
        {value}
      </div>
      <div className="mt-2 text-xs leading-5 text-zinc-500">
        {sub}
      </div>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  onChange,
  helper,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">
          {label}
        </label>
        <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className="w-full accent-white"
      />
      <p className="mt-2 text-xs text-zinc-500">
        {helper}
      </p>
    </div>
  );
}

function MiniExplain({ title, body, code }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
      <h3 className="text-lg font-semibold">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-300">
        {body}
      </p>
      <code className="mt-4 block rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
        {code}
      </code>
    </div>
  );
}
