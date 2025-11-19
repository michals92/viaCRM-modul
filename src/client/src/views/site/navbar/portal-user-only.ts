import type View from 'espocrm/src/view';

define(['view'], (Dep: typeof View) => class extends Dep {
	isAvailable(): boolean {
		return this.getUser().isPortal();
	}
});
