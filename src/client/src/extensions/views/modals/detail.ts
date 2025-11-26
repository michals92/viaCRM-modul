import type DetailModalView from 'espocrm/src/views/modals/detail';

interface ModalActionData {
	name: string;
}

interface DispatchOptions {
	attributes: Record<string, unknown>;
	returnUrl: string;
	model: unknown;
	id: string;
	rootUrl?: string;
}

extend<DetailModalView>(Dep => class extends Dep {
	override duplicateAction = true;

	override setup(): void {
		super.setup();

		this.setupEvents();
	}

	setupEvents(): void {
		this.events['auxclick button[data-name="fullForm"]'] = (e: JQuery.ClickEvent) => {
			this.actionFullForm({ name: 'fullForm' }, e);
		};
	}

	override actionFullForm(_data: ModalActionData, e?: JQuery.ClickEvent): void {
		const scope = this.getScope();
		const url = '#' + scope + '/view/' + this.id;

		let attributes = this.getRecordView().fetch();
		const model = this.getRecordView().model;

		attributes = Object.assign(attributes, model.getClonedAttributes());

		const options: DispatchOptions = {
			attributes: attributes,
			returnUrl: Backbone.history.fragment,
			model: this.sourceModel || this.model,
			id: this.id,
		};

		if (this.options.rootUrl) {
			options.rootUrl = this.options.rootUrl;
		}

		if (e && e.which === 2) {
			// Middle mouse button click
			window.open(url, '_blank');
		} else {
			const router = this.getRouter();

			setTimeout(() => {
				router.dispatch(scope, 'view', options);
				router.navigate(url, { trigger: false });
			}, 10);

			this.trigger('leave');
			this.dialog.close();
		}
	}
});
