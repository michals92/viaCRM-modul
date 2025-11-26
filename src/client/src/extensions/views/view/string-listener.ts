import type View from 'espocrm/src/view';

interface ModelWithDefs {
	defs?: {
		fields?: Record<string, { type?: string }>;
	};
}

extend<View>(Dep => class extends Dep {
	override listenTo(other: unknown, event: string, callback: () => void): void {
		if (typeof event === 'string') {
			const parts = event.split(':');
			if (parts.length > 1 && parts[0] === 'change') {
				const field = parts.slice(1).join(':');

				const modelWithDefs = other as ModelWithDefs;
				if (
					typeof other === 'object' &&
					modelWithDefs.defs &&
					typeof modelWithDefs.defs === 'object' &&
					modelWithDefs.defs.fields &&
					typeof modelWithDefs.defs.fields === 'object' &&
					modelWithDefs.defs.fields[field] &&
					modelWithDefs.defs.fields[field].type === 'duration'
				) {
					console.error(
						`Warning: Listening to a duration field '${field}' directly. This will not work, the duration field is 'fake'. Consult someone with more experience.`,
					);
				}
			}
		}

		super.listenTo(other, event, callback);
	}

	override listenToOnce(other: unknown, event: string, callback: () => void): void {
		if (typeof event === 'string') {
			const parts = event.split(':');
			if (parts.length > 1 && parts[0] === 'change') {
				const field = parts.slice(1).join(':');

				const modelWithDefs = other as ModelWithDefs;
				if (
					typeof other === 'object' &&
					modelWithDefs.defs &&
					typeof modelWithDefs.defs === 'object' &&
					modelWithDefs.defs.fields &&
					typeof modelWithDefs.defs.fields === 'object' &&
					modelWithDefs.defs.fields[field] &&
					modelWithDefs.defs.fields[field].type === 'duration'
				) {
					console.error(
						`Warning: Listening once to a duration field '${field}' directly. This will not work, the duration field is 'fake'. Consult someone with more experience.`,
					);
				}
			}
		}

		super.listenToOnce(other, event, callback);
	}
});
