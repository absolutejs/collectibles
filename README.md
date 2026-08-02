# @absolutejs/collectibles

Deterministic collectible primitives for sets, subjects, editions, individual copies,
weighted traits, transparent rarity, shuffled serials, and population reports.

The package separates four identities that collectible systems often blur:

- a **set** is a release;
- a **subject** is the recognizable thing collectors chase;
- a **printing** is one supply-capped edition of that subject;
- a **copy** is an individually owned serial from that printing.

Serial allocation uses a deterministic full permutation. Mint `1` does not automatically
receive serial `1`, but every serial from `1..supply` can occur exactly once. Applications
can preserve historical output by pinning their recipe version and permutation namespace.

The library contains no pet artwork, game tiers, or database assumptions. Those remain
application policy.

## Installation

```sh
bun add @absolutejs/collectibles
```

## Deterministic editions and traits

```ts
import {
  chooseWeightedEdition,
  generateWeightedTraits,
  printingId,
  shuffledSerial,
} from "@absolutejs/collectibles";

const editions = [
  { key: "standard", label: "Standard", supply: 900, weight: 90 },
  { key: "rare", label: "Rare", supply: 100, weight: 10 },
] as const;

const edition = chooseWeightedEdition("subject:42", editions);
const printing = printingId("set-1", "subject:42", edition);
const serial = shuffledSerial(
  printing,
  1,
  editions.find((row) => row.key === edition)!.supply,
);

const traits = generateWeightedTraits("subject:42", [
  {
    key: "background",
    options: [
      { value: "blue", weight: 80 },
      { value: "gold", weight: 20 },
    ],
  },
]);
```

The same seed, recipe version, and namespace always produce the same result. `populationReport()` explains issued, remaining, discovered, listed, and unavailable supply without requiring a particular marketplace or database.
