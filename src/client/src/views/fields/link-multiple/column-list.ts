type ColumnDef = {
	type: string;
	field: string;
	scope: string;
	view?: string;
	required?: boolean;
	default?: unknown;
	options?: string[];
	[key: string]: unknown;
};

type LinkDefs = {
	entity: string;
	[key: string]: unknown;
};

type FieldDefs = {
	columnListLink?: string;
	columnListForeign?: string;
	columns?: Record<string, string>;
	[key: string]: unknown;
};

type ColumnRecord = {
	id: string;
	name: string;
	parentEntityId?: string | null;
	parentEntityName?: string | null;
	columns: Record<string, unknown>;
	[key: string]: unknown;
};

type FieldView = {
	model: {
		attributes: Record<string, unknown>;
		get(attr: string): unknown;
		set(attr: string | Record<string, unknown>, value?: unknown): void;
	};
	name: string;
	autoNumericOptions?: unknown;
	render(): Promise<void>;
	validate?(): boolean;
	validations?: string[];
};

type LinkMultipleFieldView = {
	name: string;
	model: {
		name: string;
		get(attribute: string): unknown;
		set(attributes: Record<string, unknown>, options?: { silent?: boolean }): void;
		trigger(event: string): void;
	};
	scope: string;
	foreignScope: string;
	parentScope?: string;
	mode: string;
	ids: string[];
	nameHash: Record<string, string>;
	columns: ColumnRecord[];
	idsName: string;
	nameHashName: string;
	_autocompleteList?: Array<{ dispose(): void }>;
	$el: JQuery;
	isSearchMode(): boolean;
	isEditMode(): boolean;
	isDetailMode(): boolean;
	isRequired(): boolean;
	getSearchParamsData(): { nameHash?: Record<string, string>; idList?: string[] };
	searchParams: { nameHash?: Record<string, string>; value?: string[] };
	getMetadata(): { get(path: string[]): unknown };
	getLanguage(): { translateOption(value: string, field: string, scope: string): string; translate(...args: unknown[]): string };
	getHelper(): { numberUtil: { formatFloat(value: number, decimals: number): string; formatInt(value: number, decimals: number): string }; escapeString(value: string): string };
	getModelFactory(): { create(type: string): Promise<{ name: string; entityType: string; defs: unknown; attributes: Record<string, unknown>; set(attrs: Record<string, unknown>): void; get(attr: string): unknown }> };
	addActionHandler(action: string, handler: (e: JQuery.TriggeredEvent) => void): void;
	listenTo(target: unknown, event: string, handler: (...args: unknown[]) => void): void;
	on(event: string, handler: (...args: unknown[]) => void, context: unknown): void;
	once(event: string, handler: () => void, context?: unknown): void;
	trigger(event: string, ...args: unknown[]): void;
	actionSelect(): void;
	deleteLinkHtml(id: string): void;
	afterDeleteLink(id: string): void;
	afterAddLink(id: string): void;
	reRender(): void;
	hasView(key: string): boolean;
	getView(key: string): { model: { get(attr: string): unknown }; name: string; validate?(): boolean; validations?: string[] } | undefined;
	clearView(key: string): void;
	createView(key: string, viewName: string, options: Record<string, unknown>): Promise<{
		model: { attributes: Record<string, unknown>; get(attr: string): unknown; set(attr: string, value: unknown): void };
		name: string;
		autoNumericOptions?: unknown;
		render(): Promise<void>;
	}>;
	showValidationMessage(msg: string): void;
	getLabelText(): string;
	translate(...args: unknown[]): string;
	getIconHtml(id: string): string;
	events: Record<string, (e: JQuery.TriggeredEvent) => void>;
};

