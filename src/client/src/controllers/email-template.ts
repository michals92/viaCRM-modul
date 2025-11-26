import type { EmailTemplateCreateActionOptions } from 'viacrm/types';

define(['controllers/record'], Dep => class extends Dep {
	override create(options: EmailTemplateCreateActionOptions) {
		options = options || {};
		options.attributes = options.attributes || {};

		if ('type' in options) {
			options.attributes.type = options.type;

			if (options.type === 'EasyEmail') {
				options.isHtml = true;
			}
		}

		super.create(options);
	}
});
