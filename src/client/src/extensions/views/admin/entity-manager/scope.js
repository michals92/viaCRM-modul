extend(Dep => class extends Dep {
	template = 'autocrm:admin/entity-manager/scope';

	setup () {
		this.addActionHandler('cloneEntity', () => this.getRouter().navigate('Admin/entityManager/clone=true&fromScope=' + this.scope, { trigger: true }));

		super.setup();
	}
});
