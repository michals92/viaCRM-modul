import type DynamicLogicConditionsStringItemBaseView from 'espocrm/src/views/admin/dynamic-logic/conditions-string/item-base';

type ItemData = {
	data?: {
		field?: string;
		values?: {
			linkId?: string;
			linkName?: string;
		};
	};
	subjectType?: string;
	value?: string;
};

extend<DynamicLogicConditionsStringItemBaseView>(Dep => class extends Dep {
	declare itemData?: ItemData;

	override populateValues(): void {
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

	setLinkValues(fieldName: string, id: string, name?: string): void {
		this.model.set(`${fieldName}Ids`, [id]);
		this.model.set(`${fieldName}Id`, [id]);
		this.model.set(`${fieldName}Name`, name);

		if (name && id) {
			const namesMap = {[id]: name};
			this.model.set(`${fieldName}Names`, namesMap);
		}
	}
});
