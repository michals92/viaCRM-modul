define(['views/modal'], Dep => class extends Dep {
	className = 'select-scope';
	override template = 'viacrm:modals/record-template/select-scope';
	escapeDisabled = true;
	noCloseButton = true;

	override data() {
		return {
			entityList: this.entityList,
		};
	}

	setupEvents() {
		this.events['click .add'] = e => {
			const name = $(e.currentTarget).data('name');

			this.trigger('select', name);
			this.close();
		};
	}

	override setup() {
		super.setup();

		this.setupEvents();

		this.headerHtml = this.translate('Select template entity type', 'labels', 'RecordTemplate');
		this.buttonList.push({
			name: 'cancel',
			label: 'Cancel',
		});

		const scopes = this.getMetadata().get('scopes');
		const entityListToIgnore =
					this.getMetadata().get(['entityDefs', 'RecordTemplate', 'entityListToIgnore']) || [];

		this.entityList = Object.keys(scopes)
			.filter(scope => {
				if (entityListToIgnore.includes(scope)) {
					return false;
				}

				if (!this.getAcl().check(scope, 'create')) {
					return false;
				}

				if (!this.getMetadata().get(['entityDefs', scope, 'fields', 'name'])) {
					return false;
				}

				const defs = scopes[scope];
				return defs.entity && (defs.tab || defs.object || defs.template);
			})
			.map(scope => ({
				name: scope,
				translated: this.translate(scope, 'scopeNames'),
			}))
			.sort((v1, v2) => v1.translated.localeCompare(v2.translated));
	}
});