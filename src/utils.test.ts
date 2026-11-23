import { describe, expect, test } from "bun:test";

import { CLORB_PREFIX } from "./constants";
import { getOrbNameFromName } from "./utils";

describe("utils", () => {
	test.each([
		["peterbe/foo", "peterbe-foo"],
		["contains.dots'and'apostropåes", "containsdotsandapostropes"],
		["Upper:LOWER", "upper-lower"],
		["spaces in the name", "spaces-in-the-name"],
	])("generate orb name from branch name %s", async (input, expected) => {
		const output = await getOrbNameFromName(input);
		expect(output).toBe(CLORB_PREFIX + expected);
	});
});
