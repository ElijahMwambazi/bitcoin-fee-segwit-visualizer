# Bitcoin Fee & SegWit Visualizer

An open-source interactive web application for exploring how Bitcoin transaction fees are determined and how SegWit changes fee incentives at the transaction-serialization level.

The project is built to make fee mechanics inspectable rather than opaque. Instead of treating fees as a black-box wallet output, it exposes the relationship between transaction structure, weight accounting, and miner fee preference.

---

## What it does

This application visualizes the economic and structural components of a Bitcoin transaction by letting the user vary:

- input count
- output count
- feerate
- spend format

It then computes and displays:

- base bytes
- witness bytes
- total weight
- virtual size
- estimated fee
- relative savings versus legacy serialization

The currently supported spend formats are:

- Legacy
- Nested SegWit
- Native SegWit
- Taproot

---

## Motivation

In Bitcoin, the fee is not encoded as an explicit field. It emerges from transaction construction:

```text
fee = total input value - total output value
```

That means a transaction spends existing UTXOs as inputs, creates new outputs, and whatever value is left over becomes the fee paid to miners.

### How fees are determined

At a mechanical level, the fee is simple:

```text
fee = sum(inputs) - sum(outputs)
```

Example:

```text
inputs:
  0.00300000 BTC
+ 0.00200000 BTC
----------------
= 0.00500000 BTC

outputs:
  recipient = 0.00450000 BTC
  change    = 0.00040000 BTC
-----------------------------
total out   = 0.00490000 BTC

fee = 0.00500000 - 0.00490000
    = 0.00010000 BTC
```

So the fee is determined by value flow, not by a dedicated transaction field.

However, block inclusion is generally driven by **feerate**, not absolute fee:

```text
feerate = sats / vbyte
```

Miners care about how much fee a transaction pays relative to the block space it consumes. A transaction paying 10,000 sats is not automatically more attractive than one paying 5,000 sats if the second transaction is much smaller.

Example:

```text
Tx A:
  fee     = 10,000 sats
  size    = 500 vB
  feerate = 20 sat/vB

Tx B:
  fee     = 5,000 sats
  size    = 100 vB
  feerate = 50 sat/vB
```

In a fee market, Tx B is usually more competitive because it pays more per unit of block space.

### Why transaction structure matters

The size of a transaction depends on its serialized contents. The largest contributor is often the set of inputs, because each input must include the data needed to prove authorization to spend a previous output.

A simplified view of transaction structure:

```text
transaction
├── version
├── inputs
│   ├── prev txid
│   ├── output index
│   ├── unlocking/authentication data
│   └── sequence
├── outputs
│   ├── amount
│   └── locking script
└── locktime
```

In practice:

- more inputs usually increases size significantly
- more outputs also increases size
- signature-heavy or script-heavy spending conditions increase size further

This is why wallet UTXO selection affects fees: spending many small UTXOs often costs more than spending one large UTXO, even if the payment amount is the same.

### How SegWit changes fee incentives

Before SegWit, all serialized bytes were effectively priced the same for fee purposes.

SegWit changed the fee model by introducing **weight units** and discounting witness data relative to base transaction data:

```text
weight = (base bytes × 4) + witness bytes
vbytes = weight / 4
```

This means:

- 1 base byte = 4 weight units
- 1 witness byte = 1 weight unit

So witness data is effectively discounted relative to non-witness data.

### Base data vs witness data

SegWit splits transaction data into two economic categories.

**Base data** includes the structural parts of the transaction, such as:

- version
- locktime
- input outpoints
- sequence
- output amounts
- output scripts
- other non-witness fields

**Witness data** includes the spend authorization material, such as:

- signatures
- public keys
- witness stack items
- witness scripts

The key policy change is that these two categories are not charged equally.

Before SegWit:

```text
all bytes cost the same
```

After SegWit:

```text
base byte    = expensive
witness byte = discounted
```

### Incentive effect

This creates a new incentive gradient inside the transaction:

- non-witness data remains relatively expensive
- witness data becomes cheaper in fee terms
- signature-heavy spends benefit more from SegWit serialization
- moving authentication data into witness space reduces effective cost

Conceptually, SegWit makes the transaction “skeleton” more expensive than the authentication material attached to it.

