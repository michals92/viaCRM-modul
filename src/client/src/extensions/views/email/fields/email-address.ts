import type EmailEmailAddressFieldView from 'espocrm/src/views/email/fields/email-address';

type AutocompleteModule = {
	optionsOverrides?: {
		minChars?: number;
	};
};

extend<EmailEmailAddressFieldView>(['ui/autocomplete'], (Dep, Autocomplete: AutocompleteModule) => class extends Dep {
	override initSearchAutocomplete(): void {
		const minChars = this.params.autocompleteMinChars as number | undefined | null;

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
