define(['autocrm:views/account/fields/sic-code', 'autocrm:helpers/zive-firmy-integration'], (
	SicCodeFieldView: any,
	ZiveFirmyIntegration: any,
) =>
	class extends SicCodeFieldView {
		setup(): void {
			super.setup();

			// Setup ziveFirmy SIC code listener with Lead field mappings
			ZiveFirmyIntegration.setupSicCodeListener(this, {
				addressStreetField: 'addressStreet',
				addressCityField: 'addressCity',
				addressPostalCodeField: 'addressPostalCode',
				addressStateField: 'addressState',
				turnoverInfoField: 'turnoverInfo',
				employeeInfoField: 'employeeInfo',
			});
		}

		process(data: { attributes: Record<string, any> }): void {
			const includeHouseNumbers = this.getConfig().get('aresIncludeHouseNumbersInAddress') !== false;

			for (const [key, value] of Object.entries(data.attributes)) {
				if (key === 'name') {
					this.model.set('accountName', value);
					continue;
				}
				if (key === 'id') {
					this.model.set('accountId', value);
					if (key == null) {
						this.model.set('accountName', null);
					}
					continue;
				}

				if (!key.startsWith('billing')) {
					this.model.set(key, value);
					continue;
				}

				const leadField = Espo.Utils.lowerCaseFirst(key.replace('billing', ''));

				if (key === 'billingAddressStreet' && typeof value === 'string') {
					if (includeHouseNumbers) {
						// Keep house numbers in the street
						this.model.set(leadField, value);
					} else {
						// Remove house numbers from the street
						const cleanedStreet = value.replace(/\s+\d+\/?\d*$/, '').trim();
						this.model.set(leadField, cleanedStreet);
					}
				} else if (key === 'billingAddressPostalCode' && typeof value === 'string') {
					// Format the postal code as 000 00
					const formattedPostalCode = value.replace(/(\d{3})(\d{2})/, '$1 $2');
					this.model.set(leadField, formattedPostalCode);
				} else {
					this.model.set(leadField, value);
				}
			}
		}
	});
