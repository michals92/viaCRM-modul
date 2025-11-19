extend(Dep => class extends Dep {

	populateValues() {
		super.populateValues();

		// Early return if no itemData
		if (!this.itemData) return;

		// Extract commonly used properties with destructuring
		const {data, subjectType, value} = this.itemData;
		const fieldName = data?.field || '';

		// Set value when subject type is field
		if (subjectType === 'field') {
			this.model.set('value', fieldName);
		}

		// Handle link values
		const linkData = data?.values;
		if (linkData?.linkId) {
			this.setLinkValues(fieldName, linkData.linkId, linkData.linkName);
		}
		// Handle direct value
		else if (value) {
			this.model.set(`${fieldName}Ids`, [value]);
		}
	}

	setLinkValues(fieldName, id, name) {
		this.model.set(`${fieldName}Ids`, [id]);
		this.model.set(`${fieldName}Id`, [id]);
		this.model.set(`${fieldName}Name`, name);

		if (name && id) {
			const namesMap = {[id]: name};
			this.model.set(`${fieldName}Names`, namesMap);
		}
	}
});
