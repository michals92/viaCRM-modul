import type EditModalView from 'espocrm/src/views/modals/edit';

interface ModalActionData {
	name: string;
}

interface CreateOptions {
	attributes: Record<string, unknown>;
	relate?: unknown;
	returnUrl: string;
	returnDispatchParams?: unknown;
	rootUrl?: string;
}

interface EditOptions {
	attributes: Record<string, unknown>;
	returnUrl: string;
	returnDispatchParams?: unknown;
	model: unknown;
	id: string;
	rootUrl?: string;
}

extend<EditModalView>(Dep => class extends Dep {
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
		let url: string;
		const router = this.getRouter();

		let attributes: Record<string, unknown>;
		let model: { getClonedAttributes: () => Record<string, unknown> };
		let options: CreateOptions | EditOptions;

		if (!this.id) {
			url = '#' + this.scope + '/create';

			attributes = this.getRecordView().fetch();
			model = this.getRecordView().model;

			attributes = { ...attributes, ...model.getClonedAttributes() };

			options = {
				attributes: attributes,
				relate: this.options.relate,
				returnUrl: this.options.returnUrl || Backbone.history.fragment,
				returnDispatchParams: this.options.returnDispatchParams || null,
			};

			if (this.options.rootUrl) {
				options.rootUrl = this.options.rootUrl;
			}
		} else {
			url = '#' + this.scope + '/edit/' + this.id;

			attributes = this.getRecordView().fetch();
			model = this.getRecordView().model;

			attributes = { ...attributes, ...model.getClonedAttributes() };

			options = {
				attributes: attributes,
				returnUrl: this.options.returnUrl || Backbone.history.fragment,
				returnDispatchParams: this.options.returnDispatchParams || null,
				model: this.sourceModel,
				id: this.id,
			};

			if (this.options.rootUrl) {
				options.rootUrl = this.options.rootUrl;
			}
		}

		if (e && e.which === 2) {
			// Middle mouse button click
			window.open(url, '_blank');
		} else {
			setTimeout(() => {
				router.dispatch(this.scope, this.id ? 'edit' : 'create', options);
				router.navigate(url, { trigger: false });
			}, 10);

			this.trigger('leave');
			this.dialog.close();
		}
	}
});
