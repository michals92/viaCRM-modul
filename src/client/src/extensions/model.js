extend(Dep => class extends Dep {
	_problematicFieldTypes = ['link', 'linkOne', 'file', 'linkMultiple', 'attachmentMultiple'];

	on(name, callback, context) {
		if (typeof name == 'string') {
			const parts = name.split(':');

			if (parts.length === 2 && parts[0] === 'change') {
				const fieldName = parts[1];

				if ('fields' in this.defs) {
					if (fieldName in this.defs.fields) {
						const fieldType = this.defs.fields[fieldName].type;

						if (this._problematicFieldTypes.includes(fieldType)) {
							console.warn(
								`Warning: Listening to a ${fieldType} field '${fieldName}' directly. This will not work. Consult someone with more experience.`,
							);
						}
					}
				}
			}
		}

		super.on(name, callback, context);
	}

	once(name, callback, context) {
		if (typeof name == 'string') {
			const parts = name.split(':');

			if (parts.length === 2 && parts[0] === 'change') {
				const fieldName = parts[1];

				if (fieldName in this.defs.fields) {
					const fieldType = this.defs.fields[fieldName].type;

					if (this._problematicFieldTypes.includes(fieldType)) {
						console.warn(
							`Warning: Listening to a ${fieldType} field '${fieldName}' directly. This will not work. Consult someone with more experience.`,
						);
					}
				}
			}
		}

		super.once(name, callback, context);
	}
});
