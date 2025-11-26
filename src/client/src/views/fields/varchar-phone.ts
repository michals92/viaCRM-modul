import type VarcharFieldView from 'espocrm/src/views/fields/varchar';
import type PhoneFieldView from 'espocrm/src/views/fields/phone';
import type Model from 'espocrm/src/model';
import type { VarcharPhoneFieldData } from 'viacrm/types';

define(
	['views/fields/varchar', 'views/fields/phone'],
	(Dep: typeof VarcharFieldView, Phone: typeof PhoneFieldView) => class extends Dep {
		override detailTemplate = 'viacrm:fields/varchar-phone/detail';
		override listTemplate = 'viacrm:fields/varchar-phone/list';
		useInternational!: boolean;
		allowExtensions!: boolean;
		declare name: string;
		declare model: Model;

		override setup(): void {
			super.setup();

			this.useInternational = (this.getConfig().get('phoneNumberInternational') as boolean) || false;
			this.allowExtensions = (this.getConfig().get('phoneNumberExtensions') as boolean) || false;
		}

		override data(): VarcharPhoneFieldData {
			const phoneNumber = this.model.get(this.name) as string;

			return {
				...super.data(),
				valueForLink: phoneNumber ? Phone.prototype.formatForLink.call(this, phoneNumber) : '',
				phoneNumber: Phone.prototype.formatNumber.call(this, phoneNumber),
			};
		}
	},
);
