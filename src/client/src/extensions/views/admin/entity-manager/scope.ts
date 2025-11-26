import type EntityManagerScopeView from 'espocrm/src/views/admin/entity-manager/scope';

extend<EntityManagerScopeView>(Dep => class extends Dep {
	override template = 'viacrm:admin/entity-manager/scope';
	declare scope: string;

	override setup(): void {
		this.addActionHandler('cloneEntity', () => this.getRouter().navigate('Admin/entityManager/clone=true&fromScope=' + this.scope, { trigger: true }));

		super.setup();
	}
});
