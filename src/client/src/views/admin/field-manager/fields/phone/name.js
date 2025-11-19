define(['views/fields/varchar'], Dep => class extends Dep {
	validations = ['required', 'valid'];

	validateValid() {
		const value = this.model.get(this.name);

		const notValid = value !== 'phoneNumber';

		if (notValid) {
			const msg = this.translate('phoneNumberFieldWrongName', 'messages');
				
			this.showValidationMessage(msg);
		}

		return notValid;
	}
});