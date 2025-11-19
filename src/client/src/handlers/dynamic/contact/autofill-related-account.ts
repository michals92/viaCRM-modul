import type DynamicHandler from 'espocrm/src/dynamic-handler';

interface AddressData {
	primary?: boolean;
	optOut?: boolean;
	invalid?: boolean;
	accountId?: string | null;
	accountName?: string | null;
	[key: string]: any; // For specific fields
}

type FieldType = 'emailAddress' | 'phoneNumber';

define(['dynamic-handler'], (Dep: typeof DynamicHandler) => class ContactCreateHandler extends Dep {
	protected fieldConfigs = {
		emailAddress: {
			dataField: 'emailAddressData',
			defaultData: {
				emailAddress: '',
				primary: true,
			},
		},
		phoneNumber: {
			dataField: 'phoneNumberData',
			defaultData: {
				phoneNumber: '',
				primary: true,
			},
		},
	};

	override init() {
		super.init();

		// @ts-ignore oof
		if (this.recordView.mode !== this.recordView.MODE_EDIT) {
			return;
		}

		this.recordView.listenToOnce(this.model, 'sync', () => {
			this.assignAccountToField('emailAddress');
			this.assignAccountToField('phoneNumber');
		});

		// Listen for email additions
		this.recordView.listenTo(this.model, 'add:emailAddressData', () => {
			this.assignAccountToField('emailAddress');
		});

		// Listen for phone additions
		this.recordView.listenTo(this.model, 'add:phoneNumberData', () => {
			this.assignAccountToField('phoneNumber');
		});
	}

	getAccount(): { exists: boolean; id: string | null; name: string | null } {
		const id: string | null = this.model.get('accountId');
		return {
			exists: id !== null,
			id,
			name: this.model.get('accountName'),
		};
	}

	assignAccountToField(fieldType: FieldType) {
		const account = this.getAccount();

		if (!account.exists) {
			return;
		}

		const config = this.fieldConfigs[fieldType];
		const data: AddressData[] = this.model.get(config.dataField) || [];

		// If no data exists, create initial entry
		if (data.length === 0) {
			data[0] = config.defaultData;
		}

		const lastIndex = data.length - 1;

		// Skip if already has account
		if (data[lastIndex]?.accountId) {
			return;
		}

		// Update the last entry with account information
		data[lastIndex] = {
			...data[lastIndex],
			accountId: account.id,
			accountName: account.name,
		};

		// Update model and trigger refresh
		this.model.set(config.dataField, data);

		const fieldView = this.recordView.getFieldView(fieldType);
			
		if (fieldView) {
			fieldView.reRender().then(() => {
				this.model.trigger(`change:${fieldType}`);
			});
		}
	}
});
