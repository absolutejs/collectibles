import { describe, expect, test } from "bun:test";
import { chooseWeightedEdition, createSeededRng, generateWeightedTraits, populationReport, printingId, serialPermutation, shuffledSerial, stableToken } from "../src/index";

describe("deterministic collectible identity", () => {
  test("preserves stable seed compatibility", () => {
    expect(createSeededRng("compat")()).toBe(0.13951935176737607);
    expect(stableToken("genesis")).toBe("1wcecwx01s04ce0jli");
    expect(printingId("genesis-2026", "card-subject:genesis-2026:00", "base")).toBe("genesis-2026:12iz96a1buc06m19i7:base");
  });
  test("shuffles every serial exactly once", () => {
    const printing = "genesis-2026:compat:base";
    expect(serialPermutation(printing, 1000, "card-serial-permutation")).toEqual({ offset: 668, step: 569 });
    expect([1, 2, 3, 1000].map((mint) => shuffledSerial(printing, mint, 1000, "card-serial-permutation"))).toEqual([669, 238, 807, 100]);
    expect(new Set(Array.from({ length: 1000 }, (_, index) => shuffledSerial(printing, index + 1, 1000, "card-serial-permutation"))).size).toBe(1000);
  });
  test("selects weighted editions deterministically", () => {
    const catalog = [{ key: "base", label: "Base", supply: 1000, weight: 90 }, { key: "gold", label: "Gold", supply: 10, weight: 10 }] as const;
    expect(chooseWeightedEdition("one", catalog)).toBe(chooseWeightedEdition("one", catalog));
  });
  test("explains weighted trait rarity", () => {
    const result = generateWeightedTraits("copy:1", [{ key: "material", options: [{ value: "Paper", weight: 99 }, { value: "Gold", weight: 1 }] }]);
    expect(result.breakdown).toHaveLength(1); expect(result.score).toBeGreaterThan(0); expect(result.traits.material).toBeTruthy();
  });
  test("reports known and remaining population", () => {
    expect(populationReport({ supply: 500, issued: 34, discovered: 30, publiclyOwned: 20, listed: 2 })).toEqual({ supply: 500, issued: 34, remaining: 466, discovered: 30, undiscoveredIssued: 4, publiclyOwned: 20, listed: 2, unavailable: 0, issuedPercent: 6.8 });
  });
});
