define(['views/fields/varchar', 'ui/autocomplete'], (Dep, Autocomplete) =>
	class extends Dep {
		override getAutocompleteUrl(q: string): string {
			return `Ares/suggest/${q}`;
		}

		override transformAutocompleteResult(response: unknown): Array<{ value: string; attributes: any }> {
			const responseParsed: any = typeof response === 'string' ? JSON.parse(response) : response;

			const list: Array<{ value: string; attributes: any }> = [];

			responseParsed.ekonomickeSubjekty.forEach((item: any) => {
				list.push({
					value: item.obchodniJmeno,
					attributes: item,
				});
			});

			return list;
		}

		// We setup the autocomplete ourselves because we need to pass a custom onSelect function
		override afterRender(): void {
			super.afterRender();
			if (this.isSearchMode()) {
				const $typeSelect = this.$el && this.$el.find ? this.$el.find('select.search-type') : null;
				const type = String(($typeSelect && $typeSelect.val()) ?? 'contains');

				this.handleSearchType(type);
			}

			// Check if ZiveFirmy is enabled in settings
			if ((this.isEditMode() || this.isSearchMode()) && this.getConfig().get('ziveFirmyEnabled')) {
				const lookupFunction = async (query: string) => {
					const response = await Espo.Ajax.getRequest(this.getAutocompleteUrl(query));
					return this.transformAutocompleteResult(response);
				};

				const inputEl = this.$element ? (this.$element.get(0) as HTMLInputElement | undefined | null) : null;
				if (!inputEl) return;

				const autocomplete = new Autocomplete(inputEl, {
					name: this.name,
					triggerSelectOnValidInput: true,
					autoSelectFirst: true,
					handleFocusMode: 1,
					focusOnSelect: true,
					onSelect: (selected: any) => {
						const attributes = selected.attributes;

						// Set standard fields instead of company* fields
						this.model.set('sicCode', attributes.ico);
						this.model.set('vatId', attributes.dic);

						// Set address fields if available
						if (attributes.adresa) {
							this.model.set('addressStreet', attributes.ulice + ' ' + attributes.cislo);
							this.model.set('addressCity', attributes.obec);
							this.model.set('addressPostalCode', attributes.psc);

							// Set part of city if available
							if (attributes.cast_obce && attributes.cast_obce !== attributes.obec) {
								this.model.set('addressState', attributes.cast_obce);
							}
						}
					},
					lookupFunction: lookupFunction,
					minChars: 2, // Without this, there are unnecessary useless requests
				});

				this.once('render remove', () => autocomplete.dispose());
			}

			if (this.isSearchMode()) {
				const $typeSelect2 = this.$el && this.$el.find ? this.$el.find('select.search-type') : null;
				if ($typeSelect2) {
					$typeSelect2.on('change', () => {
						this.trigger('change');
					});
				}

				if (this.$element) {
					this.$element.on('input', () => {
						this.trigger('change');
					});
				}
			}
		}
	});
