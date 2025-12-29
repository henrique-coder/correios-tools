default:
    @just --list

lint:
    npx prettier --check .

format:
    npx prettier --write .
