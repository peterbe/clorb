#!/usr/bin/env bun

import { Command } from "commander";

import { version } from "../package.json";
import { clorb, list, purge } from "./actions";
import { upgrade } from "./upgrade";
import { error } from "./utils";

const program = new Command();

program
	.name("clorb")
	.description("Clone Orbstack VMs by git branches")
	.version(version)
	.option("--debug", "Debug mode (shows traceback)")
	.argument("[gitbranchname]", "name of the git branch (e.g. peterbe/foo-bar)")
	.argument("[orbname]", "name of the orb to clone from (defaults to your default orb)")
	.action(async (branchName: string, orbName: string, options: { debug: boolean }) => {
		wrap(clorb(branchName, orbName), options.debug);
	});

program
	.command("_purge")
	.description("Interactively purge all Orbstack VMs created with clorb")
	.option("--debug", "Debug mode (shows traceback)")
	.action(async (options: { debug: boolean }) => {
		wrap(purge(), options.debug);
	});

program
	.command("_list")
	.description("List all Orbstack VMs created with clorb")
	.option("--debug", "Debug mode (shows traceback)")
	.action(async (options: { debug: boolean }) => {
		wrap(list(), options.debug);
	});

program
	.command("_upgrade")
	.description("Install the latest version of clorb")
	.option("--debug", "Debug mode (shows traceback)")
	.action(async (options: { debug: boolean }) => {
		wrap(upgrade(), options.debug);
	});

program.parse();

function wrap(promise: Promise<void>, debug: boolean) {
	promise
		.then(() => {
			process.exit(0);
		})
		.catch((err) => {
			if (err instanceof Error && err.name === "ExitPromptError") {
				// Ctrl-C
				process.exit(0);
			}

			if (debug) {
				throw err;
			}
			error(err.message);
			process.exit(1);
		});
}
