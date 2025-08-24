import { watch } from 'chokidar';
import SFTP from 'ssh2-sftp-client';
import { packageDirectory as pkgDir } from 'pkg-dir';
import { dirname, join, relative } from 'path/posix';
import anymatch from 'anymatch';
import { helpers } from '@apertia/extension-build-tools';
import { log } from '@clack/prompts';
import cpy from 'cpy';
import { env } from '../util/env.js';
import { metadata } from '../util/metadata.js';
import { tsContext } from '@apertia/extension-build-tools/dist/contexts/ts.js';
import { lessContexts } from '@apertia/extension-build-tools/dist/contexts/less.js';
import { cssContext } from '@apertia/extension-build-tools/dist/contexts/css.js';
import { platform } from 'os';
import slash from 'slash';
import { readFile } from 'fs/promises';
import { globby } from 'globby';

const ROOT_DIR = await pkgDir();

if (!ROOT_DIR) {
	throw new Error('Could not find root directory of this project.');
}

const isWindows = platform() === 'win32';
const isSSH = helpers.isSSHEnvironment(env);
if (isSSH && env.SSH_USER === undefined) {
	if (env.SSH_HOST === undefined) {
		throw new Error('SSH_HOST is undefined.');
	}
	env.SSH_USER = env.SSH_HOST;
}
const espocrmRootDirectory = isSSH
	? (env.SSH_ESPO_ROOT_DIR ?? `/home/${env.SSH_USER}/public_html/`)
	: env.LOCAL_ESPO_ROOT_DIR;

if (!espocrmRootDirectory) {
	throw new Error('SSH_ESPO_ROOT_DIR or LOCAL_ESPO_ROOT_DIR is not set');
}

const BACKEND_PATH = helpers.backendPath(metadata);
const CLIENT_PATH = helpers.clientPath(metadata);

/**
 * @typedef {Object} Preparator
 * @property {string} match The glob pattern of files to match.
 * @property {function(string): string} convert The function that converts the local path to the remote path.
 */

/** @type {Array<Preparator>} */
const preparators = [
	{
		match: join(helpers.SRC_BACKEND, '**', '*'),
		convert: local =>
			join(
				espocrmRootDirectory,
				BACKEND_PATH,
				relative(helpers.SRC_BACKEND, local),
			),
	},
	{
		match: join(helpers.TS_BUILD, '**', '*.(js|js.map)'),
		convert: local =>
			join(
				espocrmRootDirectory,
				CLIENT_PATH,
				relative(helpers.TS_BUILD, local),
			),
	},
	{
		match: join(helpers.CSS_BUILD, '**', '*.(css|css.map)'),
		convert: local =>
			join(
				espocrmRootDirectory,
				CLIENT_PATH,
				'css',
				relative(helpers.CSS_BUILD, local),
			),
	},
	{
		match: join(helpers.SRC_CLIENT, '**', '*.!(ts|d.ts|css)'),
		convert: local =>
			join(
				espocrmRootDirectory,
				CLIENT_PATH,
				relative(helpers.SRC_CLIENT, local),
			),
	},
];

const sftp = new SFTP();

sftp.on('end', () => {
	console.error('SFTP connection ended, exiting...');
	process.exit(1);
});

if (isSSH) {
	await sftp.connect(await helpers.createSSHConfig(env));
}

/**
 * @param {string} local
 * @param {string} remote
 * @returns {Promise<void>}
 */
const upload = async (local, remote) => {
	await sftp.mkdir(dirname(remote), true);
	await sftp.put(local, remote);
};

/**
 * @param {string} path
 * @returns {string|null}
 */
const preparePath = path => {
	const preparator = preparators.find(({ match }) => {
		return anymatch(match, path, { dot: true });
	});

	if (!preparator) {
		return null;
	}

	return preparator.convert(path);
};

/**
 * Validate a single JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<void>}
 */
const validateJsonFile = async filePath => {
	try {
		const content = await readFile(filePath, 'utf-8');
		JSON.parse(content);
	} catch (error) {
		const relativePath = filePath.replace(process.cwd() + '/', '');
		log.error(`Invalid JSON file: ${relativePath}`);
		console.error(`  ❌ ${error instanceof Error ? error.message : String(error)}`);
		throw new Error(`JSON validation failed: ${relativePath}`);
	}
};

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
const processPath = async path => {
	const relativePath = isWindows
		? relative(slash(ROOT_DIR), slash(path))
		: relative(ROOT_DIR, path);

	// Validate JSON files before processing
	if (relativePath.endsWith('.json')) {
		// Skip validation for certain files
		const shouldSkip = [
			'autoload.json',
			'routes.json',
			'node_modules',
			'vendor',
			'build',
			'dist'
		].some(skip => relativePath.includes(skip));

		if (!shouldSkip) {
			await validateJsonFile(path);
		}
	}

	const remotePath = preparePath(relativePath);

	if (!remotePath) {
		return;
	}

	await (isSSH
		? upload(relativePath, remotePath)
		: cpy(relativePath, dirname(remotePath)));

	log.success(`Transferred: ${relativePath}`);
};

// Initial validation is done by build process, skip here for watch mode
log.info('Starting watch mode - JSON files will be validated individually when changed...');

await tsContext.rebuild();
await tsContext.watch();

await cssContext?.rebuild();
await cssContext?.watch();

for (const lessContext of lessContexts) {
	await lessContext.rebuild();
	await lessContext.watch();
}

log.info('Watching for changes...');

const watcher = watch(ROOT_DIR, {
	ignoreInitial: true,
	ignored: '**/node_modules/**/*',
	awaitWriteFinish: {
		stabilityThreshold: 300,
	},
});

watcher.on('add', path => processPath(path));
watcher.on('change', path => processPath(path));
