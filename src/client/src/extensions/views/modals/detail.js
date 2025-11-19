extend(Dep => class extends Dep {
	duplicateAction = true;

	setup() {
		super.setup();

		this.setupEvents();
	}

	setupEvents() {
		this.events['auxclick button[data-name="fullForm"]'] = e => {
			this.actionFullForm({name: 'fullForm'}, e);
		};
	}

	actionFullForm(_data, e) {
		const scope = this.getScope();
		const url = '#' + scope + '/view/' + this.id;

		let attributes = this.getRecordView().fetch();
		const model = this.getRecordView().model;

		attributes = Object.assign(attributes, model.getClonedAttributes());

		const options = {
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
				router.navigate(url, {trigger: false});
			}, 10);

			this.trigger('leave');
			this.dialog.close();
		}
	}
});
