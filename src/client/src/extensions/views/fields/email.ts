import type Model from "espocrm/src/model";
import type SelectRecordsView from "espocrm/src/views/modals/select-records";

extend(['ui/autocomplete'], (Dep, Autocomplete) => class extends Dep {
	listTemplate = 'autocrm:fields/email/list';
	detailTemplate = 'autocrm:fields/email/detail';
	editTemplate = 'autocrm:fields/email/edit';

	setMode(mode) {
		super.setMode(mode);

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
	}

	data(): Record<string, any> {
		const accountLinkEnabled = this.getConfig().get('disableAccountLinkToEmail') !== true;
			
		const data = {
			...super.data(),
			accountLinkEnabled,
			copyToClipboard: this.params.copyToClipboard,
		};

		if (!accountLinkEnabled) {
			return data;
		}

		return {
			...data
		};
	}

	addEmailAddress(): void {
		// Fetch all current values including unsaved ones
		const currentData = this.fetchEmailAddressData();
		const emailAddressData = this.model.get(this.dataFieldName) || [];

		// Create new item
		const item = {
			emailAddress: '',
			primary: !emailAddressData.length,
			optOut: false,
			invalid: false,
			lower: '',
			accountId: null,
			accountName: null,
		};

		// Add new item to the current data
		currentData.push(item);

		// Update model with all current data
		this.model.set(this.dataFieldName, currentData, { silent: true });

		// Rerender with preserved data
		this.reRender().then(() => {
			// Focus on the last input
			const $lastInput = this.$el.find('input.email-address').last();
			$lastInput.focus();

			// Enable the add button if there are valid entries
			this.manageAddButton();
			this.model.trigger('add:emailAddressData');
		});
	}

	removeEmailAddressBlock($block) {
		// Find the index of the block to remove
		const index = this.$el.find('div.email-address-block').index($block);

		// Remove the block from the DOM
		$block.remove();

		// Remove the corresponding data from emailAddressData in the model
		const emailAddressData = this.model.get(this.dataFieldName) || [];
		emailAddressData.splice(index, 1);

		this.model.set(this.dataFieldName, emailAddressData);

		// If the primary email was removed, adjust the primary flag
		if (emailAddressData.length && !emailAddressData.some(item => item.primary)) {
			emailAddressData[0].primary = true;
		}

		// Re-render to update the view
		this.reRender();
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
		}).then((view: SelectRecordsView) => {
			view.render();

			this.listenToOnce(view, 'select', (model: Model) => {
				const emailAddressData = this.model.get(this.dataFieldName) || [];
				emailAddressData[index] = {
					...emailAddressData[index],
					accountId: model.id,
					accountName: model.get('name'),
				};
				this.model.set('emailAddressData', emailAddressData);
				this.model.trigger('change:' + this.dataFieldName);
				this.reRender();
			});
		});
	}

	clearAccount(index: number): void {
		const emailAddressData = this.model.get(this.dataFieldName) || [];
		emailAddressData[index] = {
			...emailAddressData[index],
			accountId: null,
			accountName: null,
		};

		this.model.set(this.dataFieldName, emailAddressData);
		this.model.trigger('change:' + this.dataFieldName);
		this.reRender();
	}

	copyToClipboard(index?: number): void {
		const emailAddressData = this.model.get(this.dataFieldName);
		const emailAddress = this.model.get(this.name);
		const value =
				emailAddressData != null
					? index && index !== 0
						? emailAddressData[index]?.emailAddress
						: emailAddress
					: emailAddress;

		if (value) {
			navigator.clipboard.writeText(value).then(() => {
				Espo.Ui.success(this.translate('Copied to clipboard'));
			});
		}
	}

	fetch(): Record<string, any> {
		const data = super.fetch();
		const emailAddressData = this.model.get('emailAddressData') || [];
		return {
			...data,
			emailAddressData: emailAddressData,
		};
	}

	fetchEmailAddressData(): any[] {
		const data: any[] = [];

		const $list = this.$el.find('div.email-address-block') as JQuery;
		const emailAddressData = this.model.get(this.dataFieldName) || [];
		if ($list.length) {
			$list.each((i, d) => {
				const $d = $(d);

				const row = emailAddressData[i] || {};

				row.emailAddress = (($d.find('input.email-address').val() ?? '') as string).trim();

				if (row.emailAddress === '') {
					return;
				}

				row.primary = $d.find('button[data-property-type="primary"]').hasClass('active');
				row.optOut = $d.find('button[data-property-type="optOut"]').hasClass('active');
				row.invalid = $d.find('button[data-property-type="invalid"]').hasClass('active');
				row.lower = row.emailAddress.toLowerCase();
				// AccountId and accountName are preserved from the model

				data.push(row);
			});
		}

		return data;
	}

	afterRender() {
		const minChars = this.params.autocompleteMinChars;

		if (minChars !== undefined && minChars !== null) {
			Autocomplete.optionsOverrides ??= {};
			const prev = Autocomplete.optionsOverrides.minChars;
			Autocomplete.optionsOverrides.minChars = minChars;

			try {
				super.afterRender();
			} finally {
				Autocomplete.optionsOverrides.minChars = prev;
			}

			return;
		}

		super.afterRender();
	}
});
