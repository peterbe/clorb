import { homedir } from "node:os";
import { sep } from "node:path";

const MEMORY_FILE = "~/.clorbs.json";

export type Memory = {
	source: string;
	date: string;
	extra?: Record<string, string | number>;
};

export async function rememberClone(
	name: string,
	source: string,
	extra: Memory["extra"],
): Promise<void> {
	const memory = await getMemory();
	memory[name] = {
		source,
		date: new Date().toISOString(),
		extra,
	};
	await saveMemory(memory);
}

export async function forgetClone(name: string): Promise<void> {
	const memory = await getMemory();
	delete memory[name];
	await saveMemory(memory);
}

export async function getMemory(): Promise<Record<string, Memory>> {
	const file = Bun.file(expandPath(MEMORY_FILE));
	if (!(await file.exists())) {
		return {};
	}
	const content = await file.text();
	return JSON.parse(content);
}

async function saveMemory(memory: Record<string, Memory>): Promise<void> {
	const file = Bun.file(expandPath(MEMORY_FILE));
	await Bun.write(file, JSON.stringify(memory, null, 2));
}

function expandPath(path: string): string {
	const split = path.split(sep);
	return split
		.map((part) => {
			if (part === "~") {
				return homedir();
			}
			return part;
		})
		.join(sep);
}
