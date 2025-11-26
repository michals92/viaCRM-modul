import type PhoneFieldView from 'espocrm/src/views/fields/phone';

extend<PhoneFieldView>(Dep => class extends Dep {
	override listTemplate = 'viacrm:fields/phone/list';
	override detailTemplate = 'viacrm:fields/phone/detail';
	override editTemplate = 'viacrm:fields/phone/edit';

	override setup() {
		super.setup();
	}

	override setMode(mode: string): Promise<void> {
		const result = super.setMode(mode);

		if (this.isDetailMode() || this.isListMode()) {
			if (this.params.copyToClipboard) {
				this.events['click [data-action="copyToClipboard"]'] = e => {
					const index = $(e.currentTarget).data('index');
					this.copyToClipboard(index);
				};
			}
		} else if (this.isEditMode()) {
			this.events['click [data-action="selectAccount"]'] = e => {
				const index = $(e.currentTarget).data('index');
				this.selectAccount(index);
			};
			this.events['click [data-action="clearAccount"]'] = e => {
				const index = $(e.currentTarget).data('index');
				this.clearAccount(index);
			};
		}

		return result;
	}

	override data(): Record<string, any> {
		const accountLinkEnabled = this.getConfig().get('disableAccountLinkToPhone') !== true;
		const data = {
			...super.data(),
			accountLinkEnabled,
			copyToClipboard: this.params.copyToClipboard,
		};

		if (!accountLinkEnabled) {
			return data;
		}

		return {
			...data,
		};
	}

	/** Backports https://github.com/espocrm/espocrm/pull/3427 */
	override addPhoneNumber(): void {
		const data = Espo.Utils.cloneDeep(this.fetchPhoneNumberData());

		const o = {
			phoneNumber: '',
			primary: !data.length,
			type: this.defaultType,
			optOut: this.phoneNumberOptedOutByDefault,
			invalid: false,
		};

		data.push(o);

		this.model.set(this.dataFieldName, data, {silent: true});

		this.reRender()
			.then(() => this.focusOnLast());
			
		this.model.trigger('add:phoneNumberData');
	}

	selectAccount(index: number): void {
		const viewOptions = {
			primaryFilterName: 'active',
			createButton: false,
			filters: {},
		};

		this.createView('dialog', 'views/modals/select-records', {
			scope: 'Account',
			multiple: false,
			createButton: false,
			viewOptions: viewOptions,
		}).then(view => {
			view.render();

			this.listenToOnce(view, 'select', model => {
				const phoneNumberData = this.model.get(this.dataFieldName) || [];

				if (phoneNumberData[index]) {
					phoneNumberData[index] = {
						...phoneNumberData[index],
						accountId: model.id,
						accountName: model.get('name'),
					};

					this.model.set(this.dataFieldName, phoneNumberData);
					this.model.trigger('change:' + this.dataFieldName);
					this.reRender();
				}
			});
		});
	}

	clearAccount(index: number): void {
		const phoneNumberData = this.model.get(this.dataFieldName) || [];

		if (phoneNumberData[index]) {
			phoneNumberData[index] = {
				...phoneNumberData[index],
				accountId: null,
				accountName: null,
			};

			this.model.set(this.dataFieldName, phoneNumberData);
			this.model.trigger('change:' + this.dataFieldName);
			this.reRender();
		}
	}

	override copyToClipboard(index?: number): void {
		const phoneNumberData = this.model.get(this.dataFieldName);
		const phoneNumber = this.model.get(this.name);
		const value =
				phoneNumberData != null
					? index !== undefined
						? phoneNumberData[index]?.phoneNumber
						: phoneNumber
					: phoneNumber;

		if (value) {
			navigator.clipboard.writeText(value).then(() => {
				Espo.Ui.success(this.translate('Copied to clipboard'));
			});
		}
	}

	override fetchPhoneNumberData() {
		const data = super.fetchPhoneNumberData();
		// Preserve account data during fetch
		const currentData = this.model.get(this.dataFieldName) || [];

		return data.map((item, index) => {
			const currentItem = currentData[index] || {};
			return {
				...item,
				accountId: currentItem.accountId || null,
				accountName: currentItem.accountName || null,
			};
		});
	}

	override fetch() {
		const data = super.fetch();
		const phoneNumberData = this.fetchPhoneNumberData();
		return {
			...data,
			[this.dataFieldName]: phoneNumberData,
		};
	}
});
