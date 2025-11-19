define(['advanced:views/workflow/action-modals/create-notification'], Dep => class extends Dep {
	template: string = 'autocrm:workflow/actions-modals/create-alert';

	data() {
		return _.extend({
			alertTemplateHelpText: this.translate('alertTemplateHelpText', 'messages', 'Workflow'),
		}, super.data());
	}

	setup(): void {
		super.setup();

		const model = this.formModel;

		model.set('iconClass', this.actionData.iconClass);

		this.createView('iconClass', 'autocrm:views/fields/icon-class', {
			el: this.options.el + ' .field-iconClass',
			model: model,
			mode: 'edit',
			defs: {
				name: 'iconClass'
			},
		});

		this.createView('showInCalendar', 'views/fields/bool', {
			el: this.options.el + ' .field-showInCalendar',
			model: model,
			mode: 'edit',
			defs: {
				name: 'showInCalendar'
			},
		});

	}

	fetch() {
		const y: boolean = super.fetch() as boolean;

		this.actionData.iconClass = (this.getView('iconClass')?.fetch() || {})?.iconClass || null;
		this.actionData.showInCalendar = (this.getView('showInCalendar')?.fetch() || {})?.showInCalendar || null;

		return y;
	}

});