define(['ui/autocomplete'], Autocomplete => class {
	linkMultiple: LinkMultipleFieldView;
	columnsName: string = 'columnList';
	columnsDefs: Record<string, ColumnDef> = {};

	/** @const */
	COLUMN_TYPE_VARCHAR = ['varchar', 'text'];
	/** @const */
	COLUMN_TYPE_ENUM = ['enum'];
	/** @const */
	COLUMN_TYPE_BOOL = ['bool'];
	/** @const */
	COLUMN_TYPE_INT = ['int'];
	/** @const */
	COLUMN_TYPE_FLOAT = ['float', 'currency'];

	constructor(linkMultiple: LinkMultipleFieldView) {
		this.linkMultiple = linkMultiple;
	}

	setup() {
		this.linkMultiple.addActionHandler('selectLink', e => {
			const $button = $(e.target).closest('[data-action="selectLink"]');
			if ($button.attr('data-scope') === 'root-link-select') {
				this.linkMultiple.actionSelect();
			}
		});

		this.linkMultiple.nameHashName = this.linkMultiple.name + 'Names';
		this.linkMultiple.idsName = this.linkMultiple.name + 'Ids';
		this.columnsName = this.linkMultiple.name + 'ColumnList';

		this.linkMultiple.ids = [];
		this.linkMultiple.nameHash = {};
		this.linkMultiple.columns = [];

		const fieldDefs = this.linkMultiple
			.getMetadata()
			.get(['entityDefs', this.linkMultiple.model.name, 'fields', this.linkMultiple.name]) as FieldDefs | undefined;
		const linkDefs = this.linkMultiple
			.getMetadata()
			.get(['entityDefs', this.linkMultiple.model.name, 'links', this.linkMultiple.name]) as LinkDefs;
		this.linkMultiple.foreignScope = linkDefs.entity;

		const columnListLink = fieldDefs?.columnListLink;
		const columnListForeign = fieldDefs?.columnListForeign;

		this.columnsDefs = {
			linkedEntity: {
				type: 'link',
				field: 'linkedEntity',
				scope: (this.linkMultiple
					.getMetadata()
					.get(['entityDefs', this.linkMultiple.model.name, 'links', this.linkMultiple.name, 'entity']) as string) || '',
				view: 'views/fields/link',
			},
		};

		if (columnListLink && columnListForeign) {
			const parentLinkDefs = this.linkMultiple
				.getMetadata()
				.get(['entityDefs', this.linkMultiple.model.name, 'links', columnListLink]) as LinkDefs;
			const parentEntityType = parentLinkDefs.entity;
			const targetLinkDefs = this.linkMultiple
				.getMetadata()
				.get(['entityDefs', parentEntityType, 'links', columnListForeign]) as LinkDefs;

			this.linkMultiple.parentScope = parentEntityType;
			this.linkMultiple.scope = targetLinkDefs.entity;

			const parentFieldDefs = this.linkMultiple
				.getMetadata()
				.get(['entityDefs', parentEntityType, 'fields', columnListForeign]) as FieldDefs | undefined;

			if (parentFieldDefs?.columns) {
				const additionalColumns: Record<string, ColumnDef> = {
					parentEntity: {
						type: 'link',
						field: 'parentEntity',
						scope: parentEntityType,
						view: 'views/fields/link',
					},
				};
				Object.entries(parentFieldDefs.columns).forEach(([columnName, columnField]) => {
					const fieldDef = this.linkMultiple
						.getMetadata()
						.get(['entityDefs', this.linkMultiple.scope, 'fields', columnField]) as (ColumnDef & { field?: string }) | undefined;

					if (fieldDef) {
						additionalColumns[columnName] = {
							...(fieldDef as ColumnDef),
							field: columnField as string,
							scope: this.linkMultiple.scope,
						};
					}
				});
				this.columnsDefs = { ...this.columnsDefs, ...additionalColumns };
			}
		} else {
			this.linkMultiple.scope = this.linkMultiple.foreignScope;

			if (fieldDefs?.columns) {
				const additionalColumns: Record<string, ColumnDef> = {};
				Object.entries(fieldDefs.columns).forEach(([columnName, columnField]) => {
					const fieldDef = this.linkMultiple
						.getMetadata()
						.get(['entityDefs', this.linkMultiple.scope, 'fields', columnField]) as (ColumnDef & { field?: string }) | undefined;

					if (fieldDef) {
						additionalColumns[columnName] = {
							...(fieldDef as ColumnDef),
							field: columnField as string,
							scope: this.linkMultiple.scope,
						};
					}
				});
				this.columnsDefs = { ...this.columnsDefs, ...additionalColumns };
			}
		}

		if (this.linkMultiple.isSearchMode()) {
			const nameHash =
					this.linkMultiple.getSearchParamsData().nameHash || this.linkMultiple.searchParams.nameHash || {};
			const idList =
					this.linkMultiple.getSearchParamsData().idList || this.linkMultiple.searchParams.value || [];
			this.linkMultiple.nameHash = (window as any).Espo.Utils.clone(nameHash);
			this.linkMultiple.ids = (window as any).Espo.Utils.clone(idList);
		} else {
			this.copyValuesFromModel();
		}

		this.linkMultiple.listenTo(this.linkMultiple.model, 'change:' + this.linkMultiple.idsName, () => {
			this.copyValuesFromModel();
		});

		if (this.linkMultiple.isEditMode() || this.linkMultiple.isDetailMode()) {
			this.linkMultiple.events['click a[data-action="toggleBoolColumn"]'] = e => {
				const id = $(e.currentTarget).data('id');
				const column = $(e.currentTarget).data('column');
				this.toggleBoolColumn(id, column);
			};
		}

		this.linkMultiple.on('render', this.disposeColumnAutocompletes, this);
		this.linkMultiple.once('remove', this.disposeColumnAutocompletes, this);
	}

	copyValuesFromModel() {
		const currentColumns = (this.linkMultiple.model.get(this.columnsName) as ColumnRecord[]) || [];

		this.linkMultiple.ids = [];
		this.linkMultiple.nameHash = {};
		this.linkMultiple.columns = [];

		currentColumns.forEach((record: ColumnRecord) => {
			if (record.id) {
				this.linkMultiple.ids.push(record.id);
				this.linkMultiple.nameHash[record.id] = record.name;
				this.linkMultiple.columns.push(record);
			}
		});
	}

	toggleBoolColumn(id, column) {
		const record = this.linkMultiple.columns.find(item => item.id === id);
		if (record) {
			record[column] = !record[column];
			this.linkMultiple.reRender();
		}
	}

	/** @inheritDoc */
	getAttributeList(attributeList) {
		return [...attributeList, this.linkMultiple.name + 'Columns'];
	}

	formatColumnValue(value, type, column) {
		if (value === null || value === undefined) {
			return '';
		}

		if (this.COLUMN_TYPE_FLOAT.includes(type)) {
			return this.linkMultiple.getHelper().numberUtil.formatFloat(value, 2);
		}

		if (this.COLUMN_TYPE_INT.includes(type)) {
			return this.linkMultiple.getHelper().numberUtil.formatInt(value, 0);
		}

		if (this.COLUMN_TYPE_ENUM.includes(type)) {
			const columnDef = this.columnsDefs[column];
			if (columnDef) {
				return this.linkMultiple
					.getLanguage()
					.translateOption(value, columnDef.field, columnDef.scope);
			}
		}

		return value;
	}

	getDetailLinkHtml(id, name = '') {
		name = name || this.linkMultiple.nameHash[id] || id;

		const $a = $('<a>')
			.attr('href', '#' + this.linkMultiple.foreignScope + '/view/' + id)
			.attr('data-id', id)
			.text(name);
		const $el = $('<div>').append($a);
		const columnEntry = this.linkMultiple.columns.find(column => column.id === id);

		if (columnEntry?.columns) {
			Object.entries(columnEntry.columns).forEach(([columnName, value]) => {
				if (this.columnsDefs[columnName]) {
					const type = this.columnsDefs[columnName].type;
					const displayValue = this.formatColumnValue(value, type, columnName);

					if (displayValue != null && displayValue !== '') {
						$el.append(
							$('<span>').text(' '),
							$('<span>').addClass('text-muted middle-dot'),
							$('<span>').text(' '),
							$('<span>').text(displayValue).addClass('text-muted small'),
						);
					}
				}
			});
		}

		return $el.get(0)?.innerHTML;
	}

	/** @inheritDoc */
	deleteLink(id) {
		this.linkMultiple.trigger('delete-link', id);
		this.linkMultiple.trigger('delete-link:' + id);

		this.linkMultiple.deleteLinkHtml(id);

		const index = this.linkMultiple.ids.indexOf(id);

		if (index > -1) {
			this.linkMultiple.ids.splice(index, 1);
		}

		Object.keys(this.columnsDefs).forEach(column => {
			const viewKey = column + '-' + id;
			if (this.linkMultiple.hasView(viewKey)) {
				this.linkMultiple.clearView(viewKey);
			}
		});

		delete this.linkMultiple.nameHash[id];
		this.linkMultiple.columns = this.linkMultiple.columns.filter(item => item.id !== id);

		this.linkMultiple.afterDeleteLink(id);

		this.linkMultiple.trigger('change');
	}

	initAutocomplete(id) {
		if (!this.linkMultiple._autocompleteList) {
			this.linkMultiple._autocompleteList = [];
		}

		Object.keys(this.columnsDefs).forEach(column => {
			const columnDef = this.columnsDefs[column];

			if (!columnDef || !this.COLUMN_TYPE_VARCHAR.includes(columnDef.type)) {
				return;
			}

			const options = columnDef.options;
			if (!(options && options.length)) {
				return;
			}

			const $element = this.linkMultiple.$el.find(`[data-column="${column}"][data-id="${id}"]`);
			if (!$element.length) {
				return;
			}

			const element = $element.get(0) as HTMLInputElement | undefined;
			if (!element) {
				return;
			}

			const autocomplete = new Autocomplete(element, {
				name: this.linkMultiple.name + 'Column' + id,
				triggerSelectOnValidInput: true,
				autoSelectFirst: true,
				handleFocusMode: 1,
				focusOnSelect: true,
				onSelect: () => {
					this.linkMultiple.trigger('change');
					$element.trigger('change');
				},
				lookup: options,
			});

			this.linkMultiple._autocompleteList?.push(autocomplete);
			this.linkMultiple.once('delete-link:' + id, () => autocomplete.dispose());
		});
	}

	disposeColumnAutocompletes() {
		if (this.linkMultiple._autocompleteList && this.linkMultiple._autocompleteList.length) {
			this.linkMultiple._autocompleteList.forEach(autocomplete => {
				autocomplete.dispose();
			});
			this.linkMultiple._autocompleteList = [];
		}
	}

	validateRequired() {
		let isValid = true;

		// First check if the link field itself is required
		if (this.linkMultiple.isRequired()) {
			if (!this.linkMultiple.ids.length) {
				const msg = this.linkMultiple
					.translate('fieldIsRequired', 'messages')
					.replace('{field}', this.linkMultiple.getLabelText());
				this.linkMultiple.showValidationMessage(msg);
				return true;
			}
		}

		// Then validate all field views
		this.linkMultiple.ids.forEach(id => {
			Object.entries(this.columnsDefs).forEach(([column]) => {
				const view = this.linkMultiple.getView(column + '-' + id);
				if (view && view.validate) {
					// Call validate on the field view
					const validationError = view.validate();
					if (validationError) {
						isValid = false;
					}
				}
			});
		});

		return !isValid;
	}

	validate(parentValidation) {
		let isValid = true;
		if (parentValidation) {
			return true;
		}

		// Validate required
		const requiredError = this.validateRequired();
		if (requiredError) {
			return true;
		}

		// Validate each field view
		this.linkMultiple.ids.forEach(id => {
			Object.entries(this.columnsDefs).forEach(([column]) => {
				const view = this.linkMultiple.getView(column + '-' + id);
				if (view) {
					// Run all validations defined in the field view
					if (view.validations) {
						view.validations.forEach(validation => {
							if (typeof view[validation] === 'function') {
								const validationError = view[validation]();
								if (validationError) {
									isValid = false;
								}
							}
						});
					}
				}
			});
		});

		return !isValid;
	}

	validateColumnRequiredFields(ids: string[]) {
		for (const id of ids) {
			const columns = this.linkMultiple.columns[id] || {};

			for (const [columnName, columnDef] of Object.entries(this.columnsDefs)) {
				if (
				// @ts-ignore oof
					columnDef.required &&
						(!(columnName in columns) || columns[columnName] === null || columns[columnName] === '')
				) {
					const msg = this.linkMultiple
						.translate('fieldIsRequired', 'messages')
						.replace(
							'{field}',
							this.linkMultiple.translate(columnName, 'fields', this.linkMultiple.model.name),
						);
					this.linkMultiple.showValidationMessage(msg);
					return true;
				}
			}
		}

		return false;
	}

	fetch() {
		const data = {};
		const ids: string[] = [];
		const nameHash = {};
		const currentRecords = this.linkMultiple.columns ?? []; //this.parseRecordsFromColumns();

		this.linkMultiple.ids.forEach((id: string) => {
			ids.push(id);
			nameHash[id] = this.linkMultiple.nameHash[id];
		});

		data[this.linkMultiple.idsName] = ids;
		data[this.linkMultiple.nameHashName] = nameHash;

		data[this.columnsName] = this.linkMultiple.ids.map((id: string) => {
			const record = currentRecords.find(r => r.id === id);

			if (!record) {
				return {
					id,
					name: this.linkMultiple.nameHash[id] || '',
					columns: {},
				};
			}

			Object.keys(this.columnsDefs).forEach(columnName => {
				if (columnName.startsWith('parent') || columnName.startsWith('linkedEntity')) {
					delete record.columns[columnName];
				}

				const viewKey = `${columnName}-${id}`;
				const view = this.linkMultiple.getView(viewKey);

				if (view) {
					record.columns[columnName] = view.model.get(view.name);
				}
			});

			return record;
		});

		return data;
	}

	addLink(id: string, name: string) {
		if (!~this.linkMultiple.ids.indexOf(id)) {
			this.linkMultiple.ids.push(id);
			this.linkMultiple.nameHash[id] = name;

			const newRecord = {
				id: id,
				name: name,
				parentEntityId: null,
				parentEntityName: null,
				columns: {},
			};

			Object.entries(this.columnsDefs).forEach(([column, def]) => {
				let defaultValue = def.default;

				if (defaultValue === undefined) {
					const fieldMeta = this.linkMultiple
						.getMetadata()
						.get(['entityDefs', def.scope, 'fields', def.field]) as ColumnDef | undefined;
					defaultValue = fieldMeta?.default;
				}

				newRecord.columns[column] = defaultValue ?? null;
			});

			this.linkMultiple.columns.push(newRecord);
			this.addLinkHtml(id);
			this.linkMultiple.afterAddLink(id);

			this.linkMultiple.trigger('add-link', id);
			this.linkMultiple.trigger('add-link:' + id);
		}

		this.linkMultiple.trigger('change');
		this.linkMultiple.reRender();
	}

	addLinkHtml(id: string) {
		const $container = this.linkMultiple.$el.find('.link-container');

		if (!$container.find('table').length) {
			$container.append($('<table>').addClass('table list-row-table').append($('<tbody>')));
		}

		const record = this.linkMultiple.columns.find((record: ColumnRecord) => record.id === id);
		if (record) {
			const $row = $('<tr>').addClass('list-row link-' + id);

			Object.keys(this.columnsDefs).forEach(column => {
				const $cell = $('<td>')
					.addClass('cell')
					.attr('data-name', column)
					.append($('<div>').addClass('cell-wrapper').append(this.getColumnInput(column, record)));

				$row.append($cell);
			});

			const $actionCell = $('<td>')
				.addClass('cell action-cell')
				.attr('data-name', 'buttons')
				.append(
					$('<div>')
						.addClass('cell-wrapper')
						.append(
							$('<a>')
								.attr('role', 'button')
								.attr('tabindex', '0')
								.attr('data-id', id)
								.attr('data-action', 'clearLink')
								.addClass('remove-button')
								.append($('<span>').addClass('fas fa-times')),
						),
				);

			$row.append($actionCell);
			$container.find('tbody').append($row);
		}
	}

	data(data: Record<string, unknown>) {
		data.columnListEnabled = true;
		data.columnHeaders = Object.keys(this.columnsDefs).map((columnName: string) => {
			let query: string[] = [columnName, 'fields', this.linkMultiple.scope];
			if (columnName === 'parentEntity' && this.linkMultiple.parentScope) {
				query = [this.linkMultiple.parentScope, 'scopeNamesPlural', 'Global'];
			} else if (columnName === 'linkedEntity') {
				query = [this.linkMultiple.scope, 'scopeNamesPlural', 'Global'];
			}

			return {
				translated: this.linkMultiple.translate(...query),
				value: columnName
			};
		});

		data.hasLinks = this.linkMultiple.ids && this.linkMultiple.ids.length > 0;
		const itemDataList: unknown[] = [];
		data.itemDataList = itemDataList;

		if (this.linkMultiple.ids) {
			const records = (this.linkMultiple.model.get(this.columnsName) as ColumnRecord[]) || [];

			records.forEach(record => {
				const columnData: Record<string, unknown> = {};

				Object.keys(this.columnsDefs).forEach(column => {
					const columnDef = this.columnsDefs[column];
					if (columnDef) {
						columnData[column] = {
							name: column,
							value: record.columns?.[column],
							type: columnDef.type,
						};
					}
				});

				itemDataList.push({
					id: record.id,
					name: record.name,
					parentEntityId: record.parentEntityId,
					parentEntityName: record.parentEntityName,
					columnData,
					iconHtml: this.linkMultiple.getIconHtml(record.id),
				});
			});
		}

		return data;
	}

	afterRender() {
		if (this.linkMultiple.ids) {
			const records = (this.linkMultiple.model.get(this.columnsName) as ColumnRecord[]) || [];
			records.forEach(record => {
				Object.keys(this.columnsDefs).forEach(columnName => {
					const value = record.columns?.[columnName];
					const fieldId = `${columnName}-${record.id}`;
					const $field = this.linkMultiple.$el.find(
						`.field[data-name="${columnName}"][data-id="${record.id}"]`,
					);

					if ($field.length) {
						$field.attr('id', fieldId);
						this.getFieldView(columnName, record)
							.then(view => {
								if (value !== null && value !== undefined) {
									view.model.set(view.name, value);
								}

								view.render();
							})
							.catch(error => {
								console.error('Failed to create field view:', error);
							});
					}
				});
			});
		}
	}

	async getFieldView(columnName: string, record: ColumnRecord): Promise<FieldView> {
		const columnDef = this.columnsDefs[columnName];

		if (!columnDef) {
			throw new Error(`Column definition not found for: ${columnName}`);
		}
		const fieldId = `${columnName}-${record.id}`;
		const model = await this.linkMultiple.getModelFactory().create('Model');
		model.name = columnDef.scope;
		model.entityType = columnDef.scope;

		if (columnName === 'parentEntity') {
			model.set({
				parentEntityId: record.parentEntityId,
				parentEntityName: record.parentEntityName,
			});
		} else if (columnName === 'linkedEntity') {
			model.set({
				linkedEntityId: record.id,
				linkedEntityName: record.name,
			});
		}

		const { type, ...columnDefRest } = columnDef;
		model.defs = {
			fields: {
				[columnDef.field]: {
					type: columnDef.type,
					...columnDefRest,
				},
			},
		};

		const viewName = (this.linkMultiple.getMetadata().get(['fields', columnDef.type, 'view']) as string | undefined) ||
				'views/fields/' + columnDef.type;

		const viewOptions = {
			model: model,
			name: columnDef.field,
			mode: this.linkMultiple.mode,
			readOnly: this.linkMultiple.mode === 'detail',
			foreignScope: columnDef.scope,
			defs: {
				name: columnDef.field,
				params: columnDef,
			},
			el: `#${fieldId}`,
			inlineEditDisabled: true,
			params: {
				...columnDef,
				required: columnDef.required,
			},
			type: columnDef.type,
		};

		return new Promise<FieldView>((resolve, reject) => {
			this.linkMultiple
				.createView(`${columnName}-${record.id}`, viewName, viewOptions)
				.then(view => {
					delete view.autoNumericOptions;
					if (this.linkMultiple.isEditMode()) {
						this.linkMultiple.listenTo(view, 'change', () => {
							const currentColumns = (this.linkMultiple.model.get(this.columnsName) as ColumnRecord[]) || [];
							const recordIndex = currentColumns.findIndex(col => col.id === record.id);
							if (recordIndex === -1) {
								return;
							}
							const updatedColumns = [...currentColumns];
							const currentRecord = updatedColumns[recordIndex];
							if (!currentRecord) {
								return;
							}
							Object.entries(view.model.attributes).forEach(([attributeName, attributeValue]) => {
								if (attributeName.startsWith('parentEntity')) {
									currentRecord[attributeName] = attributeValue;
								} else {
									if (!currentRecord.columns) {
										currentRecord.columns = {};
									}
									currentRecord.columns[attributeName] = attributeValue;
								}
							});
							this.linkMultiple.model.set({ [this.columnsName]: updatedColumns });
							this.linkMultiple.columns = updatedColumns;
							this.linkMultiple.model.trigger('change:' + this.columnsName);
						});
					}
					resolve(view as FieldView);
				})
				.catch(reject);
		});
	}

	getColumnInput(columnName: string, record: ColumnRecord) {
		const fieldId = `${columnName}-${record.id}`;
		const value = record.columns[columnName];
		const $cell = $('<div>')
			.addClass('field')
			.attr('data-name', columnName)
			.attr('data-id', record.id)
			.attr('id', fieldId);

		this.getFieldView(columnName, record)
			.then(async view => {
				if (value !== null && value !== undefined) {
					view.model.set(view.name, value);
				}

				await view.render();
			})
			.catch(error => {
				console.error('[LinkMultipleWithColumns] Error creating field view:', {
					fieldId,
					value,
					error,
				});
			});

		return $cell;
	}
});
