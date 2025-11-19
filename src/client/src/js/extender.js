class PatchedLoader {
	constructor() {
		this.org = null;
		this.contextId = null;
		this.extensionDepGraph = {};
		this.extensionMap = {};
		this.beingDefinedPromises = {};
	}

	setOriginalLoader(org) {
		this.org = org;
	}

	define(id, orgDeps, callback) {
		id = this.#parseId(id);
		const deps = this.#parseDependencyIds(orgDeps).map(depId => this.extensionMap[depId] || depId);

		if (id && id in this.extensionDepGraph) {
			console.error(`Define used instead of 'extend' for extending '${id}'`);
			this.extend(id, orgDeps, callback);
			return;
		}

		this.#defineCommon(id, deps, callback);
	}

	extend(id, deps, callback) {
		id = this.#parseId(id);
		deps = this.#parseDependencyIds(deps);

		if (id && id in this.extensionDepGraph) {
			deps.unshift(this.extensionDepGraph[id]);
		} else {
			console.warn(`Extender could not find base module for extension '${id}', skipping...`);
			return;
		}

		this.#defineCommon(id, deps, callback);
	}

	#parseDependencyIds(dependencyIds) {
		if (!dependencyIds) {
			dependencyIds = [];
		}

		if (!Array.isArray(dependencyIds)) {
			dependencyIds = [dependencyIds];
		}

		return dependencyIds;
	}

	#parseId(id) {
		if (!id && this.contextId) {
			return this.contextId;
		}

		if (!id && document.currentScript) {
			return this.#urlToId(document.currentScript.src);
		}

		if (!id) {
			const url = this.getUrlFromStack();
			if (url) {
				return this.#urlToId(url);
			}
		}

		if (id) {
			return id;
		}

		console.warn('Extender could not determine module ID, skipping...');
		return null;
	}

	#defineCommon(id, dependencyIds, callback) {
		if (!id) {
			this.org.define(null, dependencyIds, callback);
			return;
		}

		this.contextId = null;
		const dependencyPromises = [];

		for (const depId of dependencyIds) {
			if (this.beingDefinedPromises[depId]) {
				dependencyPromises.push(this.beingDefinedPromises[depId]);
			}
		}

		const promise = new Promise(resolve => {
			Promise.all(dependencyPromises).then(() => {
				this.org.define(id, dependencyIds, function (...args) {
					resolve();
					return callback.apply(this, args);
				});
			});
		});

		this.beingDefinedPromises[id] = promise;

		promise.finally(() => delete this.beingDefinedPromises[id]);
	}

	require(deps, callback, errorCallback) {
		deps = this.#parseDependencyIds(deps).map(depId => this.extensionMap[depId] || depId);
		return this.org.require(deps, callback, errorCallback);
	}

	setContextId(id) {
		this.contextId = id;
		return this.org.setContextId(id);
	}

	#urlToId(url) {
		let path = URL.parse(url).pathname;

		if (path.startsWith('/')) {
			path = path.slice(1);
		}

		if (path.endsWith('.js')) {
			path = path.slice(0, -3);
		}

		const patterns = [
			{
				regex: /^.*client\/lib\/transpiled\/modules\/([^/]+)\/src\/(.+)$/,
				format: match => match[1] + ':' + match[2],
			},
			{
				regex: /^.*client\/custom\/modules\/([^/]+)\/lib\/transpiled\/src\/(.+)$/,
				format: match => match[1] + ':' + match[2],
			},
			{
				regex: /^.*client\/modules\/([^/]+)\/src\/(.+)$/,
				format: match => match[1] + ':' + match[2],
			},
			{
				regex: /^.*client\/custom\/modules\/([^/]+)\/src\/(.+)$/,
				format: match => match[1] + ':' + match[2],
			},
			{
				regex: /^.*client\/lib\/transpiled\/src\/(.+)$/,
				format: match => match[1],
			},
			{
				regex: /^.*client\/custom\/src\/(.+)$/,
				format: match => 'custom:' + match[1],
			},
		];

		for (const pattern of patterns) {
			const match = path.match(pattern.regex);
			if (match) {
				return pattern.format(match);
			}
		}

		return null;
	}

	getUrlFromStack() {
		const lines = new Error().stack.split('\n');

		const regex = /^\s*(?:at\s+)?(?<object>.*?)\s*[@(]\s*(?<url>https?:\/\/\S+?)(?=:\d+(?::\d+)?\)?\s*$)/;
		let next = false;

		for (const line of lines) {
			const match = line.match(regex);
			const name = match?.groups?.object?.trim() || null;
			const url = match?.groups?.url?.trim() || null;

			if (name && url) {
				if (next) {
					return url;
				}

				if (name.includes('_define') || name.includes('_extend')) {
					next = true;
				}
			}
		}

		return null;
	}

	setViewExtensionMap(viewExtensionMap) {
		for (const [view, extensions] of Object.entries(viewExtensionMap)) {
			let prev = view;

			for (const extension of extensions) {
				this.extensionDepGraph[extension] = prev;
				prev = extension;
			}

			if (extensions.length) {
				this.extensionMap[view] = extensions[extensions.length - 1];
			}
		}
	}
}

(() => {
	const root = window;
	const patchedLoader = new PatchedLoader();
	const initializeExtensions = () => {
		const extensionsTag = document.querySelector('script[data-name="extension-views"]');

		if (!extensionsTag) {
			return;
		}

		patchedLoader.setViewExtensionMap(JSON.parse(extensionsTag.textContent));
	};

	const parseArgs = (arg1, arg2, arg3) => {
		if (typeof arg1 === 'function') {
			return { id: null, depIds: null, callback: arg1 };
		}

		if (typeof arg2 === 'function') {
			if (Array.isArray(arg1)) {
				return { id: null, depIds: arg1, callback: arg2 };
			}
			return { id: arg1, depIds: [], callback: arg2 };
		}

		return { id: arg1, depIds: arg2, callback: arg3 };
	};

	const defineProperty = (obj, prop, value) => {
		Object.defineProperty(obj, prop, {
			get: () => value,
			configurable: true,
		});
	};

	const _define = function (arg1, arg2, arg3) {
		const { id, depIds, callback } = parseArgs(arg1, arg2, arg3);
		return root.Espo.loader.define(id, depIds, callback);
	};
	_define.amd = true;

	const _extend = function (arg1, arg2, arg3) {
		const { id, depIds, callback } = parseArgs(arg1, arg2, arg3);
		return root.Espo.loader.extend(id, depIds, callback);
	};

	const _require = (id, callback, context, errorCallback) => {
		if (context) {
			callback = callback.bind(context);
		}
		return root.Espo.loader.require(id, callback, errorCallback);
	};

	defineProperty(root, 'define', _define);
	defineProperty(root, 'extend', _extend);
	defineProperty(root, 'require', _require);

	let _espo;
	Object.defineProperty(root, 'Espo', {
		get: () => _espo,
		set: value => {
			_espo = value;

			let _loaderIsSet = false;

			Object.defineProperty(_espo, 'loader', {
				get: () => (_loaderIsSet ? patchedLoader : undefined), // Espo expects undefined if loader is not set
				set: originalLoader => {
					if (!_loaderIsSet) {
						patchedLoader.setOriginalLoader(originalLoader);

						for (const key of Object.keys(originalLoader)) {
							if (!(key in patchedLoader)) {
								patchedLoader[key] = originalLoader[key];
							}
						}

						_loaderIsSet = true;
					}
				},
				configurable: true,
			});

			defineProperty(_espo, 'define', _define);
			defineProperty(_espo, 'require', _require);
		},
	});

	initializeExtensions();
})();
