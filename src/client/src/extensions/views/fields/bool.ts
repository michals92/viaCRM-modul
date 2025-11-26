import type BoolFieldView from 'espocrm/src/views/fields/bool';

import type BoolFieldView from 'espocrm/src/views/fields/bool';

extend<BoolFieldView>((Dep: typeof BoolFieldView) => class extends Dep {
	override editTemplate = 'viacrm:fields/bool/edit';
	override detailTemplate = 'viacrm:fields/bool/detail';
	override listTemplate = 'viacrm:fields/bool/list';

	forcedEdit: boolean = false;

	override setup() {
		super.setup();

		const params = this.params as Record<string, unknown>;

		if (params.directEdit && !params.readOnly && !this.readOnly) {
			this.forcedEdit = true;
		} else {
			this.forcedEdit = false;
		}
	}

	override data() {
		return {
			...super.data(),
			forcedEdit: this.forcedEdit,
		};
	}

	protected override afterRender(): void {
		super.afterRender();

		if (this.forcedEdit && !this.readOnly && !this.isEditMode() && !this.isSearchMode()) {
			this.initElement();
		}
	}

	override initElement() {
		super.initElement();

		if (this.forcedEdit && !this.isEditMode() && !this.readOnly && !this.isSearchMode()) {
			if (!this.$element || !this.$element.length) {
				this.$element = this.$el.find('input[type="checkbox"]');
			}

			// @ts-ignore oof
			this.$element.on('change', () => {
				this.trigger('change');

				this.model.save(
					{
						[this.name]: this.model.get(this.name),
					},
					{patch: true},
				);
			});
		}
	}
});
