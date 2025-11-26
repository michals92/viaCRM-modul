import type Model from 'espocrm/src/model';
import type {Callback} from 'espocrm/src/bull';

extend<Model>(Dep => class extends Dep {
	private _problematicFieldTypes: string[] = ['link', 'linkOne', 'file', 'linkMultiple', 'attachmentMultiple'];

	override on(name: string, callback: Callback, context?: unknown): void {
		if (typeof name === 'string') {
			const parts = name.split(':');

			if (parts.length === 2 && parts[0] === 'change') {
				const fieldName = parts[1];

				if (fieldName && 'fields' in this.defs && this.defs.fields) {
					if (fieldName in this.defs.fields) {
						const fieldDef = this.defs.fields[fieldName];
						const fieldType = fieldDef?.type as string | undefined;

						if (fieldType && this._problematicFieldTypes.includes(fieldType)) {
							console.warn(
								`Warning: Listening to a ${fieldType} field '${fieldName}' directly. This will not work. Consult someone with more experience.`,
							);
						}
					}
				}
			}
		}

		super.on(name, callback);
	}

	override once(name: string, callback: Callback, context?: unknown): void {
		if (typeof name === 'string') {
			const parts = name.split(':');

			if (parts.length === 2 && parts[0] === 'change') {
				const fieldName = parts[1];

				if (fieldName && this.defs.fields && fieldName in this.defs.fields) {
					const fieldDef = this.defs.fields[fieldName];
					const fieldType = fieldDef?.type as string | undefined;

					if (fieldType && this._problematicFieldTypes.includes(fieldType)) {
						console.warn(
							`Warning: Listening to a ${fieldType} field '${fieldName}' directly. This will not work. Consult someone with more experience.`,
						);
					}
				}
			}
		}

		super.once(name, callback);
	}
});
