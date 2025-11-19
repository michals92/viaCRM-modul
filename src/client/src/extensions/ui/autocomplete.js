extend(Dep => class extends Dep {
	static optionsOverrides = {};

	constructor(element, options) {
		const overrides = Dep.optionsOverrides || {};

		// Apply all overrides to options
		const finalOptions = { ...options };

		for (const [key, value] of Object.entries(overrides)) {
			if (value !== undefined && value !== null) {
				finalOptions[key] = value;
			}
		}

		super(element, finalOptions);
	}
});
