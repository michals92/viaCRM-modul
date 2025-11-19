export {};

/**
 * A callback with resolved dependencies passed as parameters.
 * Should return a value to define a module.
 *
 * @param arguments Resolved dependencies.
 */
type extendCallback = (dep: any, ...arguments: any[]) => unknown;

declare global {
	/**
	 * Define an [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) module.
	 *
	 * 3 signatures:
	 * 1. `(callback)` – Unnamed, no dependencies.
	 * 2. `(dependencyList, callback)` – Unnamed, with dependencies.
	 * 3. `(moduleName, dependencyList, callback)` – Named.
	 */

	function extend(dependencyList: string[], callback: extendCallback): void;

	function extend(callback: extendCallback): void;
}
