import { input } from "@inquirer/prompts";

import { CLORB_PREFIX } from "./constants";

export function bold(text: string): string {
	return `\x1b[1m${text}\x1b[0m`;
}
export function italic(text: string): string {
	return `\x1b[3m${text}\x1b[0m`;
}
export function grey(text: string): string {
	return `\x1b[90m${text}\x1b[0m`;
}
export function green(text: string): string {
	return `\x1b[32m${text}\x1b[0m`;
}
export function red(text: string): string {
	return `\x1b[31m${text}\x1b[0m`;
}
export function yellow(text: string): string {
	return `\x1b[33m${text}\x1b[0m`;
}
export function error(...args: string[]) {
	console.error(...args.map((arg) => red(arg)));
}

export function warn(...args: string[]) {
	console.warn(...args.map((arg) => yellow(arg)));
}

export function success(text: string[] | string): void {
	console.log(green(typeof text === "string" ? text : text.join("\n")));
}
export function failure(text: string[] | string): void {
	console.error(red(typeof text === "string" ? text : text.join("\n")));
}

export async function runSshCommand(orbName: string, command: string): ReturnType<typeof run> {
	if (!orbName) throw new Error("Orb name is required");
	if (!command) throw new Error("Command is required");
	if (orbName.includes("@")) throw new Error("Orb name should not include '@orb'");
	if (orbName.includes(" ")) throw new Error("Orb name should not include spaces");

	return await run(["ssh", `${orbName}@orb`, command]);
}

type Orb = {
	id: string;
	name: string;
	image: {
		distro: string;
		version: string;
		arch: string;
		variant: string;
	};
	config: {
		isolated: boolean;
		forward_ssh_agent: boolean;
		isolate_network: boolean;
		default_username: string;
		http_port: number;
		https_port: number;
	};
	os_release: {
		name: string;
		version_id: string;
		pretty_name: string;
	};
	builtin: boolean;
	state: string;
};
export async function getCurrentOrbs(): Promise<Record<string, Orb>> {
	const { exitCode, stdout, stderr } = await run(["orbctl", "list", "-f", "json"]);
	if (exitCode !== 0) {
		throw new Error(`Failed to get current orbs: ${stderr}`);
	}
	const orbs: Orb[] = JSON.parse(stdout);
	const result: Record<string, Orb> = {};
	for (const orb of orbs) {
		result[orb.name] = orb;
	}
	return result;
}

async function run(cmd: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
	const proc = Bun.spawn(cmd, {
		stdout: "pipe",
		stderr: "pipe", // default is "inherit", so set this explicitly
	});

	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);

	return { exitCode, stdout, stderr };
}

export async function getDefaultOrbName(): Promise<string> {
	const { exitCode, stdout, stderr } = await run(["orbctl", "default"]);
	if (exitCode !== 0) {
		throw new Error(`Failed to get default orb name: ${stderr}`);
	}
	return stdout.trim();
}

export async function runOrb(orbName: string): Promise<void> {
	if (!orbName) throw new Error("Orb name is required");
	const { exitCode, stderr } = await run(["orbctl", "run", "-m", orbName]);
	if (exitCode !== 0) {
		throw new Error(`Failed to run orb: ${stderr}`);
	}
}

export async function deleteOrb(orbName: string): Promise<void> {
	const { exitCode, stderr } = await run(["orbctl", "delete", orbName]);
	if (exitCode !== 0) {
		throw new Error(`Failed to delete orb: ${stderr}`);
	}
}

export async function getOrbNameFromBranchName(
	branchName: string,
	prefix = CLORB_PREFIX,
	maxLength = 63,
): Promise<string> {
	if (!branchName) throw new Error("Branch name is required");
	const slug = branchName
		.trim()
		.replace(/\//g, "-")
		.replace(/\s+/g, "-")
		.replace(/:/g, "-")
		.replace(/_/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")
		.toLowerCase()
		.replace(/[^a-z0-9-_/]/g, "")
		.slice(0, maxLength - 6 - prefix.length - 2);
	return `${prefix}${slug}`; //--${hash}`;
}

export async function interactiveInput(message: string): Promise<string> {
	return await input({
		message,
		required: true,
	});
}

export async function cloneOrb(source: string, destination: string, debug = false): Promise<void> {
	console.log(["orbctl", "clone", source, destination].join(" "));
	const { exitCode, stdout, stderr } = await run(["orbctl", "clone", source, destination]);
	if (exitCode !== 0) {
		throw new Error(`Failed to clone orb: ${stderr}`);
	}
	if (debug) {
		console.log(stdout);
	}
}
