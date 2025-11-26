define(['view'], Dep => class extends Dep {
	override template = 'autocrm:admin/layouts/panels/layouts';

	scopeTypeLists = {};

	override setup() {
		this.scopeList = this.scopeList || this.options.scopeList;
		this.scope = this.scope || this.options.scope || this.scopeList[0];

		this.options.scopeDataList.forEach(item => {
			this.scopeTypeLists[item.scope] = item.typeList;
		});

		this.listenTo(this.model, 'change:scope', () => {
			const scope = this.model.get('scope');

			if (scope) {
				this.scope = scope;
				this.reRender();
			}
		});
	}

	addLayout(scope, type) {
		this.scopeTypeLists[scope].push(type);
		this.reRender();
	}

	override data() {
		return {
			scope: this.scope,
			typeList: this.scopeTypeLists[this.scope],
		};
	}
});
