import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { isReservedStatus } from "../puppyTypes";
import { InventorySnapshot, currentPriceCents, findBreedProfile, listBreedNames, toModelDetails, toModelSummary } from "./inventory";

// Read-only inventory lookups. None of them writes to the database, takes
// payments, reserves puppies or changes prices - those capabilities simply
// don't exist for the model. Cards and Text/Call buttons are requested with
// display tags in the reply instead (see display.ts).

type Tool = Anthropic.Beta.BetaTool;

const nullableString = { type: ["string", "null"] } as const;

export const ASSISTANT_TOOLS: Tool[] = [
  {
    name: "search_puppies",
    description:
      "Search the current puppy inventory on ThePuppyPlugs.com. Returns real listings with name, breed, gender, age, size, status, price and listing_url. 'matches' are puppies that can be pursued now. Sold puppies are excluded; On Hold and Sale Pending puppies are listed separately in 'not_available_now' and must never be recommended as available. Call with all filters null to see everything currently listed. Always use this before recommending or naming puppies, and before stating any price or availability.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        breed: { ...nullableString, description: "Breed name or part of it, e.g. 'poodle'. Null for any breed." },
        gender: {
          anyOf: [{ type: "string", enum: ["male", "female"] }, { type: "null" }],
          description: "Null for either.",
        },
        size: {
          anyOf: [{ type: "string", enum: ["teacup", "toy", "mini", "standard"] }, { type: "null" }],
          description: "Listing size category. Null for any.",
        },
        max_price_usd: { type: ["number", "null"], description: "Highest current price in US dollars. Null for no limit." },
      },
      required: ["breed", "gender", "size", "max_price_usd"],
    },
  },
  {
    name: "get_puppy_details",
    description:
      "Full details for one listed puppy (description, date of birth, color, vet check, vaccines, delivery availability, current status and price). Use for questions about a specific puppy, including the one the visitor is viewing.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        puppy: { type: "string", description: "The puppy_id, or the slug from its listing_url (e.g. 'mimi-toy-poodle')." },
      },
      required: ["puppy"],
    },
  },
  {
    name: "get_breed_info",
    description:
      "Approved breed profile: typical adult weight, personality, energy level, grooming needs, living space fit, companion style and good-to-know notes. Use to match a visitor's lifestyle to breeds. Returns the list of known breeds if there's no profile.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        breed: { type: "string", description: "Breed name, e.g. 'Toy Poodle' or 'Shih Tzu'." },
      },
      required: ["breed"],
    },
  },
];

export interface ToolOutcome {
  /** JSON text returned to the model. */
  result: string;
  isError: boolean;
}

function ok(result: unknown): ToolOutcome {
  return { result: JSON.stringify(result), isError: false };
}

function fail(message: string): ToolOutcome {
  return { result: JSON.stringify({ error: message }), isError: true };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const strOrNull = (v: unknown) => v === null || typeof v === "string";

/**
 * Validates and runs one tool call. Inputs are validated by hand: with
 * eager input streaming the SDK's tolerant parser can hand back a
 * truncated object, so nothing is trusted as-is.
 */
export async function runAssistantTool(name: string, input: unknown, inventory: InventorySnapshot): Promise<ToolOutcome> {
  if (!isObj(input)) return fail("Invalid input: expected an object.");

  switch (name) {
    case "search_puppies": {
      const { breed, gender, size, max_price_usd } = input;
      if (!strOrNull(breed) || !strOrNull(gender) || !strOrNull(size) || !(max_price_usd === null || typeof max_price_usd === "number")) {
        return fail("Invalid input for search_puppies.");
      }
      const breedQ = (breed as string | null)?.trim().toLowerCase() || "";
      const all = (await inventory.rows()).filter((r) => r.status !== "sold");
      const matches = all.filter((r) => {
        if (breedQ && !r.breed.toLowerCase().includes(breedQ) && !breedQ.includes(r.breed.toLowerCase())) return false;
        if (gender && r.gender !== gender) return false;
        if (size && r.size !== size) return false;
        if (typeof max_price_usd === "number") {
          const cents = currentPriceCents(r);
          if (cents === null || cents > max_price_usd * 100) return false;
        }
        return true;
      });
      // On Hold / Sale Pending puppies are listed but not available to buy, so
      // they're kept out of "matches" and reported separately.
      const availableMatches = matches.filter((r) => !isReservedStatus(r.status));
      const reservedMatches = matches.filter((r) => isReservedStatus(r.status));
      const breedsListed = Array.from(new Set(all.filter((r) => !isReservedStatus(r.status)).map((r) => r.breed))).sort();
      return ok({
        matches: availableMatches.slice(0, 12).map(toModelSummary),
        match_count: availableMatches.length,
        not_available_now: reservedMatches.map((r) => ({ name: r.name || r.breed, breed: r.breed, status: toModelSummary(r).status })),
        total_available: all.filter((r) => !isReservedStatus(r.status)).length,
        breeds_currently_available: breedsListed,
      });
    }

    case "get_puppy_details": {
      if (typeof input.puppy !== "string" || !input.puppy.trim()) return fail("Invalid input: puppy is required.");
      const row = await inventory.byIdOrSlug(input.puppy);
      if (!row) return ok({ found: false, note: "No listed puppy matches that id or slug. Use search_puppies." });
      return ok({ found: true, puppy: toModelDetails(row) });
    }

    case "get_breed_info": {
      if (typeof input.breed !== "string" || !input.breed.trim()) return fail("Invalid input: breed is required.");
      const b = await findBreedProfile(input.breed);
      if (!b) return ok({ found: false, known_breed_profiles: await listBreedNames() });
      return ok({
        found: true,
        breed: b.name,
        typical_adult_weight: b.expected_adult_size,
        overview: b.description,
        personality: b.personality,
        energy_level: b.energy_level,
        grooming: b.grooming_level,
        living_space_fit: b.living_space_fit,
        companion_style: b.companion_style,
        good_to_know: b.good_to_know,
      });
    }

    default:
      return fail(`Unknown tool: ${name}`);
  }
}
