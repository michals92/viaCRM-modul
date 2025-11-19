define(['views/base'], Dep => class extends Dep {
	override template = 'autocrm:email/record/combined-cell';

	override data() {
		return {
			isRead: this.model?.get('isRead') ?? false,
		};
	}

	override setup() {
		super.setup();

		this.createView('dateSent', 'views/fields/datetime-short', {
			mode: 'list',
			name: 'dateSent',
			selector: '.date-container',
			model: this.model,
		});

		this.createView('personStringData', 'views/email/fields/person-string-data', {
			mode: 'list',
			name: 'personStringData',
			selector: '.person-string-data-container',
			model: this.model,
		});

		this.createView('subject', 'views/email/fields/subject', {
			name: 'subject',
			selector: '.subject-container',
			model: this.model,
			mode: 'listLink',
		});
	}
});
