import { defineManifest } from "@absolutejs/manifest";
import { Type } from "@sinclair/typebox";

export const manifest = defineManifest<
  Record<never, never>,
  Record<never, never>
>()({
  contract: 2,
  identity: {
    accent: "#d946ef",
    category: "gaming",
    description:
      "Deterministic collectible sets, subjects, supply-capped printings, shuffled serials, weighted traits, rarity explanations, and population reports.",
    docsUrl: "https://github.com/absolutejs/collectibles",
    name: "@absolutejs/collectibles",
    tagline: "Every copy has a place in the run.",
  },
  settings: Type.Object({}),
  slots: {},
  tools: {},
  wiring: [],
});
