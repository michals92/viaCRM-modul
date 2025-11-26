import type Model from 'espocrm/src/model';
import type { AddressData, AddressFieldMapping } from '../@types/viacrm-types';

interface FieldAutoFillMixin {
	relations: string[];
	autoFill: boolean;
	params: { relations?: string[]; autoFill?: boolean };
	model: Model;
	name: string;
	type: string;
	streetField: string;
	cityField: string;
	stateField: string;
	postalCodeField: string;
	listenTo(model: Model, event: string, callback: () => void): void;
	once(event: string, callback: () => void): void;
	isEditMode(): boolean;
	getModelFactory(): { create(entityType: string): Promise<Model> };
	getMetadata(): { get(path: string[]): unknown };
	mapAddressDataToFields(data: AddressData): AddressFieldMapping;
}

define(
	[],
	() => ({
		setupAutoFill(this: FieldAutoFillMixin): void {
			this.relations = this.params.relations || [];
			this.autoFill = this.params.autoFill || false;

			if (this.autoFill) {
				for (const relation of this.relations) {
					const relationIdField = relation + 'Id';
					this.listenTo(this.model, 'change:' + relationIdField, () => {
						this.autoFillFromRelations(true);
					});
				}

				this.once('after:render', () => {
					this.checkPrefilledRelations();
				});
			}
		},

		checkPrefilledRelations(this: FieldAutoFillMixin): void {
			if (!this.isEditMode()) {
				return;
			}

			const isFieldEmpty = this.isAutoFillFieldEmpty();

			if (!isFieldEmpty) {
				return;
			}

			for (const relation of this.relations) {
				const relationIdField = relation + 'Id';
				const relationId = this.model.get(relationIdField);

				if (relationId) {
					this.autoFillFromRelations();
					break;
				}
			}
		},

		isAutoFillFieldEmpty(this: FieldAutoFillMixin): boolean {
			if (this.type === 'address') {
				const fields = [this.streetField, this.cityField, this.stateField, this.postalCodeField];
				for (const field of fields) {
					const value = this.model.get(field) as string | null;
					if (value && value.trim() !== '') {
						return false;
					}
				}
				return true;
			}

			if (this.type === 'currency') {
				const amount = this.model.get(this.name) as number | null;
				return !amount || amount === 0;
			}

			const value = this.model.get(this.name);
			return !value || (typeof value === 'string' && value.trim() === '');
		},

		async fillFromRelation(this: FieldAutoFillMixin, relationName: string, entityType: string): Promise<void> {
			const { model, name } = this;

			const relationId = model.get(relationName + 'Id');

			if (!relationId) {
				return;
			}

			const entity = await this.getModelFactory().create(entityType);
			entity.id = relationId as string;

			await entity.fetch();

			if (this.type === 'address') {
				const addressData = {
					street: entity.get(name + 'Street'),
					city: entity.get(name + 'City'),
					state: entity.get(name + 'State'),
					country: entity.get(name + 'Country'),
					postalCode: entity.get(name + 'PostalCode'),
				};
				model.set(this.mapAddressDataToFields(addressData));
				return;
			}

			const value = entity.get(name);

			if (value !== undefined && value !== null) {
				model.set(name, value);
			}
		},

		async autoFillFromRelations(this: FieldAutoFillMixin, forceOverwrite = false): Promise<void> {
			if (!forceOverwrite && !this.isAutoFillFieldEmpty()) {
				return;
			}

			for (const relation of this.relations) {
				const entityType = this.getMetadata().get(['entityDefs', this.model.entityType, 'links', relation, 'entity']) as string | undefined;
				if (!entityType) {
					continue;
				}

				const relationId = this.model.get(relation + 'Id');
				if (!relationId) {
					continue;
				}

				try {
					await this.fillFromRelation(relation, entityType);
					return;
				} catch (e) {
					console.error('[Field AutoFill] Failed to fill from relation', relation, e);
				}
			}
		},
	}),
);
