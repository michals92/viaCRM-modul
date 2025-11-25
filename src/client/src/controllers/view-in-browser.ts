define(['controller'], Dep => class extends Dep {
	actionViewEmail(options: any) {
		options = options || {};

		if (!options.emailBody) {
			throw new Error();
		}

		this.entire(
			'viacrm:views/email/view-in-browser',
			{
				emailBody: options.emailBody,
			},
			view => view.render(),
		);
	}
});
