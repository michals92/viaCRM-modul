import type { FieldAutoFillMixin } from '../../../@types/ui-modules';

import type VarcharFieldView from 'espocrm/src/views/fields/varchar';

extend<VarcharFieldView>(['viacrm:helpers/field-auto-fill'], (Dep, FieldAutoFill: FieldAutoFillMixin) => class extends Dep {
	override validations = ['required', 'pattern', 'maxCharLength', 'minCharLength'];

	override setup(): void {
		super.setup();

		// Apply auto-fill helper
		Object.assign(this, FieldAutoFill);
		this.setupAutoFill();
	}

	validateMaxCharLength(): boolean {
		const maxCharLength = this.params.maxCharLength;

		if (!maxCharLength) {
			return false;
		}

		const value = this.model.get(this.name) || '';

		if (value.length <= maxCharLength) {
			return false;
		}

		const msg = this.translate('fieldOverMaxCharLength', 'messages')
			.replace('{field}', this.getLabelText())
			.replace('{maxCharLength}', maxCharLength.toString());

		this.showValidationMessage(msg, 'label');

		return true;
	}

	validateMinCharLength(): boolean {
		const minCharLength = this.params.minCharLength;

		if (!minCharLength) {
			return false;
		}

		const value = this.model.get(this.name) || '';

		// If the field is required, it will fail the 'required' validation. If it isn't, we should let it pass here
		if (!value) {
			return false;
		}

		if (value.length >= minCharLength) {
			return false;
		}

		const msg = this.translate('fieldUnderMinCharLength', 'messages')
			.replace('{field}', this.getLabelText())
			.replace('{minCharLength}', minCharLength.toString());

		this.showValidationMessage(msg, 'label');

		return true;
	}
});
