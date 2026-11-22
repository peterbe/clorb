dev:
    echo "This will constantly build and copy executable to ./out/clorb"
    bun run build:watch

build:
    bun run build

ship: build linux-build

linux-build:
    bun build src/index.ts --target=bun --outfile ./out/clorb-linux-x64-modern --compile --minify --sourcemap --bytecode --target=bun-linux-x64-modern
    bun build src/index.ts --target=bun --outfile ./out/clorb-linux-arm64 --compile --minify --sourcemap --bytecode --target=bun-linux-arm64

check:
    bun check

lint: check
    bun run format

format: lint

install:
    bun install

outdated:
    bun outdated

test:
    bun test

test-watch:
    bun test --watch

release:
    bun run release

upgrade:
    bun update --interactive --minimum-release-age=86400 && bun install

