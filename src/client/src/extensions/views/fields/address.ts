import type { UiSelectModule, FieldAutoFillMixin } from '../../../@types/ui-modules';

import type AddressFieldView from 'espocrm/src/views/fields/address';

type AddressData = {
	street?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
};

type AddressFieldData = {
	copyToClipboard?: boolean;
	countryValue?: string;
	countryAsEnum?: boolean;
	countryOptions?: string[];
	countryTranslatedOptions?: Record<string, string>;
	countryStyleMap?: Record<string, string>;
	[key: string]: unknown;
};

extend<AddressFieldView>(['ui/select', 'viacrm:helpers/field-auto-fill'], (Dep, Select: UiSelectModule, FieldAutoFill: FieldAutoFillMixin) => class extends Dep {
	countryAsEnum: boolean = false;
	detailTemplate: string = 'viacrm:fields/address/detail';
	editTemplate: string = 'viacrm:fields/address/edit';
	editTemplate1: string = 'viacrm:fields/address/edit-1';
	editTemplate2: string = 'viacrm:fields/address/edit-2';
	editTemplate3: string = 'viacrm:fields/address/edit-3';
	editTemplate4: string = 'viacrm:fields/address/edit-4';

	setup(): void {
		super.setup();

		if (this.isDetailMode()) {
			if (this.params.copyToClipboard) {
				this.events['click [data-action="copyToClipboard"]'] = (e: JQuery.ClickEvent) => {
					const value = $(e.currentTarget).data('copyvalue') as string;
					this.copyToClipboard(value);
				};
			}
		}

		// Apply auto-fill helper
		Object.assign(this, FieldAutoFill);
		this.setupAutoFill();
	}

	copyToClipboard(value: string): void {
		navigator.clipboard.writeText(value).then(() => {
			Espo.Ui.success(this.translate('Copied to clipboard'));
		});
	}

	isAddressFieldsEmpty(): boolean {
		const fields = [this.streetField, this.cityField, this.stateField, this.postalCodeField];

		for (const field of fields) {
			const value = this.model.get(field);
			if (value && value.trim() !== '') {
				return false;
			}
		}

		return true;
	}

	init(): void {
		super.init();

		this.countryAsEnum = this.getConfig().get('addressCountryAsEnum') ?? false;
	}

	data(): AddressFieldData {
		const data: AddressFieldData = super.data();

		data.copyToClipboard = this.params.copyToClipboard;

		if (!this.countryAsEnum) {
			return data;
		} else {
			const countryOptions = Espo.Utils.clone(this.getConfig().get('addressCountryList') || []) as string[];

			countryOptions.push('');

			const countryValue = data.countryValue;

			const countryStyleMap: Record<string, string> = {};

			if (countryValue && !countryOptions.includes(countryValue)) {
				countryStyleMap[countryValue] = 'danger';
			}

			return {
				...data,
				countryAsEnum: true,
				countryOptions: this.getConfig().get('addressCountryList') || [],
				countryTranslatedOptions: this.getLanguage().get('Global', 'options', 'addressCountryList') || {},
				countryStyleMap,
			};
		}
	}

	afterRender(): void {
		super.afterRender();

		if (this.countryAsEnum) {
			if (this.$country) {
				Select.init(this.$country, { matchAnyWord: true });
			}
		}

		if (this.isEditMode()) {
			this.addRelationFillButtons();
		} else {
			this.removeRelationFillButtons();
		}
	}

	removeRelationFillButtons(): void {
		const $cell = this.get$cell();
		$cell.find('.fill-from-relation-link').remove();
	}

	addRelationFillButtons(): void {
		if (!this.relations.length) {
			return;
		}

		const $cell = this.get$cell();

		$cell.find('.fill-from-relation-link').remove();

		for (const relation of this.relations) {
			// Special handling for organization relation
			if (relation === 'organization') {
				const $button = this.createFillFromLink('Fill from Organization', () => {
					this.fillFromOrganization();
				}, 'Global');

				$button.addClass('fill-from-relation-link');
				$cell.prepend($button);
				continue;
			}

			const entityType = this.getMetadata().get(['entityDefs', this.model.entityType, 'links', relation, 'entity']);
			if (!entityType) continue;

			const label = 'Fill from ' + entityType;

			const $button = this.createFillFromLink(label, () => {
				this.fillFromRelation(relation, entityType);
			}, 'Global');

			$button.addClass('fill-from-relation-link');
			$cell.prepend($button);
		}
	}

	createFillFromLink(label: string, handler: () => void, scope: string = 'Global'): JQuery {
		const $el = $('<a>')
			.attr('role', 'button')
			.attr('tabindex', '-1')
			.addClass('pull-right fill-from-link')
			.attr('title', this.translate(label, 'labels', scope))
			.text(this.translate(label, 'labels', scope));

		$el.on('click', handler);

		return $el;
	}

	mapAddressDataToFields(addressData: AddressData): Record<string, string> {
		const data: Record<string, string> = {};
		data[this.streetField] = addressData.street || '';
		data[this.cityField] = addressData.city || '';
		data[this.stateField] = addressData.state || '';
		data[this.countryField] = addressData.country || '';
		data[this.postalCodeField] = addressData.postalCode || '';
		return data;
	}

	get$cell(): JQuery {
		return this.$el.closest('.cell');
	}

	getCopyClipboardFieldValue(value: string): string {
		if (!this.params.copyToClipboard) {
			return '';
		}
		return (
			'<a role="button" data-action="copyToClipboard" class="text-soft" data-copyvalue="' +
				value +
				'" title="' +
				this.translate('Copy to Clipboard') +
				'"><span class="far fa-copy"></span></a>'
		);
	}

	getFormattedAddress1(): string {
		if (!this.countryAsEnum) {
			return super.getFormattedAddress1();
		} else {
			const postalCodeValue = this.stripTags(this.model.get(this.postalCodeField));
			const streetValue = this.stripTags(this.model.get(this.streetField));
			const cityValue = this.stripTags(this.model.get(this.cityField));
			const stateValue = this.stripTags(this.model.get(this.stateField));
			const countryValue = this.stripTags(
				this.getLanguage().translateOption(
					this.model.get(this.countryField),
					'addressCountryList',
					'Global',
				),
			);

			let html = '';

			if (streetValue) {
				html += streetValue + this.getCopyClipboardFieldValue(streetValue);
			}

			if (cityValue || stateValue || postalCodeValue) {
				if (html !== '') {
					html += '\n';
				}

				let line = '';
				if (cityValue) {
					line += cityValue;
				}

				if (stateValue) {
					if (cityValue) {
						line += ', ';
					}
					line += stateValue;
				}

				if (postalCodeValue) {
					if (cityValue || stateValue) {
						line += ' ';
					}
					line += postalCodeValue;
				}

				html += line + this.getCopyClipboardFieldValue(line);
			}
			if (countryValue) {
				if (html !== '') {
					html += '\n';
				}

				html += countryValue + this.getCopyClipboardFieldValue(countryValue);
			}

			return html;
		}
	}

	getFormattedAddress2(): string {
		if (!this.countryAsEnum) {
			return super.getFormattedAddress2();
		} else {
			const postalCodeValue = this.stripTags(this.model.get(this.postalCodeField));
			const streetValue = this.stripTags(this.model.get(this.streetField));
			const cityValue = this.stripTags(this.model.get(this.cityField));
			const stateValue = this.stripTags(this.model.get(this.stateField));
			const countryValue = this.stripTags(
				this.getLanguage().translateOption(
					this.model.get(this.countryField),
					'addressCountryList',
					'Global',
				),
			);

			let html = '';

			if (streetValue) {
				html += streetValue + this.getCopyClipboardFieldValue(streetValue);
			}

			if (cityValue || postalCodeValue) {
				if (html !== '') {
					html += '\n';
				}

				let line = '';
				if (postalCodeValue) {
					line += postalCodeValue;

					if (cityValue) {
						line += ' ';
					}
				}

				if (cityValue) {
					line += cityValue;
				}

				html += line + this.getCopyClipboardFieldValue(line);
			}

			if (stateValue || countryValue) {
				if (html !== '') {
					html += '\n';
				}

				let line = '';
				if (stateValue) {
					line += stateValue;

					if (countryValue) {
						line += ' ';
					}
				}

				if (countryValue) {
					line += countryValue;
				}

				html += line + this.getCopyClipboardFieldValue(line);
			}

			return html;
		}
	}

	getFormattedAddress3(): string {
		if (!this.countryAsEnum) {
			return super.getFormattedAddress3();
		} else {
			const postalCodeValue = this.stripTags(this.model.get(this.postalCodeField));
			const streetValue = this.stripTags(this.model.get(this.streetField));
			const cityValue = this.stripTags(this.model.get(this.cityField));
			const stateValue = this.stripTags(this.model.get(this.stateField));
			const countryValue = this.stripTags(
				this.getLanguage().translateOption(
					this.model.get(this.countryField),
					'addressCountryList',
					'Global',
				),
			);

			let html = '';

			if (countryValue) {
				html += countryValue + this.getCopyClipboardFieldValue(countryValue);
			}

			if (cityValue || stateValue || postalCodeValue) {
				if (html !== '') {
					html += '\n';
				}

				let line = '';
				if (postalCodeValue) {
					line += postalCodeValue;
				}

				if (stateValue) {
					if (postalCodeValue) {
						line += ' ';
					}
					line += stateValue;
				}

				if (cityValue) {
					if (postalCodeValue || stateValue) {
						line += ' ';
					}
					line += cityValue;
				}

				html += line + this.getCopyClipboardFieldValue(line);
			}
			if (streetValue) {
				if (html !== '') {
					html += '\n';
				}

				html += streetValue + this.getCopyClipboardFieldValue(streetValue);
			}

			return html;
		}
	}

	getFormattedAddress4(): string {
		if (!this.countryAsEnum) {
			return super.getFormattedAddress4();
		} else {
			const postalCodeValue = this.stripTags(this.model.get(this.postalCodeField));
			const streetValue = this.stripTags(this.model.get(this.streetField));
			const cityValue = this.stripTags(this.model.get(this.cityField));
			const stateValue = this.stripTags(this.model.get(this.stateField));
			const countryValue = this.stripTags(
				this.getLanguage().translateOption(
					this.model.get(this.countryField),
					'addressCountryList',
					'Global',
				),
			);

			let html = '';

			if (streetValue) {
				html += streetValue + this.getCopyClipboardFieldValue(streetValue);
			}

			if (cityValue) {
				if (html !== '') {
					html += '\n';
				}

				html += cityValue + this.getCopyClipboardFieldValue(cityValue);
			}

			if (countryValue || stateValue || postalCodeValue) {
				if (html !== '') {
					html += '\n';
				}

				let line = '';
				if (countryValue) {
					line += countryValue;
				}

				if (stateValue) {
					if (countryValue) {
						line += ' - ';
					}

					line += stateValue;
				}

				if (postalCodeValue) {
					if (countryValue || stateValue) {
						line += ' ';
					}

					line += postalCodeValue;
				}

				html += line + this.getCopyClipboardFieldValue(line);
			}

			return html;
		}
	}

	fillFromOrganization(): void {
		const { model } = this;

		// Get organization address field name from metadata or params (default: companyBillingAddress)
		const fieldDef = this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.name]);
		const organizationAddressField = fieldDef?.organizationAddressField || this.params.organizationAddressField || 'companyBillingAddress';

		// Try to get complete address from client-side config
		let organizationAddress: AddressData | null = this.getConfig().get(organizationAddressField) as AddressData | null;

		// If not available as complete address, build from individual components
		if (!organizationAddress) {
			const streetField = organizationAddressField + 'Street';
			const cityField = organizationAddressField + 'City';
			const stateField = organizationAddressField + 'State';
			const countryField = organizationAddressField + 'Country';
			const postalCodeField = organizationAddressField + 'PostalCode';

			const street = this.getConfig().get(streetField) as string | undefined;
			const city = this.getConfig().get(cityField) as string | undefined;
			const state = this.getConfig().get(stateField) as string | undefined;
			const country = this.getConfig().get(countryField) as string | undefined;
			const postalCode = this.getConfig().get(postalCodeField) as string | undefined;

			// If at least one component exists, create address object
			if (street || city || state || country || postalCode) {
				organizationAddress = {
					street: street || '',
					city: city || '',
					state: state || '',
					country: country || '',
					postalCode: postalCode || ''
				};
			}
		}

		if (!organizationAddress) {
			// Show a user-friendly message about the missing settings
			Espo.Ui.error(this.translate('Organization address field "{field}" not found in settings. Please configure it in Administration > Settings.', 'messages', 'Global').replace('{field}', organizationAddressField));
			return;
		}

		// Map organization address to current field
		model.set(this.mapAddressDataToFields(organizationAddress));
		Espo.Ui.success(this.translate('Done'));
	}

	stripTags(text: unknown): string {
		const textStr = String(text || '');
		return Handlebars.Utils.escapeExpression(textStr.replace(/<\/?[^>]+(>|$)/g, ''));
	}
});
