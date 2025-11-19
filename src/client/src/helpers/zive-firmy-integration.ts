type AresEconomicSubject = {
	obchodniJmeno: string;
	ico: string;
	dic?: string;
	ulice?: string;
	cislo?: string | number;
	obec?: string;
	psc?: string;
	cast_obce?: string;
	[key: string]: unknown;
};

type AresSuggestResponse = {
	ekonomickeSubjekty: AresEconomicSubject[];
};

type ZiveFirmyMetricItem = {
	ROK: number | string;
	HODNOTA: number | string;
	KOD: string;
};

type ZiveFirmyLookupResponse = {
	ADRESA?: boolean | string | number;
	ULICE?: string;
	CISLO?: string;
	OBEC?: string;
	PSC?: string;
	CAST_OBCE?: string;
	PocetZamestnancu?: ZiveFirmyMetricItem[];
	Obrat?: ZiveFirmyMetricItem[];
	[key: string]: unknown;
};

define(['ui/autocomplete'], (Autocomplete: any) =>
	class extends Autocomplete {
		static setupNameAutocomplete(fieldView: any, options: { sicCodeField: string; vatIdField: string }): void {
			if (!fieldView.getConfig().get('ziveFirmyEnabled')) {
				return;
			}

			if (!(fieldView.isEditMode() || fieldView.isSearchMode())) {
				return;
			}

			const element = fieldView.$element.get(0) as HTMLInputElement | undefined;
			if (!element) {
				console.error('[ZiveFirmy] No DOM element found, cannot create autocomplete!');
				return;
			}

			const autocomplete = new Autocomplete(element, {
				name: fieldView.name,
				triggerSelectOnValidInput: true,
				autoSelectFirst: true,
				handleFocusMode: 1,
				focusOnSelect: true,
				onSelect: (selected: { attributes: AresEconomicSubject }) => {
					const attributes = selected.attributes;

					fieldView.model.set(options.sicCodeField, attributes.ico);
					fieldView.model.set(options.vatIdField, attributes.dic);
				},
				lookupFunction: async (query: string) => {
					const url = `Ares/suggest/${query}`;

					try {
						const list: Array<{ value: string; attributes: AresEconomicSubject }> = [];
						const raw = (await Espo.Ajax.getRequest(url)) as unknown;
						const responseParsed: AresSuggestResponse =
							typeof raw === 'string'
								? (JSON.parse(raw) as AresSuggestResponse)
								: (raw as AresSuggestResponse);
						responseParsed.ekonomickeSubjekty.forEach((item: AresEconomicSubject) => {
							list.push({
								value: item.obchodniJmeno,
								attributes: item,
							});
						});

						return list;
					} catch (error) {
						console.error('[ZiveFirmy] API request failed:', error);
						return [];
					}
				},
				minChars: 2,
			});

			fieldView.once('render remove', () => {
				autocomplete.dispose();
			});
		}

		static setupSicCodeListener(
			fieldView: any,
			options: {
				addressStreetField: string;
				addressCityField: string;
				addressPostalCodeField: string;
				addressStateField: string;
				turnoverInfoField?: string;
				employeeInfoField?: string;
			},
		): void {
			fieldView.listenTo(fieldView.model, 'change:' + fieldView.name, () =>
				this.onSicCodeChange(fieldView, options),
			);
		}

		static async onSicCodeChange(
			fieldView: any,
			options: {
				addressStreetField: string;
				addressCityField: string;
				addressPostalCodeField: string;
				addressStateField: string;
				turnoverInfoField?: string;
				employeeInfoField?: string;
			},
		): Promise<void> {
			const sicCode = fieldView.model.get(fieldView.name);
			if (!sicCode || !fieldView.getConfig().get('ziveFirmyEnabled')) {
				return;
			}

			try {
				const raw = (await Espo.Ajax.getRequest(`ZiveFirmy/lookup/${sicCode}`)) as unknown;
				const response: ZiveFirmyLookupResponse =
					typeof raw === 'string'
						? (JSON.parse(raw) as ZiveFirmyLookupResponse)
						: (raw as ZiveFirmyLookupResponse);

				if (
					fieldView.getConfig().get('aresEnabled') &&
					typeof fieldView.actionFillFromProvider === 'function'
				) {
					fieldView.actionFillFromProvider('Ares');
				}

				if (response.ADRESA) {
					fieldView.model.set(
						options.addressStreetField,
						(response.ULICE || '') + ' ' + (response.CISLO || ''),
					);
					fieldView.model.set(options.addressCityField, response.OBEC || '');
					fieldView.model.set(options.addressPostalCodeField, response.PSC || '');

					// Set part of city if available
					if (response.CAST_OBCE && response.CAST_OBCE !== response.OBEC) {
						fieldView.model.set(options.addressStateField, response.CAST_OBCE);
					}
				}

				if (options.employeeInfoField && Array.isArray(response.PocetZamestnancu)) {
					const employeeInfo: Record<string, { count: number | string; code: string }> = {};
					response.PocetZamestnancu.forEach((item: ZiveFirmyMetricItem) => {
						if (!item || !item.ROK) return;
						employeeInfo[String(item.ROK)] = {
							count: item.HODNOTA,
							code: item.KOD,
						};
					});
					fieldView.model.set(options.employeeInfoField, employeeInfo);
				}

				if (options.turnoverInfoField && Array.isArray(response.Obrat)) {
					const turnoverInfo: Record<string, { value: number | string; code: string }> = {};
					response.Obrat.forEach((item: ZiveFirmyMetricItem) => {
						if (!item || !item.ROK) return;
						turnoverInfo[String(item.ROK)] = {
							value: item.HODNOTA,
							code: item.KOD,
						};
					});
					fieldView.model.set(options.turnoverInfoField, turnoverInfo);
				}
			} catch (error) {
				console.error('[ZiveFirmy] ZiveFirmy API request failed:', error);
			}
		}
	});
