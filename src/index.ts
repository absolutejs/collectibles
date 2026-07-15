export type SeededRng = () => number;

const xmur3 = (value: string) => {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
};

const sfc32 = (a: number, b: number, c: number, d: number) => () => {
  a |= 0; b |= 0; c |= 0; d |= 0;
  const result = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11); c = (c + result) | 0;
  return (result >>> 0) / 4_294_967_296;
};

export const createSeededRng = (seed: string): SeededRng => {
  const hash = xmur3(seed);
  const rng = sfc32(hash(), hash(), hash(), hash());
  for (let index = 0; index < 12; index++) rng();
  return rng;
};

export const seededIndex = (seed: string, count: number, namespace = "collectible-pick", attempt = 0) => {
  if (!Number.isSafeInteger(count) || count <= 0) return 0;
  return Math.floor(createSeededRng(`${namespace}:${seed}:${attempt}`)() * count);
};

export const stableToken = (value: string, length = 18) => {
  const hash = xmur3(value);
  return [hash(), hash(), hash()].map((number) => number.toString(36).padStart(7, "0")).join("").slice(0, length);
};

export type CollectibleSet = { id: string; name: string; recipeVersion: string; releasedAt?: string; subjectCount?: number };
export type CollectibleSubject = { id: string; setId: string; seed: string; name: string };
export type EditionDefinition<Key extends string = string> = { key: Key; label: string; supply: number; weight: number; tier?: string; metadata?: Record<string, unknown> };
export type CollectiblePrinting<Key extends string = string> = { id: string; subjectId: string; edition: Key; supply: number; issued: number; recipeVersion: string };
export type CollectibleCopy<Key extends string = string> = { id: string; printingId: string; edition: Key; serialNumber: number; supply: number; originalOwnerId?: string; currentOwnerId?: string };

export const printingId = (setId: string, subjectSeed: string, edition: string) => `${setId}:${stableToken(subjectSeed)}:${edition}`;

const gcd = (a: number, b: number) => { while (b) [a, b] = [b, a % b]; return Math.abs(a); };
export const serialPermutation = (printing: string, supply: number, namespace = "collectible-serial-permutation") => {
  if (!Number.isSafeInteger(supply) || supply < 1) throw new Error("supply must be a positive integer");
  if (supply === 1) return { offset: 0, step: 1 };
  const rng = createSeededRng(`${namespace}:${printing}`);
  const offset = Math.floor(rng() * supply);
  let step = Math.max(1, Math.floor(rng() * supply));
  while (gcd(step, supply) !== 1) step = step >= supply - 1 ? 1 : step + 1;
  return { offset, step };
};

export const shuffledSerial = (printing: string, mintNumber: number, supply: number, namespace = "collectible-serial-permutation") => {
  if (!Number.isSafeInteger(mintNumber) || mintNumber < 1 || mintNumber > supply) throw new Error("mint number outside edition supply");
  const { offset, step } = serialPermutation(printing, supply, namespace);
  return ((offset + (mintNumber - 1) * step) % supply) + 1;
};

export const editionProbability = (edition: EditionDefinition, catalog: readonly EditionDefinition[]) => {
  const total = catalog.reduce((sum, row) => sum + row.weight, 0);
  if (!(total > 0) || !(edition.weight > 0)) throw new Error("edition weights must be positive");
  return edition.weight / total;
};

export const chooseWeightedEdition = <Key extends string>(seed: string, catalog: readonly EditionDefinition<Key>[], namespace = "collectible-edition", attempt = 0): Key => {
  if (!catalog.length) throw new Error("edition catalog cannot be empty");
  const total = catalog.reduce((sum, row) => sum + row.weight, 0);
  if (!(total > 0) || catalog.some((row) => !Number.isSafeInteger(row.supply) || row.supply < 1 || !(row.weight > 0))) throw new Error("invalid edition catalog");
  let roll = createSeededRng(`${namespace}:${seed}:${attempt}`)() * total;
  for (const edition of catalog) { roll -= edition.weight; if (roll < 0) return edition.key; }
  return catalog[catalog.length - 1]!.key;
};

export type WeightedTraitOption<Value extends string = string> = { value: Value; weight: number };
export type TraitDefinition<Value extends string = string> = { key: string; options: readonly WeightedTraitOption<Value>[] };
export type RarityComponent = { group: string; label: string; value: string; probability: number; score: number };

export const informationScore = (probability: number) => {
  if (!(probability > 0 && probability <= 1)) throw new Error("probability must be greater than zero and at most one");
  return +(-Math.log2(probability)).toFixed(2);
};

export const drawWeightedTrait = <Value extends string>(rng: SeededRng, definition: TraitDefinition<Value>) => {
  const total = definition.options.reduce((sum, option) => sum + option.weight, 0);
  if (!(total > 0)) throw new Error(`trait ${definition.key} has no positive weight`);
  let roll = rng() * total;
  for (const option of definition.options) {
    if (!(option.weight > 0)) throw new Error(`trait ${definition.key} contains a non-positive weight`);
    roll -= option.weight;
    if (roll <= 0) return { value: option.value, probability: option.weight / total, score: informationScore(option.weight / total) };
  }
  const fallback = definition.options.at(-1); if (!fallback) throw new Error(`trait ${definition.key} has no options`);
  return { value: fallback.value, probability: fallback.weight / total, score: informationScore(fallback.weight / total) };
};

export const generateWeightedTraits = (seed: string, definitions: readonly TraitDefinition[], namespace = "collectible-traits") => {
  const rng = createSeededRng(`${namespace}:${seed}`); const traits: Record<string, string> = {}; const breakdown: RarityComponent[] = [];
  for (const definition of definitions) {
    const result = drawWeightedTrait(rng, definition); traits[definition.key] = result.value;
    breakdown.push({ group: "Trait", label: definition.key, value: result.value, probability: result.probability, score: result.score });
  }
  return { traits, breakdown, score: +breakdown.reduce((sum, row) => sum + row.score, 0).toFixed(2) };
};

export type PopulationInput = { supply: number; issued: number; discovered?: number; publiclyOwned?: number; listed?: number; unavailable?: number };
export const populationReport = (input: PopulationInput) => {
  for (const [label, value] of Object.entries(input)) if (value != null && (!Number.isSafeInteger(value) || value < 0)) throw new Error(`${label} must be a non-negative integer`);
  if (input.supply < 1 || input.issued > input.supply) throw new Error("population exceeds edition supply");
  const discovered = input.discovered ?? input.issued;
  if (discovered > input.issued) throw new Error("discovered population exceeds issued population");
  return {
    supply: input.supply, issued: input.issued, remaining: input.supply - input.issued,
    discovered, undiscoveredIssued: input.issued - discovered, publiclyOwned: input.publiclyOwned ?? 0,
    listed: input.listed ?? 0, unavailable: input.unavailable ?? 0,
    issuedPercent: +(input.issued / input.supply * 100).toFixed(6),
  };
};
