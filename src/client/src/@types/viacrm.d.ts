export {};

import type View from 'espocrm/src/view';
import type BaseFieldView from 'espocrm/src/views/fields/base';
import type Model from 'espocrm/src/model';
import type { AjaxRequestOptions, AjaxResponse } from 'viacrm/types';

/**
 * Constructor type for a class
 */
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Callback that receives the parent class and returns an extended class.
 * When T is specified, Dep is typed as T, otherwise it's any.
 */
type ExtendCallback<T, R = unknown> = (Dep: Constructor<T>) => R;

declare global {
	/**
	 * Define an AMD module extension with type safety.
	 *
	 * Usage with type (no dependencies):
	 * ```typescript
	 * import type BaseFieldView from 'espocrm/src/views/fields/base';
	 * extend<BaseFieldView>(Dep => class extends Dep {
	 *   // Dep is now typed as Constructor<BaseFieldView>
	 * });
	 * ```
	 *
	 * Usage with dependencies (typed):
	 * ```typescript
	 * import type { SelectStatic } from 'ui/select';
	 * extend<BaseFieldView, [SelectStatic]>(['ui/select'], (Dep, Select) => class extends Dep {
	 *   // Dep is typed, Select is typed as SelectStatic
	 * });
	 * ```
	 */

	// Overload 1: No dependencies
	function extend<T = any>(callback: ExtendCallback<T>): void;

	// Overload 2: With 1 dependency
	function extend<T = any, D1 = any>(
		dependencyList: string[],
		callback: (Dep: Constructor<T>, d1: D1) => unknown
	): void;

	// Overload 3: With 2 dependencies
	function extend<T = any, D1 = any, D2 = any>(
		dependencyList: string[],
		callback: (Dep: Constructor<T>, d1: D1, d2: D2) => unknown
	): void;

	// Overload 4: With 3 dependencies
	function extend<T = any, D1 = any, D2 = any, D3 = any>(
		dependencyList: string[],
		callback: (Dep: Constructor<T>, d1: D1, d2: D2, d3: D3) => unknown
	): void;

	// Overload 5: With 4 dependencies
	function extend<T = any, D1 = any, D2 = any, D3 = any, D4 = any>(
		dependencyList: string[],
		callback: (Dep: Constructor<T>, d1: D1, d2: D2, d3: D3, d4: D4) => unknown
	): void;

	// Overload 6: With 5+ dependencies (fallback to any)
	function extend<T = any>(
		dependencyList: string[],
		callback: (Dep: Constructor<T>, ...deps: any[]) => unknown
	): void;

	// Common EspoCRM types available globally via Espo namespace
	const Espo: {
		Ui: {
			success(message: string): void;
			error(message: string): void;
			warning(message: string): void;
			info(message: string): void;
			notify(message: string | false, type?: string, timeout?: number): void;
			notifyWait(): void;
		};
		Ajax: {
			getRequest<T = unknown>(url: string, data?: Record<string, unknown>, options?: AjaxRequestOptions): Promise<T>;
			postRequest<T = unknown>(url: string, data?: Record<string, unknown>, options?: AjaxRequestOptions): Promise<T>;
			putRequest<T = unknown>(url: string, data?: Record<string, unknown>, options?: AjaxRequestOptions): Promise<T>;
			deleteRequest<T = unknown>(url: string, data?: Record<string, unknown>, options?: AjaxRequestOptions): Promise<T>;
			request<T = unknown>(url: string, method: string, data?: Record<string, unknown>, options?: AjaxRequestOptions): Promise<T>;
		};
		Utils: {
			clone<T>(obj: T): T;
			cloneDeep<T>(obj: T): T;
			upperCaseFirst(string: string): string;
			lowerCaseFirst(string: string): string;
			checkActionAvailability(helper: unknown, defs: Record<string, unknown>): boolean;
			checkActionAccess(acl: unknown, entityType: string, defs: Record<string, unknown>): boolean;
		};
		loader: {
			require(module: string, callback: (module: unknown) => void): void;
			requirePromise(module: string): Promise<unknown>;
		};
	};

	// Backbone global
	const Backbone: {
		history: {
			fragment: string;
			getHash(window?: Window): string;
		};
		Events: unknown;
	};

	// Handlebars global
	const Handlebars: {
		Utils: {
			escapeExpression(str: string): string;
		};
	};
}
