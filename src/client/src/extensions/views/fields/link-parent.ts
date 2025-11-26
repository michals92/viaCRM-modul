import type LinkParentFieldView from 'espocrm/src/views/fields/link-parent';

extend<LinkParentFieldView>(['ui/autocomplete'], (Dep, Autocomplete) => class extends Dep {
	override editTemplate = 'viacrm:fields/link-parent/edit';
	override listLinkTemplate = 'viacrm:fields/link-parent/list-link';

	override afterRender() {
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
