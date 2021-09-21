import type { Player, PlayerWithoutKey } from "../../../common/types";
import { idb } from "../../db";
import range from "lodash-es/range";
import { random, helpers } from "../../util";

const VALID_JERSEY_NUMBERS = range(1, 100).map(i => String(i));

// Basketball also gets 0 and 00
VALID_JERSEY_NUMBERS.push("0", "00");

const weightFunction = (jerseyNumber: string) => {
	// https://old.reddit.com/r/nba/comments/4sxoi0/the_mostleast_worn_jersey_numbers/
	const frequencies: Record<string, number> = {
		"00": 29,
		0: 68,
		1: 199,
		2: 176,
		3: 283,
		4: 263,
		5: 298,
		6: 210,
		7: 284,
		8: 224,
		9: 233,
		10: 279,
		11: 341,
		12: 380,
		13: 173,
		14: 301,
		15: 304,
		16: 108,
		17: 145,
		18: 120,
		19: 87,
		20: 305,
		21: 274,
		22: 282,
		23: 214,
		24: 240,
		25: 201,
		26: 45,
		27: 48,
		28: 32,
		29: 26,
		30: 205,
		31: 168,
		32: 209,
		33: 224,
		34: 210,
		35: 166,
		36: 17,
		37: 4,
		38: 8,
		39: 4,
		40: 162,
		41: 100,
		42: 158,
		43: 99,
		44: 209,
		45: 106,
		46: 4,
		47: 5,
		48: 2,
		49: 2,
		50: 114,
		51: 39,
		52: 80,
		53: 29,
		54: 81,
		55: 90,
		56: 3,
		57: 1,
		58: 0,
		59: 0,
		60: 2,
		61: 2,
		62: 2,
		63: 1,
		64: 0,
		65: 1,
		66: 3,
		67: 1,
		68: 1,
		69: 0,
		70: 7,
		71: 3,
		72: 1,
		73: 1,
		74: 0,
		75: 0,
		76: 0,
		77: 10,
		78: 0,
		79: 0,
		80: 0,
		81: 0,
		82: 0,
		83: 1,
		84: 1,
		85: 1,
		86: 2,
		87: 0,
		88: 5,
		89: 2,
		90: 2,
		91: 2,
		92: 2,
		93: 2,
		94: 1,
		95: 0,
		96: 2,
		97: 0,
		98: 3,
		99: 6,
	};

	const frequency = frequencies[jerseyNumber];

	if (frequency === undefined || frequency === 0) {
		// Never have 0 probability
		return 0.25;
	}

	return frequency;
};

const genJerseyNumber = async (
	p: Player | PlayerWithoutKey,

	// When this is undefined, it'll read from the database to find what it should be. But that won't work during league creation.
	teamJerseyNumbersInput?: string[],
	retiredJerseyNumbersInput?: string[],
): Promise<string | undefined> => {
	const prevJerseyNumber = helpers.getJerseyNumber(p);

	if (p.tid < 0) {
		return prevJerseyNumber;
	}

	const teamJerseyNumbers: string[] = teamJerseyNumbersInput
		? teamJerseyNumbersInput
		: [];
	if (!teamJerseyNumbersInput) {
		const teammates = (
			await idb.cache.players.indexGetAll("playersByTid", p.tid)
		).filter(p2 => p2.pid !== p.pid);
		for (const teammate of teammates) {
			if (teammate.stats.length > 0) {
				const teamJerseyNumber = teammate.stats.at(-1).jerseyNumber;
				if (teamJerseyNumber) {
					teamJerseyNumbers.push(teamJerseyNumber);
				}
			}
		}
	}

	const retiredJerseyNumbers: string[] = retiredJerseyNumbersInput
		? retiredJerseyNumbersInput
		: [];
	if (!retiredJerseyNumbersInput) {
		const t = await idb.cache.teams.get(p.tid);
		if (t && t.retiredJerseyNumbers) {
			retiredJerseyNumbers.push(
				...t.retiredJerseyNumbers.map(row => row.number),
			);
		}
	}

	const candidates = VALID_JERSEY_NUMBERS.filter(
		jerseyNumber =>
			!teamJerseyNumbers.includes(jerseyNumber) &&
			!retiredJerseyNumbers.includes(jerseyNumber),
	);
	if (candidates.length === 0) {
		// No valid jersey number left!
		return;
	}

	if (prevJerseyNumber && candidates.includes(prevJerseyNumber)) {
		// Keep old jersey number, if possible
		return prevJerseyNumber;
	}

	return random.choice(candidates, weightFunction);
};

export default genJerseyNumber;
