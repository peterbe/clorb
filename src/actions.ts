import { confirm, input } from "@inquirer/prompts";
import { formatDistance } from "date-fns";
import ora from "ora";

import { CLORB_PREFIX } from "./constants";
import { getMemory, rememberClone } from "./memory";
import {
	bold,
	cloneOrb,
	deleteOrb,
	getCurrentOrbs,
	getDefaultOrbName,
	getOrbNameFromName,
	green,
	grey,
	italic,
	runOrb,
	warn,
} from "./utils";

export async function clorb(name?: string, orbName?: string): Promise<void> {
	if (name?.startsWith("_")) {
		throw new Error(`Names starting with '_' are reserved`);
	}
	const currentOrbs = await getCurrentOrbs();
	if (orbName) {
		if (!currentOrbs[orbName]) {
			throw new Error(`Orb '${orbName}' does not exist`);
		}
	}
	const source = orbName || (await getDefaultOrbName());

	const interactiveName = name || (await askName());
	const destination = await getOrbNameFromName(name || interactiveName);

	const currentOrb = currentOrbs[destination];
	if (currentOrb) {
		warn(`Orb ${bold(destination)} already exists`);
		console.log(`It is currently ${bold(currentOrb.state)}.`);
		console.log("");
		if (currentOrb.state !== "running") {
			await askToRunOrb(destination);
		}
	} else {
		console.log(green(`Orb ${bold(destination)} does not exist and will be created.`));
		console.log("");
		const spinner = ora(`Cloning ${bold(source)} to ${bold(destination)}`).start();
		await cloneOrb(source, destination);
		await rememberClone(destination, source);
		spinner.succeed(`Cloned ${bold(source)} to ${bold(destination)}`);
		await askToRunOrb(destination);
	}

	console.log(`To go into this orb, use:\n\n\t${bold(`orbctl run -m ${destination}`)}`);

	console.log("");
}

async function askToRunOrb(orbName: string): Promise<void> {
	if (await askBoolean(`Do you want to run the orb ${italic(orbName)} now?`)) {
		await runOrb(orbName);
	}
}

export async function askBoolean(message: string, defaultValue = true): Promise<boolean> {
	return await confirm({
		message,
		default: defaultValue,
	});
}

async function askName(): Promise<string> {
	const name = await input({
		message: "Enter the name:",
	});
	if (name.trim().startsWith("_")) {
		throw new Error(`Names starting with '_' are reserved`);
	}
	return name.trim();
}

export async function purge() {
	const spinner = ora(`Gathering information`).start();
	const orbs = await getCurrentOrbs();

	const clorbs = Object.keys(orbs).filter((name) => name.startsWith(CLORB_PREFIX));

	spinner.succeed(`Found ${clorbs.length} clorb${clorbs.length === 1 ? "" : "s"}`);
	if (clorbs.length === 0) {
		return;
	}
	const memory = await getMemory();
	const toDelete: string[] = [];
	for (const orb of clorbs) {
		if (orbs[orb]) {
			const metadata = memory[orb];
			let created = "";
			if (metadata) {
				const date = new Date(metadata.date);
				created = `created ${formatDistance(date, new Date())}`;
			}
			console.log(`${orb.padEnd(50)} ${orbs[orb].state.padEnd(10)} ${grey(created)}`);
			if (await askBoolean(`Do you want to delete the orb ${italic(orb)}?`)) {
				toDelete.push(orb);
			}
		}
	}
	const spinner2 = ora(
		`Deleting ${toDelete.length} orb${toDelete.length === 1 ? "" : "s"}`,
	).start();
	for (const orb of toDelete) {
		await deleteOrb(orb);
	}
	spinner2.succeed(`Deleted ${toDelete.length} orb${toDelete.length === 1 ? "" : "s"}`);
	console.log("");
}

export async function list() {
	const orbs = await getCurrentOrbs();
	const memory = await getMemory();
	const clorbs = Object.keys(orbs).filter((name) => name.startsWith(CLORB_PREFIX));
	if (clorbs.length === 0) {
		console.log("No clorbs found");
		return;
	}
	for (const orb of clorbs) {
		if (orbs[orb]) {
			const state = orbs[orb].state;
			const metadata = memory[orb];
			let created = "";
			if (metadata) {
				const date = new Date(metadata.date);
				created = `created ${formatDistance(date, new Date())}`;
			}
			console.log(`${orb.padEnd(50)} ${state.padEnd(10)} ${grey(created)}`);
		}
	}
}
