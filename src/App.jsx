import { useMemo, useState } from "react";
import "./App.css";

const presets = {
  legacy: {
    name: "Legacy",
    description:
      "All bytes are priced equally. Signatures sit in the main transaction body.",
    inputBase: 148,
    inputWitness: 0,
    outputBytes: 34,
    overheadBase: 10,
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
    badge: "Full SegWit incentive",
  },
  taproot: {
    name: "Taproot",
    description:
      "Schnorr key-path spends are often leaner. Witness still gets the discount.",
    inputBase: 41,
    inputWitness: 66,
    outputBytes: 43,
    overheadBase: 10.5,
    badge: "Efficient modern spend",
  },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="card stat">
      <div className="muted small">{label}</div>
      <div className="statValue">{value}</div>
      <div className="tiny">{sub}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  helper,
}) {
  return (
    <div className="control">
      <div className="row between">
        <label>{label}</label>
        <span className="pill">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
      />
      <div className="tiny">{helper}</div>
    </div>
  );
}

export default function App() {
  const [inputCount, setInputCount] = useState(2);
  const [outputCount, setOutputCount] =
    useState(2);
  const [feeRate, setFeeRate] = useState(15);
  const [format, setFormat] = useState("native");
  const [showAdvanced, setShowAdvanced] =
    useState(false);

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

    const legacyBase =
      presets.legacy.overheadBase +
      inputCount * presets.legacy.inputBase +
      outputCount * presets.legacy.outputBytes;

    const legacyVbytes = legacyBase;
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
      legacyVbytes,
      savings,
      savingsPct,
    };
  }, [inputCount, outputCount, feeRate, current]);

  const parts = [
    {
      label: "Base transaction data",
      explainer:
        "Version, locktime, input references, output amounts, output scripts.",
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

  const comparison = [
    { key: "Legacy", value: stats.legacyVbytes },
    { key: current.name, value: stats.vbytes },
  ];

  const maxBar = Math.max(
    ...comparison.map((x) => x.value),
    1,
  );

  return (
    <div className="page">
      <div className="container">
        <section className="hero grid2">
          <div className="card big">
            <div className="tag">
              Bitcoin Transaction Fee Explorer
            </div>
            <h1>
              Why SegWit changed fee incentives
            </h1>
            <p className="lead">
              Miners care about{" "}
              <strong>feerate</strong>, not just
              total fee. SegWit makes{" "}
              <strong>
                witness data cheaper
              </strong>{" "}
              than the rest of the transaction.
            </p>

            <div className="stats3">
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

          <div className="card big">
            <div className="row between start">
              <div>
                <div className="tiny upper">
                  Current spend type
                </div>
                <h2>{current.name}</h2>
              </div>
              <div className="pill">
                {current.badge}
              </div>
            </div>

            <p>{current.description}</p>

            <div className="formulaBox">
              <div className="tiny">Fee rule</div>
              <code>
                fee = input value - output value
              </code>
              <div className="tiny topGap">
                Miner priority rule
              </div>
              <code>
                priority ≈ sat/vB, not just total
                sats
              </code>
            </div>
          </div>
        </section>

        <section className="grid2">
          <div className="card big">
            <h3>Play with the transaction</h3>
            <p className="tiny">
              Increase inputs to see why
              signatures dominate size, then
              switch formats to watch SegWit move
              much of that cost into discounted
              witness space.
            </p>

            <Slider
              label="Inputs"
              value={inputCount}
              min={1}
              max={8}
              onChange={setInputCount}
              helper="Inputs usually drive size the most."
            />
            <Slider
              label="Outputs"
              value={outputCount}
              min={1}
              max={6}
              onChange={setOutputCount}
              helper="Outputs add size, but typically less than inputs."
            />
            <Slider
              label="Feerate"
              value={feeRate}
              min={1}
              max={80}
              onChange={setFeeRate}
              helper="Measured in satoshis per virtual byte."
            />

            <div className="control">
              <label>Spend format</label>
              <div className="formatGrid">
                {Object.entries(presets).map(
                  ([key, preset]) => (
                    <button
                      key={key}
                      className={
                        format === key
                          ? "formatBtn active"
                          : "formatBtn"
                      }
                      onClick={() =>
                        setFormat(key)
                      }
                    >
                      <div>{preset.name}</div>
                      <div className="tiny">
                        {preset.badge}
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>

            <button
              className="toggleBtn"
              onClick={() =>
                setShowAdvanced((v) => !v)
              }
            >
              {showAdvanced ? "Hide" : "Show"}{" "}
              formula details
            </button>

            {showAdvanced && (
              <div className="formulaBox">
                <div>
                  base bytes = overhead + inputs ×
                  base/input + outputs ×
                  bytes/output
                </div>
                <div>
                  witness bytes = inputs ×
                  witness/input
                </div>
                <div>
                  weight = (base bytes × 4) +
                  witness bytes
                </div>
                <div>vbytes = weight ÷ 4</div>
                <div>fee = feerate × vbytes</div>
              </div>
            )}
          </div>

          <div className="stack">
            <div className="card big">
              <div className="row between">
                <div>
                  <h3>
                    Where the fee pressure comes
                    from
                  </h3>
                  <div className="tiny">
                    SegWit does not make
                    everything cheaper. It mainly
                    discounts witness data.
                  </div>
                </div>
                <div className="pill">
                  {stats.weight.toFixed(0)} wu
                  total
                </div>
              </div>

              {parts.map((row) => {
                const pct =
                  stats.weight === 0
                    ? 0
                    : (row.weighted /
                        stats.weight) *
                      100;
                return (
                  <div
                    key={row.label}
                    className="subcard"
                  >
                    <div className="row between start">
                      <div>
                        <div>{row.label}</div>
                        <div className="tiny">
                          {row.explainer}
                        </div>
                      </div>
                      <div className="right tiny">
                        <div>
                          {row.bytes.toFixed(1)}{" "}
                          bytes
                        </div>
                        <div>
                          {row.weighted.toFixed(
                            1,
                          )}{" "}
                          wu
                        </div>
                      </div>
                    </div>
                    <div className="bar">
                      <div
                        className="fill"
                        style={{
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                    <div className="row between tiny">
                      <span>{row.unitCost}</span>
                      <span>{row.emphasis}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card big">
              <h3>Legacy vs current format</h3>
              <div className="tiny">
                Same transaction purpose,
                different serialization
                incentives.
              </div>

              {comparison.map((item) => (
                <div
                  key={item.key}
                  className="compareRow"
                >
                  <div className="row between tiny">
                    <span>{item.key}</span>
                    <span>
                      {item.value.toFixed(1)} vB
                    </span>
                  </div>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{
                        width: `${(item.value / maxBar) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="formulaBox">
                <strong>Interpretation</strong>
                <p
                  className="tiny"
                  style={{ marginTop: 8 }}
                >
                  {format === "legacy"
                    ? "In legacy transactions, signatures stay in the main body, so every byte pays full price."
                    : `In ${current.name}, a meaningful share of authentication data moves into witness space, so the same transaction often clears with fewer vbytes.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats3">
          <div className="card big">
            <h3>1. Fee</h3>
            <p className="tiny">
              A transaction fee is whatever input
              value is left unassigned after
              creating the outputs.
            </p>
            <code>
              fee = total in - total out
            </code>
          </div>
          <div className="card big">
            <h3>2. Priority</h3>
            <p className="tiny">
              Miners compare transactions by
              feerate because block space is
              scarce.
            </p>
            <code>feerate = sats / vbyte</code>
          </div>
          <div className="card big">
            <h3>3. SegWit incentive</h3>
            <p className="tiny">
              Witness bytes are discounted, so
              signatures cost less than equally
              sized base data.
            </p>
            <code>weight = base×4 + witness</code>
          </div>
        </section>
      </div>
    </div>
  );
}
