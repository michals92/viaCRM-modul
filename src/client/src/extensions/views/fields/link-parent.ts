extend(['ui/autocomplete'], (Dep, Autocomplete) => class extends Dep {
	editTemplate = 'viacrm:fields/link-parent/edit';
	listLinkTemplate = 'viacrm:fields/link-parent/list-link';

	afterRender() {
		const minChars = this.params.autocompleteMinChars;

		if (minChars !== undefined && minChars !== null) {
			Autocomplete.optionsOverrides ??= {};
			const prev = Autocomplete.optionsOverrides.minChars;
			Autocomplete.optionsOverrides.minChars = minChars;

			try {
				super.afterRender();
			} finally {
				Autocomplete.optionsOverrides.minChars = prev;
			}

			return;
		}

		super.afterRender();
	}
});
