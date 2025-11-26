import type TreeCollection from 'espocrm/src/collections/tree';

extend<TreeCollection>(Dep => class extends Dep {
	override clone(options: Record<string, unknown> = {}): TreeCollection {
		const cloneOptions = { ...options, withModels: false };

		return super.clone(cloneOptions);
	}
});
