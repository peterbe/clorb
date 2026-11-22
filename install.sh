#!/usr/bin/env bash
#
# Installs the latest release of clorb from
# https://github.com/peterbe/clorb/releases into ~/bin/
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/peterbe/clorb/main/install.sh | bash

set -euo pipefail

REPO="peterbe/clorb"
INSTALL_DIR="$HOME/bin"
BINARY_NAME="clorb"

err() {
  echo "Error: $*" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || err "curl is required but not installed."

# --- Detect OS -------------------------------------------------------------
case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  MINGW* | MSYS* | CYGWIN*) os="windows" ;;
  *) err "Unsupported operating system: $(uname -s)" ;;
esac

# --- Detect architecture ---------------------------------------------------
case "$(uname -m)" in
  arm64 | aarch64) arch="arm64" ;;
  x86_64 | amd64) arch="x64" ;;
  *) err "Unsupported architecture: $(uname -m)" ;;
esac

# On Apple Silicon, a shell running under Rosetta reports x86_64.
# Prefer the native binary if the hardware supports arm64.
if [ "$os" = "darwin" ] && [ "$arch" = "x64" ]; then
  if [ "$(sysctl -n hw.optional.arm64 2>/dev/null || echo 0)" = "1" ]; then
    arch="arm64"
  fi
fi

asset="clorb-${os}-${arch}"
if [ "$os" = "windows" ]; then
  [ "$arch" = "x64" ] || err "Only x64 is supported on Windows."
  asset="${asset}.exe"
  BINARY_NAME="clorb.exe"
fi

# --- Find the latest version -----------------------------------------------
# GitHub redirects /releases/latest to /releases/tag/<version>.
latest_url=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/${REPO}/releases/latest") ||
  err "Could not determine the latest release."
version="${latest_url##*/}"
[ -n "$version" ] && [ "$version" != "latest" ] || err "Could not determine the latest release."

download_url="https://github.com/${REPO}/releases/download/${version}/${asset}"

echo "Installing clorb ${version} (${asset}) into ${INSTALL_DIR}"

# --- Download --------------------------------------------------------------
mkdir -p "$INSTALL_DIR"

tmp_file=$(mktemp)
trap 'rm -f "$tmp_file"' EXIT

curl -fSL --progress-bar "$download_url" -o "$tmp_file" ||
  err "Failed to download ${download_url}"

chmod 755 "$tmp_file"
mv "$tmp_file" "${INSTALL_DIR}/${BINARY_NAME}"

echo "Installed ${INSTALL_DIR}/${BINARY_NAME}"

# --- Make sure ~/bin is on the PATH ----------------------------------------
case ":${PATH}:" in
  *":${INSTALL_DIR}:"* | *":${INSTALL_DIR}/:"* | *":~/bin:"*)
    ;;
  *)
    case "$(basename "${SHELL:-}")" in
      zsh) rc_file="$HOME/.zshrc" ;;
      bash)
        if [ "$os" = "darwin" ]; then
          rc_file="$HOME/.bash_profile"
        else
          rc_file="$HOME/.bashrc"
        fi
        ;;
      fish) rc_file="$HOME/.config/fish/config.fish" ;;
      *) rc_file="$HOME/.profile" ;;
    esac

    if [ "$(basename "${SHELL:-}")" = "fish" ]; then
      path_line="fish_add_path \$HOME/bin"
    else
      path_line='export PATH="$HOME/bin:$PATH"'
    fi

    if [ -f "$rc_file" ] && grep -qF "$path_line" "$rc_file"; then
      :
    else
      mkdir -p "$(dirname "$rc_file")"
      {
        echo ""
        echo "# Added by the clorb installer"
        echo "$path_line"
      } >>"$rc_file"
      echo "Added ${INSTALL_DIR} to your PATH in ${rc_file}"
    fi

    echo ""
    echo "To start using clorb in this terminal, run:"
    echo ""
    echo "  source ${rc_file}"
    echo ""
    echo "(New terminal sessions will pick it up automatically.)"
    ;;
esac

echo ""
echo "Run 'clorb --help' to get started."
