define(['views/fields/link-parent'], Dep => class extends Dep {
	setup() {
		super.setup();

		this.listenTo(this.model, 'change:createNew', () => this.handleVisibility());
	}

	fetch() {
		const data = {};

		data[this.typeName] = this.$elementType.val() || null;
		data[this.nameName] = this.$elementName.val() || null;
		data[this.idName] = this.$elementId.val() || null;

		return data;
	}

	afterRender() {
		super.afterRender();

		this.handleVisibility();
	}

	handleVisibility() {
		const createNew = this.model.get('createNew');

		this.$el
			.find('.input-group-item-middle, [data-action="selectLink"], [data-action="clearLink"]')
			.toggle(!createNew);
	}

	validateRequired() {
		if (this.isRequired()) {
			const createNew = this.model.get('createNew');
			const entityId = this.model.get(this.idName);
			const entityType = this.model.get(this.typeName);

			if (!createNew && entityId === null) {
				const msg = this.translate('fieldIsRequired', 'messages').replace('{field}', this.getLabelText());
					
				this.showValidationMessage(msg);
				return true;
			}

			if (createNew && !entityType) {
				const msg = this.translate('fieldIsRequired', 'messages').replace(
					'{field}',
					this.translate('entityType', 'fields'),
				);
				this.showValidationMessage(msg);

				return true;
			}
		}
	}
});
