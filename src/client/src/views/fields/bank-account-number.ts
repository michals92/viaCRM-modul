import type VarcharFieldView from 'espocrm/src/views/fields/varchar';
import type Model from 'espocrm/src/model';

define(
	['views/fields/varchar'],
	(Dep: typeof VarcharFieldView) => class extends Dep {
		override type = 'bankAccountNumber';

		override validations = ['required', 'bankAccountNumber'];

		declare model: Model;
		declare name: string;

		validateBankAccountNumber(): boolean {
			const value = this.model.get(this.name) as string | null;

			if (!value) {
				return false;
			}

			const cleanValue = value.replace(/[^\d/-]/g, '');

			const [accountPart, bankCode] = cleanValue.split('/');

			if (!accountPart || !bankCode) {
				const msg = this.translate('invalidBankAccountNumber', 'messages') as string;
				this.showValidationMessage(msg);
				return true;
			}

			if (bankCode.length !== 4) {
				const msg = this.translate('invalidBankCode', 'messages') as string;
				this.showValidationMessage(msg);
				return true;
			}

			const bankAccountNumber = accountPart.replace(/\D/g, '');

			if (bankAccountNumber.length > 16) {
				const msg = this.translate('bankAccountNumberTooLong', 'messages') as string;
				this.showValidationMessage(msg);
				return true;
			}

			const paddedNumber = bankAccountNumber.padStart(16, '0');

			const weights = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6, 1, 2, 4, 8, 5, 10];
			let sum = 0;

			for (let i = 0; i < 16; i++) {
				sum += parseInt(paddedNumber[15 - i]) * weights[i];
			}

			if (sum % 11 !== 0) {
				const msg = this.translate('invalidChecksum', 'messages') as string;
				this.showValidationMessage(msg);
				return true;
			}

			return false;
		}

		override fetch(): Record<string, string | null> {
			const data = super.fetch();

			if (data[this.name]) {
				data[this.name] = (data[this.name] as string).replace(/[^\d/-]/g, '');
			}

			return data;
		}
	},
);
