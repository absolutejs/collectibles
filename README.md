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
