extend(['ui/autocomplete'], (Dep, Autocomplete) => class extends Dep {
	initSearchAutocomplete() {
		const minChars = this.params.autocompleteMinChars;

		if (minChars !== undefined && minChars !== null) {
			Autocomplete.optionsOverrides ??= {};
			const prev = Autocomplete.optionsOverrides.minChars;
			Autocomplete.optionsOverrides.minChars = minChars;

			try {
				super.initSearchAutocomplete();
			} finally {
				Autocomplete.optionsOverrides.minChars = prev;
			}

			return;
		}

		super.initSearchAutocomplete();
	}
});
