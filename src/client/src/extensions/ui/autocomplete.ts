import type { AutocompleteOptions } from 'espocrm/src/ui/autocomplete';

import type Autocomplete from 'espocrm/src/ui/autocomplete';

extend<Autocomplete>(Dep => class extends Dep {
	static optionsOverrides: Partial<AutocompleteOptions> = {};

	constructor(element: HTMLElement | JQuery, options: AutocompleteOptions) {
		const overrides = Dep.optionsOverrides ?? {};

		// Apply all overrides to options
		const finalOptions: AutocompleteOptions = { ...options };

		for (const [key, value] of Object.entries(overrides)) {
			if (value !== undefined && value !== null) {
				finalOptions[key] = value;
			}
		}

		super(element, finalOptions);
	}
});
