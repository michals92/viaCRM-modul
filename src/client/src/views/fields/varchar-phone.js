define(['views/fields/varchar', 'views/fields/phone'], (Dep, Phone) => class extends Dep {
	detailTemplate = 'viacrm:fields/varchar-phone/detail';
	listTemplate = 'viacrm:fields/varchar-phone/list';

	setup() {
		super.setup();

		this.useInternational = this.getConfig().get('phoneNumberInternational') || false;
		this.allowExtensions = this.getConfig().get('phoneNumberExtensions') || false;
	}

	data() {
		const phoneNumber = this.model.get(this.name);

		return {
			...super.data(),
			valueForLink: phoneNumber ? Phone.prototype.formatForLink.call(this, phoneNumber) : '',
			phoneNumber: Phone.prototype.formatNumber.call(this, phoneNumber),
		};
	}
});