That is why SegWit spend types usually have better fee efficiency than legacy equivalents, especially when signatures dominate the size of the transaction.

### Why this matters

SegWit does not reduce fees by magic. It changes *which bytes are expensive*.

That has several consequences:

- legacy spends keep signatures in the main transaction body, so they pay full price for that data
- SegWit spends move signatures and related data into witness space, so those bytes are discounted
- transactions with many inputs benefit more, because inputs usually carry most of the authentication data
- multisig and more complex script paths can benefit even more when large witness data is discounted

This project exists to make that shift legible.

---

## Key concepts represented

### Fee formation

The application reflects the Bitcoin transaction fee model:

```text
fee = total in - total out
```

Although the app estimates fees from feerate and virtual size for visualization purposes, the underlying economic point remains the same: the fee is the residual value not reassigned to outputs.

### Feerate market

Miners operate under block-space scarcity and generally select transactions based on fee density rather than nominal fee amount.

```text
feerate = sats / vbyte
```

### SegWit weight accounting

SegWit separates transaction data into:

- **base data**
  - version
  - locktime
  - input outpoints
  - output amounts
  - output scripts
  - other non-witness fields

- **witness data**
  - signatures
  - public keys
  - witness stack items
  - witness scripts

These are weighted differently:

- 1 base byte = 4 weight units
- 1 witness byte = 1 weight unit

This project visualizes that distinction directly.

---

## Technical approach

The application uses simplified transaction-size models for common spend categories in order to provide immediate interactive feedback. It is intended as a conceptual and educational model, not a production-grade transaction serializer.

Each spend format is represented with approximate per-input and per-output sizing assumptions. From those values, the app derives:

1. base byte count
2. witness byte count
3. total weight
4. virtual size
5. estimated fee at the selected feerate

It also compares the selected format against a legacy baseline to highlight the effect of witness discounting.

---

## Stack

- React
- Vite
- CSS

No external UI framework is required in the current implementation.

---

## Development

### Clone the repository

```bash
git clone <your-repo-url>
cd bitcoin-fee-segwit-visualizer
```

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

---

## Project structure

```text
bitcoin-fee-segwit-visualizer/
├── public/
├── src/
│   ├── App.jsx
│   ├── app.css
│   ├── main.jsx
│   └── ...
├── package.json
├── vite.config.js
└── README.md
```

---

## Design goals

This project is built around a few explicit goals:

- make Bitcoin fee mechanics interactive
- expose the distinction between base and witness data
- demonstrate why SegWit reduces effective cost for signature-heavy transactions
- keep the codebase small, readable, and easy to extend
- remain suitable for educational reuse and open-source contribution

---

## Limitations

This is not a wallet, mempool client, or transaction-construction library.

In particular, it does **not**:

- construct real transactions
- estimate fees from live mempool conditions
- model every script type or edge case precisely
- serialize Bitcoin transactions byte-for-byte
- replace wallet-level fee estimation or node-level policy evaluation

The size models used here are intentionally approximate and optimized for explanation.

---

## Possible extensions

Potential improvements include:

- exact serialization templates by script type
- multisig transaction examples
- Taproot key-path vs script-path breakdowns
- live mempool feerate integration
- UTXO selection visualizations
- script-type comparison tables
- mobile-first educational mode
- test coverage for sizing assumptions

---

## Contributing

Contributions are welcome.

Reasonable areas for contribution include:

- improving transaction-size modeling
- tightening terminology
- improving UI clarity
- adding new spend templates
- improving responsiveness and accessibility
- adding tests and documentation

A typical workflow:

```bash
git checkout -b feature/your-change
npm install
npm run dev
```

Then open a pull request with a clear description of the change and the reasoning behind it.

---

## Open-source status

This project is intended to be open-source and easy to inspect, modify, and reuse for Bitcoin education.

If you publish it publicly, add a license file to the repository.

### Recommended license

MIT is a good default for a small educational codebase:

```text
MIT License
```

---

## Disclaimer

This project is for technical education and visualization only.

Do not use it as a production fee calculator, wallet backend, or authoritative source for exact transaction serialization costs.

---

## Author

Built as an open-source educational Bitcoin project for visualizing transaction fee mechanics, SegWit weight accounting, and fee incentives across spend formats.
