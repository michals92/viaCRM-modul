define(['views/fields/varchar'], Dep => class extends Dep {
	type = 'bankAccountNumber';

	validations = ['required', 'bankAccountNumber'];

	validateBankAccountNumber() {
		const value = this.model.get(this.name);

		if (!value) {
			return false;
		}

		// Remove all non-digit characters except '/' and '-'
		const cleanValue = value.replace(/[^\d/-]/g, '');

		// Split into account number and bank code
		const [accountPart, bankCode] = cleanValue.split('/');

		if (!accountPart || !bankCode) {
			const msg = this.translate('invalidBankAccountNumber', 'messages');
			this.showValidationMessage(msg);
			return true;
		}

		// Validate bank code length
		if (bankCode.length !== 4) {
			const msg = this.translate('invalidBankCode', 'messages');
			this.showValidationMessage(msg);
			return true;
		}

		// Remove any remaining non-digit characters from account part
		const bankAccountNumber = accountPart.replace(/\D/g, '');

		// Validate account number length (max 16 digits)
		if (bankAccountNumber.length > 16) {
			const msg = this.translate('bankAccountNumberTooLong', 'messages');
			this.showValidationMessage(msg);
			return true;
		}

		// Pad account number to 16 digits with leading zeros
		const paddedNumber = bankAccountNumber.padStart(16, '0');

		// Calculate checksum
		const weights = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6, 1, 2, 4, 8, 5, 10];
		let sum = 0;

		for (let i = 0; i < 16; i++) {
			sum += parseInt(paddedNumber[15 - i]) * weights[i];
		}

		// Check if valid
		if (sum % 11 !== 0) {
			const msg = this.translate('invalidChecksum', 'messages');
			this.showValidationMessage(msg);
			return true;
		}

		return false;
	}

	fetch() {
		const data = super.fetch();

		if (data[this.name]) {
			// Clean up the value - remove spaces, but keep '/' and '-'
			data[this.name] = data[this.name].replace(/[^\d/-]/g, '');
		}

		return data;
	}
});
