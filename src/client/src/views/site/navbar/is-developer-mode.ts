define(['autocrm:views/site/navbar/admin-only'], (Dep: typeof import('espocrm/src/view').default) => class extends Dep {
	override template = 'autocrm:site/navbar/is-developer-mode';

	override data() {
		return {
			isDeveloperMode: this.getConfig().get('isDeveloperMode') ?? false,
		};
	}
});
