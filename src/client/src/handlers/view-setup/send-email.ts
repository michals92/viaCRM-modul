import type DetailView from 'espocrm/src/views/detail';

define(() => {
	class Handler {
		protected view: DetailView;

		constructor(view: DetailView) {
			this.view = view;
		}

		public process() {
			const scopeData = this.view.getMetadata().get<Record<string, unknown>>(['scopes', this.view.scope]);

			if (!scopeData) {
				return;
			}

			const hideSendEmailButton = scopeData['hideSendEmailButton'] as boolean;
			const type = scopeData['type'] as string;

			if (hideSendEmailButton) {
				return;
			}
			if (type !== 'BasePlus') {
				return;
			}

			this.addSendEmailButton();
		}

		protected addSendEmailButton(): void {
			this.view.addMenuItem('buttons', {
				name: 'sendEmail',
				label: 'Send Email',
				iconClass: 'fas fa-envelope fa-sm',
				action: 'sendEmail',
			});

			this.view['actionSendEmail'] = () => this.sendEmail();
		}

		protected async sendEmail(): Promise<void> {
			const attributes = {
				status: 'Draft',
				parentId: this.view.model.id,
				parentType: this.view.model.entityType,
				parentName: this.view.model.get('name'),
			};

			const defaultEmailTemplateId = this.view
				.getMetadata()
				.get<string>(['clientDefs', this.view.scope, 'defaultEmailTemplateId']);

			if (defaultEmailTemplateId) {
				attributes['selectTemplateId'] = defaultEmailTemplateId;
				attributes['selectTemplateName'] = this.view
					.getMetadata()
					.get<string>(['clientDefs', this.view.scope, 'defaultEmailTemplateName']);
			}

			const viewName =
				this.view.getMetadata().get<string>(['clientDefs', this.view.scope, 'modalViews', 'compose']) ||
				this.view.getMetadata().get<string>(['clientDefs', 'Email', 'modalViews', 'compose']) ||
				'views/modals/compose-email';

			Espo.Ui.notifyWait();

			const view = await this.view.createView('quickCreate', viewName, {
				attributes,
			});

			await view.render();

			Espo.Ui.notify(false);
		}
	}

	// @ts-ignore - missing type
	Object.assign(Handler.prototype, Backbone.Events);

	return Handler;
});
