define(['views/fields/enum'], Dep => class extends Dep {
	override setup() {
		super.setup();

		this.controlVisibility();

		this.listenTo(this.model, 'change:attachmentCompareViewMode', () => {
			this.controlVisibility();
		});
	}

	controlVisibility() {
		const enabled = this.model.get('attachmentCompareViewMode');

		if (enabled) {
			this.show();
		} else {
			this.hide();
		}
	}

	override setupOptions() {
		const entityType = this.model.get('name');

		const options = this.getFieldManager()
			.getEntityTypeFieldList(entityType, {
				typeList: ['file', 'attachmentMultiple'],
				onlyAvailable: true,
			})
			.sort((a, b) => this.getLanguage().translate(a, 'fields', entityType)
				.localeCompare(
					this.getLanguage().translate(b, 'fields', entityType)
				));

		this.translatedOptions = {
			'': this.translate('None')
		};

		options.forEach(item => {
			this.translatedOptions[item] = this.translate(item, 'fields', entityType);
		});

		this.params.options = ['', ...options];
	}
});
