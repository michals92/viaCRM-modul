extend(Dep => class extends Dep {
	listenTo(other, event, callback) {
		if (typeof event === 'string') {
			const parts = event.split(':');
			if (parts.length > 1 && parts[0] === 'change') {
				const field = parts.slice(1).join(':');

				if (
					typeof other === 'object' &&
						other.defs &&
						typeof other.defs === 'object' &&
						other.defs.fields &&
						typeof other.defs.fields === 'object' &&
						other.defs.fields[field] &&
						other.defs.fields[field].type === 'duration'
				) {
					console.error(
						`Warning: Listening to a duration field '${field}' directly. This will not work, the duration field is 'fake'. Consult someone with more experience.`,
					);
				}
			}
		}

		super.listenTo(other, event, callback);
	}

	listenToOnce(other, event, callback) {
		if (typeof event === 'string') {
			const parts = event.split(':');
			if (parts.length > 1 && parts[0] === 'change') {
				const field = parts.slice(1).join(':');

				if (
					typeof other === 'object' &&
						other.defs &&
						typeof other.defs === 'object' &&
						other.defs.fields &&
						typeof other.defs.fields === 'object' &&
						other.defs.fields[field] &&
						other.defs.fields[field].type === 'duration'
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
