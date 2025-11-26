import type LinkFieldView from 'espocrm/src/views/fields/link';
import type Model from 'espocrm/src/model';

interface TaxClassModel extends Model {
	get(name: 'rate'): number | null;
	get(name: string): unknown;
}

define(
	['views/fields/link'],
	(Dep: typeof LinkFieldView) => class extends Dep {
		declare model: Model;

		select(model: TaxClassModel): void {
			Dep.prototype.select.call(this, model);

			this.model.set('taxRate', model.get('rate'));
		}

		clearLink(): void {
			Dep.prototype.clearLink.call(this);

			this.model.set('taxRate', null);
		}
	},
);
