define(['views/fields/varchar', 'autocrm:helpers/zive-firmy-integration'], (Dep, ZiveFirmyIntegration) => class extends Dep {
	afterRender() {
		super.afterRender();
			
		if (this.isSearchMode()) {
			const type = this.$el.find('select.search-type').val();
			this.handleSearchType(type);
		}

		// Setup ziveFirmy autocomplete
		ZiveFirmyIntegration.setupNameAutocomplete(this, {
			sicCodeField: 'sicCode',
			vatIdField: 'vatId'
		});

		if (this.isSearchMode()) {
			this.$el.find('select.search-type').on('change', () => {
				this.trigger('change');
			});

			this.$element.on('input', () => {
				this.trigger('change');
			});
		}
	}
});