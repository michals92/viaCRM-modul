import type FloatFieldView from 'espocrm/src/views/fields/float';
import type Model from 'espocrm/src/model';
import type { FloatWithLinkedUnitFieldData } from 'viacrm/types';

define(
	['views/fields/float'],
	(Dep: typeof FloatFieldView) => class extends Dep {
		override type = 'floatWithLinkedUnit';

		override detailTemplate = 'viacrm:fields/float-with-unit/detail';
		override editTemplate = 'viacrm:fields/float-with-linked-unit/edit';
		override listTemplate = 'viacrm:fields/float-with-unit/list';

		unitFieldName!: string;
		unitField?: string;
		unitLinkName?: string;
		declare model: Model;
		declare name: string;
		declare params: { unitField?: string; unitLinkName?: string; compact?: boolean };

		override setup(): void {
			super.setup();

			this.unitFieldName = this.name + 'Unit';

			this.unitField = this.params.unitField;
			this.unitLinkName = this.params.unitLinkName;

			if (this.unitField && this.unitLinkName) {
				this.setupDynamicUnitLoading();
			} else if (this.unitField && !this.unitLinkName) {
				this.setupLocalUnitReading();
			}
		}

		setupLocalUnitReading(): void {
			this.listenTo(this.model, 'change:' + this.unitField!, () => {
				this.loadUnitFromLocalField();
			});

			this.loadUnitFromLocalField();
		}

		loadUnitFromLocalField(): void {
			const unitValue = this.model.get(this.unitField!) as string;

			this.applyUnitValue(unitValue);
		}

		setupDynamicUnitLoading(): void {
			this.listenTo(this.model, 'change:' + this.unitLinkName + 'Id', () => {
				this.loadUnitFromLinkedEntity();
			});

			this.listenTo(this.model, 'change:' + this.unitLinkName + 'Name', () => {
				this.loadUnitFromLinkedEntity();
			});

			this.loadUnitFromLinkedEntity();
		}

		loadUnitFromLinkedEntity(): void {
			const linkedId = this.model.get(this.unitLinkName + 'Id');

			if (!linkedId) {
				this.model.set(this.unitFieldName, '', {silent: true});
				if (this.isRendered()) {
					this.reRender();
				}
				return;
			}

			const sharedAttributeName = this.unitLinkName + this.capitalizeFirst(this.unitField!);
			const preloadedUnit = this.model.get(sharedAttributeName) as string | undefined;

			if (preloadedUnit !== undefined && preloadedUnit !== null) {
				this.applyUnitValue(preloadedUnit);
				return;
			}

			console.warn('[FloatWithLinkedUnit] Unit not preloaded for field:', this.name);
		}

		capitalizeFirst(str: string): string {
			if (!str) return '';
			return str.charAt(0).toUpperCase() + str.slice(1);
		}

		fetchLinkedEntityUnit(linkedId: string): void {
			const linkedEntityType = this.model.getLinkParam(this.unitLinkName!, 'entity') as string;

			if (!linkedEntityType) {
				return;
			}

			Espo.Ajax.getRequest(`${linkedEntityType}/${linkedId}`, {
				select: this.unitField,
			}).then((data: Record<string, string>) => {
				this.applyUnitValue(data[this.unitField!]);
			});
		}

		applyUnitValue(unitValue: string): void {
			if (unitValue !== undefined && unitValue !== this.model.get(this.unitFieldName)) {
				this.model.set(this.unitFieldName, unitValue, {silent: true});

				if (this.isRendered()) {
					this.reRender();
				}
			}
		}

		getUnitFieldValue(): string {
			return (this.model.get(this.unitFieldName) as string) || '';
		}

		override data(): FloatWithLinkedUnitFieldData {
			const unitValue = this.getUnitFieldValue();

			const data = super.data() as { params: Record<string, unknown> };

			data.params.compact = this.model.getFieldParam(this.name, 'compact');

			return {
				...data,
				unitValue,
				unitFieldName: this.unitFieldName,
			};
		}

		override afterRender(): void {
			super.afterRender();

			const unitValue = this.getUnitFieldValue();

			if (this.$el.find('.unit-value').length && unitValue) {
				const translatedValue = this.getTranslatedUnitLabel(unitValue);
				this.$el.find('.unit-value').text(translatedValue);
			}
		}

		getTranslatedUnitLabel(unitValue: string): string {
			if (!unitValue) return unitValue;

			let translated = this.translate(unitValue, 'units', this.model.entityType) as string;

			if (!translated || translated === unitValue) {
				translated = this.translate(unitValue, 'units', 'Global') as string;
			}

			return translated;
		}
	},
);
