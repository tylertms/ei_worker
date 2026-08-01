import { spawnSync as spawn_sync } from "node:child_process";
import { createHash as create_hash } from "node:crypto";
import { mkdtemp, readFile as read_file, rm, writeFile as write_file } from "node:fs/promises";
import { createRequire as create_require } from "node:module";
import { tmpdir as temporary_directory } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath as file_url_to_path } from "node:url";

const require = create_require(import.meta.url);
const project_directory = join(dirname(file_url_to_path(import.meta.url)), "..");
const proto_directory = join(project_directory, "proto");
const source_path = join(proto_directory, "ei.proto");
const metadata_path = join(proto_directory, "version.json");
const target_path = join(project_directory, "ei_pb.cjs");

function sha256(content) {
	return create_hash("sha256").update(content).digest("hex");
}

async function verify_hash(content, expected_hash, label) {
	const actual_hash = sha256(content);
	if (actual_hash !== expected_hash) {
		throw new Error(
			`${label} SHA-256 mismatch: expected ${expected_hash}, received ${actual_hash}`,
		);
	}
}

async function generate_proto() {
	const metadata = JSON.parse(await read_file(metadata_path, "utf8"));
	const source = await read_file(source_path);
	await verify_hash(source, metadata.source_sha256, "Source proto");

	const output_directory = await mkdtemp(join(temporary_directory(), "ei_worker_proto_"));
	try {
		const protoc_script = require.resolve("protoc/protoc.cjs");
		const plugin_path = require("protoc-gen-js");
		const result = spawn_sync(
			process.execPath,
			[
				protoc_script,
				`--proto_path=${proto_directory}`,
				`--plugin=protoc-gen-js=${plugin_path}`,
				`--js_out=import_style=commonjs,binary:${output_directory}`,
				source_path,
			],
			{ stdio: "inherit" },
		);
		if (result.status !== 0) {
			throw new Error(`protoc exited with status ${result.status}`);
		}

		const generated = await read_file(join(output_directory, "ei_pb.js"));
		await verify_hash(generated, metadata.generated_sha256, "Generated bindings");
		if (process.argv.includes("--check")) {
			const existing = await read_file(target_path);
			if (!existing.equals(generated)) {
				throw new Error("Generated bindings are not current");
			}
		} else {
			await write_file(target_path, generated);
		}
	} finally {
		await rm(output_directory, { force: true, recursive: true });
	}
}

await generate_proto();
