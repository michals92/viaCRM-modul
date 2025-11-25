import type Model from 'espocrm/src/model';
import type View from 'espocrm/src/view';
import type { ColumnDefs } from 'espocrm/src/views/record/list';

define(['views/record/list'], Dep => class extends Dep {
	override template = 'viacrm:record/grid';

	itemViewName = 'viacrm:views/record/grid-item';

	override layoutName = 'grid';

	itemsPerRow: number = 4;

	setupHandlerType = 'record/grid';

	override checkboxes = false;

	override data() {
		return {
			...super.data(),
			itemsPerRow: this.itemsPerRow,
		};
	}

	override setup() {
		super.setup();

		// @ts-ignore don't want to deal with this
		this.itemsPerRow = this.options.itemsPerRow || this.itemsPerRow;
	}

	override buildRow(_: number, model: Model, callback: (view: View) => void): void {
		const key = model.id as string;

		this.rowList.push(key);

		const acl = {
			edit: this.getAcl().checkModel(model, 'edit') && !this.editDisabled,
			delete: this.getAcl().checkModel(model, 'delete') && !this.removeDisabled,
		};

		this.getInternalLayout(internalLayout => {
			const itemLayout = Espo.Utils.cloneDeep(internalLayout);

			this.createView(
				key,
				this.itemViewName,
				{
					model,
					acl,
					selector: '.grid-item[data-id="' + key + '"]',
					rowActionsDisabled: true,
					itemLayout,
					setViewBeforeCallback: this.options.skipBuildRows && !this.isRendered(),
				},
				callback,
			);
		});
	}

	/**
		 * @protected
		 */
	override getInternalLayout(callback: (layout: ColumnDefs[] | null) => void, model?: Model) {
		if (this.scope === null && !Array.isArray(this.listLayout)) {
			if (!model) {
				callback(null);

				return;
			}

			this.getInternalLayoutForModel(callback, model);

			return;
		}

		if (this.listLayout !== null) {
			callback(this.listLayout);

			return;
		}

		this._loadListLayout(listLayout => {
			this.listLayout = listLayout;

			callback(this.listLayout);
		});
	}
});
