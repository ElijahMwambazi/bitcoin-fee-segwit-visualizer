# How Bitcoin Transaction Fees Are Determined and How SegWit Changes Fee Incentives

## Overview

A Bitcoin transaction fee is not stored in a special field inside the transaction. Instead, the fee is determined implicitly by the difference between the total value of the inputs and the total value of the outputs.

```text
fee = total input value - total output value
```

This is the starting point for understanding fees. But in practice, miners do not mainly care about the absolute fee. They care about how much fee a transaction pays relative to the block space it consumes.

That is where transaction size, weight, and SegWit matter.

---

## 1. How fees are determined

A Bitcoin transaction spends existing outputs, called UTXOs, as inputs, and creates new outputs.

Whatever value is not assigned to new outputs becomes the fee.

### Formula

```text
fee = sum(inputs) - sum(outputs)
```

### Example

```text
Inputs:
  0.00300000 BTC
+ 0.00200000 BTC
----------------
= 0.00500000 BTC

Outputs:
  recipient = 0.00450000 BTC
  change    = 0.00040000 BTC
-----------------------------
total out   = 0.00490000 BTC

Fee:
  0.00500000 - 0.00490000 = 0.00010000 BTC
```

So the fee is simply the leftover value.

There is no field that says “fee = X”. Full nodes and miners infer it by comparing the total input value to the total output value.

---

## 2. Why fee rate matters more than total fee

Block space is scarce. Miners usually choose transactions based on **fee rate**, not just total fee paid.

### Fee rate

```text
feerate = fee / transaction size
```

Today this is usually expressed in:

```text
satoshis per virtual byte (sat/vB)
```

### Example

```text
Tx A:
  fee     = 10,000 sats
  size    = 500 vB
  feerate = 20 sat/vB

Tx B:
  fee     = 6,000 sats
  size    = 100 vB
  feerate = 60 sat/vB
```

Even though Tx A pays a higher total fee, Tx B is usually more attractive to miners because it pays more per unit of block space.

So in practice:

- total fee tells you how much you pay
- fee rate tells you how competitive your transaction is

---

## 3. What makes a transaction large

The fee rate depends on transaction size, so it matters which parts of a transaction take up space.

A simplified transaction looks like this:

```text
transaction
├── version
├── inputs
│   ├── previous txid
│   ├── output index
│   ├── unlocking/authentication data
│   └── sequence
├── outputs
│   ├── amount
│   └── locking script
└── locktime
```

In general:

- more **inputs** usually increase size the most
- more **outputs** also increase size
- more complex scripts increase size further

Inputs are often the most expensive part because each input must include the data needed to prove that the spender is authorized to spend the referenced UTXO.

That proof usually includes signatures, public keys, or script data.

This is why spending many small UTXOs tends to cost more than spending one large UTXO.

---

## 4. Before SegWit: all bytes were priced the same

Before SegWit, every byte in the serialized transaction was treated equally for fee purposes.

That meant:

```text
1 byte of signature data = 1 byte of any other transaction data
```

So signatures, public keys, input references, outputs, and scripts all competed on equal terms in the fee calculation.

This made signature-heavy transactions especially expensive.

---

## 5. SegWit introduced weight

SegWit changed how transaction size is accounted for.

Instead of treating all bytes equally, Bitcoin now uses **weight units**.

### Weight formula

```text
weight = (base bytes × 4) + witness bytes
```

And from weight, wallets derive virtual size:

```text
vbytes = weight / 4
```

This means:

- 1 base byte costs 4 weight units
- 1 witness byte costs 1 weight unit

So witness data is effectively discounted relative to base data.

---

## 6. Base data vs witness data

SegWit splits transaction data into two broad categories.

### Base data

Base data includes the structural parts of the transaction, such as:

- version
- locktime
- previous output references
- output amounts
- output scripts
- sequence values
- other non-witness fields

These bytes are expensive in weight terms:

```text
base byte = 4 weight units
```

### Witness data

Witness data contains the spend authorization material, such as:

- signatures
- public keys
- witness stack items
- witness scripts

These bytes are cheaper in weight terms:

```text
witness byte = 1 weight unit
```

---

## 7. How SegWit changes fee incentives

This is the core economic change.

Before SegWit:

```text
all bytes cost the same
```

After SegWit:

```text
base bytes are more expensive
witness bytes are discounted
```

So SegWit changes the incentives for different parts of a transaction.

### More expensive parts

The transaction “skeleton” remains relatively expensive:

- input outpoints
- output definitions
- output amounts
- scriptPubKeys
- locktime
- version
- other non-witness structure

### Cheaper parts

The authentication material becomes cheaper:

- signatures
- public keys
- witness scripts
- witness stack data

This means SegWit does not make everything cheaper equally. It mainly lowers the effective cost of proving authorization to spend.

---

## 8. Why this matters in practice

The fee incentive changes have important consequences.

### Legacy spends

In legacy transactions, signatures remain in the main serialized body.

That means they pay full price.

### SegWit spends

In SegWit transactions, signatures and related spend data are moved into witness space.

That means they receive the witness discount.

### Result

For the same economic action, a SegWit transaction often has a lower virtual size than a legacy one.

This allows the sender to:

- pay a lower total fee for the same priority
- or get better priority for the same total fee

---

## 9. Who benefits the most from SegWit

SegWit is especially helpful when a transaction contains a lot of authentication data.

That usually means:

- transactions with many inputs
- multisig transactions
- script-heavy spending conditions
- transactions where signatures dominate size

Why? Because witness data is exactly the part that receives the discount.

So SegWit especially improves fee efficiency for transactions whose size is driven by signatures and witness material.

---

## 10. Intuition in one sentence

SegWit changes the fee model from:

```text
all bytes are priced equally
```

to:

```text
transaction structure is expensive
authentication data is cheaper
```

That is the main fee-incentive shift.

---

## 11. Short summary

- A Bitcoin fee is the difference between total input value and total output value.
- Miners usually prioritize transactions by fee rate, not absolute fee.
- Transaction size depends heavily on the number of inputs and the amount of spend authorization data.
- Before SegWit, all bytes were charged equally.
- SegWit introduced weight and virtual size.
- Base data costs 4 weight units per byte.
- Witness data costs 1 weight unit per byte.
- So SegWit discounts signatures and other witness material.
- This makes SegWit transactions more fee-efficient, especially when they are signature-heavy.

---

## 12. Key formulas

```text
fee = sum(inputs) - sum(outputs)
```

```text
feerate = sats / vbyte
```

```text
weight = (base bytes × 4) + witness bytes
```

```text
vbytes = weight / 4
```
