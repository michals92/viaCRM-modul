define(['views/admin/layouts/index', 'model'], (Dep, Model) => class extends Dep {
	template = 'autocrm:admin/layouts/index';

	init() {
		if (!this.typeList.includes('aggregationFunctions')) {
			this.typeList.splice(this.typeList.indexOf('filters') + 1, 0, 'aggregationFunctions');
		}

		super.init();
	}

	createView(key, viewName, options, callback, wait) {
		if (key === 'content' && viewName === 'views/admin/layouts/aggregation-functions') {
			viewName = 'autocrm:' + viewName;
		}

		return super.createView(key, viewName, options, callback, wait);
	}

	setup() {
		this.setupEvents();

		super.setup();

		this.scopeNotSelected = !this.options.scope;
		this.typeNotSelected = !this.options.type;
		this.options.scope = this.scope = this.scope || this.scopeList[0];
		this.options.type = this.type = this.type || 'list';

		const translatedOptions = {};

		this.scopeList.forEach(scope => {
			translatedOptions[scope] = this.translate(scope, 'scopeNamesPlural');
		});

		const scopeModel = new Model();

		scopeModel.set('scope', this.scope);

		this.createView(
			'scope',
			'views/fields/enum',
			{
				mode: 'edit',
				model: scopeModel,
				selector: '#scope-container',
				defs: {
					name: 'scope',
					params: {
						options: this.scopeList,
					},
				},
				translatedOptions: translatedOptions,
			},
			view => {
				this.scopeEnumView = view;
			},
		);

		this.createView(
			'layouts',
			'autocrm:views/admin/layouts/panels/layouts',
			{
				model: scopeModel,
				selector: '#layout-list',
				scope: this.scope,
				scopeList: this.scopeList,
				scopeDataList: this.getLayoutScopeDataList(),
				defs: {
					name: 'scope',
				},
			},
			view => {
				this.layoutsView = view;
			},
		);

		this.listenTo(scopeModel, 'change:scope', model => {
			const scope = model.get('scope');

			if (scope) {
				this.openLayout(scope, 'list');
			}
		});
	}

	setupEvents() {
		this.events['click [data-action="addLayout"]'] = () => this.addLayout();
		this.events['click [data-action="showAllLayouts"]'] = () =>
			this.getRouter().navigate(this.baseUrl + '/scope=' + this.scope + '&type=' + this.type, {
				trigger: true,
			});
	}

	data() {
		return {
			scopeList: this.scopeList,
			scope: this.scope,
			headerHtml: this.getHeaderHtml(),
			em: this.em,
		};
	}

	afterRender() {
		if (!this.em && this.scopeEnumView) {
			const el = this.scopeEnumView.$element;
			el.selectize();
			if (this.scopeNotSelected) {
				el[0].selectize.focus();
			}
		}

		super.afterRender();
	}

	navigate(scope, type) {
		let url = '#Admin/layouts/scope=' + scope + '&type=' + type;

		if (this.em) {
			url += '&em=true';
		}

		this.getRouter().navigate(url, {
			trigger: false,
			replace: this.scopeNotSelected || this.typeNotSelected,
		});
	}

	addLayout() {
		Espo.Ui.notifyWait();
		this.createView(
			'editModal',
			'views/admin/layouts/modals/edit-attributes',
			{
				scope: this.scope,
				attributeList: ['name', 'label', 'type'],
				attributeDefs: {
					label: {
						type: 'varchar',
						required: true,
					},
					name: {
						type: 'varchar',
						required: true,
					},
					type: {
						type: 'enum',
						options: ['list', 'detail'],
					},
				},
			},
			view => {
				view.render();
				Espo.Ui.notify(false);

				const editView = view.getView('edit');

				this.listenTo(editView.getView('nameField'), 'change', () => {
					let name = editView.model.get('name');
					let label = name;

					if (label.length) {
						label = label.charAt(0).toUpperCase() + label.slice(1);
					}

					if (name) {
						name = name
							.replace(/-/i, '')
							.replace(/_/i, '')
							.replace(/[^\w\s]/gi, '')
							.replace(/ (.)/g, (_, g) => g.toUpperCase())
							.replace(' ', '');

						if (name.length) {
							name = name.charAt(0).toLowerCase() + name.slice(1);
						}
					}

					editView.model.set('label', label);
					editView.model.set('name', name);
				});

				this.listenToOnce(view, 'after:save', attrs => {
					Espo.Ui.notifyWait();

					const attributes = Espo.Utils.clone(attrs);

					attributes.scope = this.scope;

					Espo.Ajax.postRequest('Layout/action/add', attributes).then(() => {
						Promise.all([this.getMetadata().loadSkipCache(), this.getLanguage().loadSkipCache()]).then(
							() => {
								const type = attributes.name;

								this.layoutsView.addLayout(this.scope, type);
								this.openLayout(this.scope, type);

								Espo.Ui.notify(false);
							},
						);
					});

					view.close();
				});
			},
		);
	}
});
