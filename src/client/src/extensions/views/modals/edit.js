extend(Dep => class extends Dep {
	setup() {
		super.setup();

		this.setupEvents();
	}

	setupEvents() {
		this.events['auxclick button[data-name="fullForm"]'] = e => {
			this.actionFullForm({ name: 'fullForm' }, e);
		};
	}

	actionFullForm(_data, e) {
		let url;
		const router = this.getRouter();

		let attributes;
		let model;
		let options;

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
