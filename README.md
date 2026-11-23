# clorb

<p align="center">
  <img src="docs/clorb-logo.png" alt="clorb logo" width="300">
</p>

Clone orbs smartly by git branches

Example use:

```text
➜ clorb my-cool-branch
```

This will clone the current **default orb** and create a new one
called `clorb--my-cool-branch`. Now, you can enter that orb by typing:

```text
orbctl run -m clorb--my-cool-branch
```

If you don't want it to clone from the **default** orb, you can pass a
second argument, which orb to clone from. For example:

```text
➜ clorb some-other-branch clorb--my-cool-branch
```

## Install

Run this in a terminal:

```sh
curl -fsSL https://raw.githubusercontent.com/peterbe/clorb/main/install.sh | bash
```

The [`install.sh`](install.sh) script:

1. Figures out your operating system and CPU architecture (e.g. macOS on
   Apple Silicon → `clorb-darwin-arm64`, Linux on Intel/AMD → `clorb-linux-x64`).
2. Looks up the latest version on
   [GitHub releases](https://github.com/peterbe/clorb/releases).
3. Downloads the matching binary to `~/bin/clorb` and makes it executable,
   creating `~/bin/` if it doesn't already exist.
4. If `~/bin` isn't already on your `$PATH`, appends
   `export PATH="$HOME/bin:$PATH"` to your shell config (`~/.zshrc`,
   `~/.bashrc`/`~/.bash_profile`, or `~/.profile`).

New terminals will find `clorb` automatically. In the terminal where you ran
the installer, run the `source ...` command it prints (or just open a new
terminal).

To upgrade, run the same command again. To uninstall, delete `~/bin/clorb`.

If you'd rather read the script before running it:

```sh
curl -fsSL https://raw.githubusercontent.com/peterbe/clorb/main/install.sh -o install.sh
less install.sh
bash install.sh
```

## Other commands

### Purge all Orbs created with clorb

```text
➜ clorb _purge
```

### List all Orbs created with clorb

```text
➜ clorb _list
```

## Dev

```sh
just install
just dev
```

and then run, in another terminal:

```sh
./out/clorb --help
```

### Writing tests

At the moment, there aren't many tests. You run the tests with:

```sh
just test
```

And to run the unit tests continuously as you save changes use:

```sh
just test-watch
```

Code formatting should be automatic with a git pre-commit hook. But you
can also run:

```sh
just format
```
