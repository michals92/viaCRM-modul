import type ListView from 'espocrm/src/views/list';

extend((Dep: typeof ListView) => class extends Dep {
	override setup() {
		super.setup();

		this.setupCreateAdvancedButton();
	}

	setupCreateAdvancedButton() {
		if (!this.menu.buttons) {
			return;
		}

		this.menu.buttons.unshift({
			action: 'createAdvanced',
			iconHtml: '<span class="fas fa-plus fa-sm"></span>',
			text: this.translate('Create ' + this.scope + ' (Advanced)', 'labels', this.scope),
			style: 'default',
			acl: 'create',
			//@ts-ignore oof
			aclScope: this.entityType || this.scope,
		});
	}

	//TODO: make the user select which scopes should default to max permissions
	actionCreateAdvanced() {
		const data = {};

		for (const scope of this.getScopeList()) {
			const scopeData = this.getScopeData(scope);

			if (scopeData) {
				data[scope] = scopeData;
			}
		}

		const router = this.getRouter();

		const url = '#' + this.scope + '/create';

		let options: any = { attributes: { data } };

		if (this.keepCurrentRootUrl) {
			options.rootUrl = this.getRouter().getCurrentUrl();
		}

		const returnDispatchParams = {
			controller: this.scope,
			action: null,
			options: { isReturn: true },
		};

		this.prepareCreateReturnDispatchParams(returnDispatchParams);

		options = {
			...options,
			returnUrl: this.getRouter().getCurrentUrl(),
			returnDispatchParams: returnDispatchParams,
		};

		router.navigate(url, { trigger: false });
		router.dispatch(this.scope, 'create', options);
	}

	getScopeData(scope: string) {
		const scopeData: any = this.getMetadata().get(['scopes', scope]) || {};
			
		switch (scopeData.acl) {
			case 'boolean':
				return true;
			case true:
			case 'recordAllTeamOwnNo':
			case 'recordAllTeamNo':
			case 'recordAllOwnNo':
			case 'recordAllNo':
			case 'record': {
				const data = { create: 'yes', read: 'all', update: 'all', delete: 'all', stream: 'all' };

				const highestLevel = scopeData.aclHighestLevel || 'all';

				if (highestLevel) {
					data.read = highestLevel;
					data.update = highestLevel;
					data.delete = highestLevel;
					data.stream = highestLevel;
				}

				const actionList = scopeData.aclActionList || ['create', 'read', 'update', 'delete', 'stream'];

				// Unset all keys that aren't in the actionList
				Object.keys(data).forEach(key => {
					if (!actionList.includes(key)) {
						delete data[key];
					}
				});

				return data;
			}
			default:
				return null;
		}
	}

	getSortedScopeList(): string[] {
		const moduleList = [null, 'Crm'];

		const scopes = this.getMetadata().get<string[]>('scopes', []);

		Object.keys(scopes).forEach(scope => {
			const module = scopes[scope].module;

			if (!module || module === 'Custom' || moduleList.includes(module)) {
				return;
			}

			moduleList.push(module);
		});

		moduleList.push('Custom');

		return Object.keys(scopes).sort((v1, v2) => {
			const module1 = scopes[v1].module || null;
			const module2 = scopes[v2].module || null;

			if (module1 !== module2) {
				const index1 = moduleList.findIndex(m => m === module1);
				const index2 = moduleList.findIndex(m => m === module2);

				return index1 - index2;
			}

			return this.translate(v1, 'scopeNamesPlural').localeCompare(this.translate(v2, 'scopeNamesPlural'));
		});
	}

	getScopeList(): string[] {
		const scopeList: string[] = [];

		this.getSortedScopeList().forEach(scope => {
			if (this.getMetadata().get(['scopes', scope, 'disabled'])) {
				return;
			}

			const acl = this.getMetadata().get(['scopes', scope, 'acl']);

			if (acl) {
				scopeList.push(scope);
			}
		});

		return scopeList;
	}
});
