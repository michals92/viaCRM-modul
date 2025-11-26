define(['views/fields/varchar'], Dep => class extends Dep {
	override validations = ['required', 'valid'];

	validateValid() {
		const value = this.model.get(this.name);

		const notValid = value !== 'emailAddress';

		if (notValid) {
			const msg = this.translate('emailFieldWrongName', 'messages');

			this.showValidationMessage(msg);
		}

		return notValid;
	}
});