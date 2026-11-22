import { confirm, input } from "@inquirer/prompts";
import ora from "ora";

import { CLORB_PREFIX } from "./constants";
import {
	bold,
	cloneOrb,
	deleteOrb,
	getCurrentOrbs,
	getDefaultOrbName,
	getOrbNameFromBranchName,
	italic,
	runOrb,
	success,
	warn,
} from "./utils";

export async function clorb(branchName: string, orbName: string): Promise<void> {
	const currentOrbs = await getCurrentOrbs();
	if (orbName) {
		if (!currentOrbs[orbName]) {
			throw new Error(`Orb '${orbName}' does not exist`);
		}
	}
	const source = orbName || (await getDefaultOrbName());

	const interactiveBranchName = branchName || (await askBranchName());
	const destination = await getOrbNameFromBranchName(branchName || interactiveBranchName);

	const currentOrb = currentOrbs[destination];
	if (currentOrb) {
		warn(`Orb ${bold(destination)} already exists`);
		console.log(`It is currently ${bold(currentOrb.state)}.`);
		console.log("");
		if (currentOrb.state !== "running") {
			await askToRunOrb(destination);
		}
	} else {
		success(`Orb '${destination}' does not exist and will be created`);
		console.log("");
		const spinner = ora(`Cloning ${bold(source)} to ${bold(destination)}`).start();
		await cloneOrb(source, destination);
		spinner.succeed(`Cloned ${bold(source)} to ${bold(destination)}`);
		await askToRunOrb(destination);
	}

	console.log(`To go into this orb, use:\n\n\t${bold(`orbctl run -m ${destination}`)}`);

	console.log("");
}

async function askToRunOrb(orbName: string): Promise<void> {
	if (await askBoolean(`Do you want to run the orb ${bold(orbName)} now?`)) {
		await runOrb(orbName);
	}
}

export async function askBoolean(message: string, defaultValue = true): Promise<boolean> {
	return await confirm({
		message,
		default: defaultValue,
	});
}

async function askBranchName(): Promise<string> {
	const branchName = await input({
		message: "Enter the git branch name:",
	});
	return branchName.trim();
}

export async function purge() {
	const spinner = ora(`Gathering information`).start();
	const orbs = await getCurrentOrbs();

	const clorbs = Object.keys(orbs).filter((name) => name.startsWith(CLORB_PREFIX));

	spinner.succeed(`Found ${clorbs.length} clorb${clorbs.length === 1 ? "" : "s"}`);
	if (clorbs.length === 0) {
		return;
	}
	const toDelete: string[] = [];
	for (const orb of clorbs) {
		if (orbs[orb]) {
			console.log(`${orb.padEnd(60)} ${orbs[orb].state}`);
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
}

export async function list() {
	const orbs = await getCurrentOrbs();
	const clorbs = Object.keys(orbs).filter((name) => name.startsWith(CLORB_PREFIX));
	if (clorbs.length === 0) {
		console.log("No clorbs found");
		return;
	}
	for (const orb of clorbs) {
		if (orbs[orb]) console.log(`${orb.padEnd(60)} ${orbs[orb].state}`);
	}
}
