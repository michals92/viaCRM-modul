define(['controllers/record'], Dep => class extends Dep {
	override actionCreate(options?: { [key: string]: any }): void {
		options = options || {};

		this.showLoadingNotification();

		if (options.entityType) {
			this.wrappedCreate(options.entityType, options);
			return;
		}

		this.main('autocrm:views/record-template/modals/select-scope', {}, view => {
			this.hideLoadingNotification();
			view.render();

			this.listenToOnce(view, 'cancel', () => {
				if (this.getRouter().history.length > 1) {
					this.getRouter().navigateBack();
				} else {
					this.getRouter().navigate('#RecordTemplate', { trigger: true });
				}
			});

			this.listenToOnce(view, 'select', scope => this.wrappedCreate(scope, options));
		});
	}

	wrappedCreate(scope, options) {
		this.entityType = options.entityType = scope;

		options.rootUrl = '#RecordTemplate';
		this.create(options);
			
		this.entityType = 'RecordTemplate';

		this.getRouter().navigate(`#RecordTemplate/create/entityType=${scope}`, { trigger: false });
	}
});