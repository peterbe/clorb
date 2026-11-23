import { chmod, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import { confirm } from "@inquirer/prompts";
import kleur from "kleur";
import ora from "ora";

import { version } from "../package.json";

const REPO = "peterbe/clorb";

export async function upgrade(): Promise<void> {
	console.log(kleur.green(`You have version ${kleur.bold(version)} installed.`));

	const latest = await getLatestVersion();
	if (normalizeVersion(latest) === normalizeVersion(version)) {
		console.log(kleur.green("You already have the latest version."));
		return;
	}
	console.log(`Latest available version is ${kleur.bold(latest)}.`);

	const target = process.execPath;
	if (basename(target).toLowerCase().startsWith("bun")) {
		throw new Error(
			`Not running as a compiled clorb binary (${target}). ` +
				`Upgrade with the install script instead.`,
		);
	}

	const asset = getAssetName();
	const downloadUrl = `https://github.com/${REPO}/releases/download/${latest}/${asset}`;

	// Download next to the current binary so the final rename is atomic
	// (and doesn't cross filesystem boundaries).
	const tmpFile = join(dirname(target), `.${basename(target)}.${latest}.download`);

	const spinner = ora(`Downloading ${kleur.bold(asset)} (${latest})`).start();
	try {
		const response = await fetch(downloadUrl);
		if (!response.ok) {
			throw new Error(
				`Failed to download ${downloadUrl} (${response.status} ${response.statusText})`,
			);
		}
		const bytes = await Bun.write(tmpFile, response);
		await chmod(tmpFile, 0o755);
		spinner.succeed(`Downloaded ${asset} (${formatBytes(bytes)})`);
	} catch (err) {
		spinner.fail("Download failed");
		await rm(tmpFile, { force: true });
		throw err;
	}

	let replace = false;
	try {
		replace = await confirm({
			message: `Replace ${target} (${version}) with ${latest}?`,
			default: true,
		});
	} finally {
		if (!replace) await rm(tmpFile, { force: true });
	}
	if (!replace) {
		console.log("Upgrade cancelled.");
		return;
	}

	try {
		if (process.platform === "win32") {
			// A running .exe can't be overwritten on Windows, but it can be renamed.
			const old = `${target}.old`;
			await rm(old, { force: true });
			await rename(target, old);
		}
		await rename(tmpFile, target);
	} catch (err) {
		await rm(tmpFile, { force: true });
		throw err;
	}

	console.log(kleur.green(`Upgraded clorb to ${kleur.bold(latest)} 🎉`));
}

async function getLatestVersion(): Promise<string> {
	// GitHub redirects /releases/latest to /releases/tag/<version>.
	const response = await fetch(`https://github.com/${REPO}/releases/latest`, {
		method: "HEAD",
		redirect: "follow",
	});
	if (!response.ok) {
		throw new Error(
			`Could not determine the latest release (${response.status} ${response.statusText})`,
		);
	}
	const latest = new URL(response.url).pathname.split("/").pop();
	if (!latest || latest === "latest") {
		throw new Error("Could not determine the latest release.");
	}
	return decodeURIComponent(latest);
}

function getAssetName(): string {
	let os: string;
	switch (process.platform) {
		case "darwin":
			os = "darwin";
			break;
		case "linux":
			os = "linux";
			break;
		case "win32":
			os = "windows";
			break;
		default:
			throw new Error(`Unsupported operating system: ${process.platform}`);
	}

	let arch: string;
	switch (process.arch) {
		case "arm64":
			arch = "arm64";
			break;
		case "x64":
			arch = "x64";
			break;
		default:
			throw new Error(`Unsupported architecture: ${process.arch}`);
	}

	// On Apple Silicon, an x64 binary running under Rosetta reports x64.
	// Prefer the native binary if the hardware supports arm64.
	if (os === "darwin" && arch === "x64") {
		const result = Bun.spawnSync(["sysctl", "-n", "hw.optional.arm64"]);
		if (result.stdout.toString().trim() === "1") arch = "arm64";
	}

	if (os === "windows") {
		if (arch !== "x64") throw new Error("Only x64 is supported on Windows.");
		return `clorb-${os}-${arch}.exe`;
	}
	return `clorb-${os}-${arch}`;
}

function normalizeVersion(v: string): string {
	return v.trim().replace(/^v/i, "");
}

function formatBytes(bytes: number): string {
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
