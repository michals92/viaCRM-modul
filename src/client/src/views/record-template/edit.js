define(['views/edit'], Dep => class extends Dep {
	optionsToPass = [
		'returnUrl',
		'returnDispatchParams',
		'attributes',
		'rootUrl',
		'duplicateSourceId',
		'returnAfterCreate',
		'recordTemplateModel',
	];

	setup() {
		let entityType = this.options.params.entityType;

		Espo.Ui.notifyWait();
		this.wait(true);

		if (!entityType) {
			entityType = this.model.get('entityType');
			this.recordTemplateModel = this.model.clone();

			this.getModelFactory().create(entityType, model => {
				model.set(this.model.get('data'));
				model.id = this.model.id;

				this.model = model;

				Espo.Ui.notify(false);
				this.wait(false);
			});
		} else {
			this.getModelFactory().create(this.scope, model => {
				this.recordTemplateModel = model;

				Espo.Ui.notify(false);
				this.wait(false);
			});
		}

		this.options.recordTemplateModel = this.recordTemplateModel;
		this.scope = entityType;

		super.setup();
	}

	getHeader() {
		const orgScope = this.scope;
		this.scope = this.recordTemplateModel.name;
		const $header = $(super.getHeader());

		$header.find('.breadcrumb-item:last').append(` (${this.translate(orgScope, 'scopeNames').toLowerCase()})`);

		this.scope = orgScope;
		return $header.prop('outerHTML');
	}

	getRecordViewName() {
		return this.getMetadata().get(['clientDefs', 'RecordTemplate', 'recordViews', 'edit']);
	}

	actionNavigateToRoot(data, e) {
		this.scope = this.recordTemplateModel.name;
		super.actionNavigateToRoot(data, e);
	}
});