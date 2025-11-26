import type AddressPreviewView from 'espocrm/src/views/settings/fields/address-preview';
import type AddressFieldView from 'espocrm/src/views/fields/address';
import type Model from 'espocrm/src/model';

extend<AddressPreviewView>(
	['views/fields/address'],
	(Dep, AddressFieldViewClass: typeof AddressFieldView) => class extends Dep {
		addressPreviewFields = [
			'addressPreviewStreet',
			'addressPreviewPostalCode',
			'addressPreviewCity',
			'addressPreviewState',
			'addressPreviewCountry',
		];
		declare model: Model;

		override setup(): void {
			AddressFieldViewClass.prototype.setup.call(this);

			const mainModel = this.model;
			const model = mainModel.clone();

			model.entityType = mainModel.entityType;
			model.name = mainModel.name;

			this.addressPreviewFields.forEach((field: string) => {
				model.set(field, this.translate(field, 'addressPreviewFields', 'Settings'));
			});

			this.listenTo(mainModel, 'change:addressFormat', () => {
				model.set('addressFormat', mainModel.get('addressFormat'));

				this.reRender();
			});

			this.model = model;
		}
	},
);
