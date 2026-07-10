import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { defaultSeedSkeleton, parseAtlasYaml } from "@loura/atlas-schema";

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input) {
    throw new Error("Usage: pnpm seed:validate <seed-file>");
  }

  const path = resolve(input);
  const seed = parseAtlasYaml(await readFile(path, "utf8"));

  if (input.endsWith("seed/atlas.yaml")) {
    const expectedDomains = defaultSeedSkeleton.domains.map(({ slug }) => slug);
    const actualDomains = seed.domains.map(({ slug }) => slug);
    if (JSON.stringify(actualDomains) !== JSON.stringify(expectedDomains)) {
      throw new Error(
        "seed/atlas.yaml does not match the approved ten-area skeleton",
      );
    }
  }

  console.log(
    `Valid atlas seed: ${seed.domains.length} domains, ${seed.concepts.length} concepts, ${seed.relationTypes.length} relation types, ${seed.relations.length} relations`,
  );
}

void main();
