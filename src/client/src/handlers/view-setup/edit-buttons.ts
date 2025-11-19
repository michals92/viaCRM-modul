import type Model from 'espocrm/src/model';

define(() => {
	type MainView = import('espocrm/src/views/main').default;
	type ModalView = import('espocrm/src/views/modal').default;

	class Handler {
		protected view: MainView;
		protected scope?: string | null = null;
		protected scopeData?: Record<string, unknown> | null = null;

		constructor(view: MainView) {
			this.view = view;

			this.scope = this.view['scope'] as string;

			this.scopeData = this.view.getMetadata().get<Record<string, unknown>>(['scopes', this.scope]);
		}

		public process() {
			if (!this.scope) {
				return;
			}

			if (!this.scopeData) {
				return;
			}

			if (!this.view.getUser().isAdmin()) {
				return;
			}

			this.addAdminOnlyButtons();
		}

		protected addAdminOnlyButtons(): void {
			this.addViewApiButton();
			this.addEditEntityButton();

			const layouts = Boolean(this.scopeData?.layouts);

			if (layouts) {
				this.addEditLayoutButton();
				this.addEditFiltersButton();
			}

			this.addEditLabelsButton();
			this.addRefreshEntityButton();
		}

		protected addEditEntityButton(): void {
			const customizable = Boolean(this.scopeData?.customizable);
			const editEntityEnabled = this.view.getConfig().get('editEntityEnabled');

			if (!editEntityEnabled) {
				return;
			}

			if (!customizable) {
				return;
			}

			this.view.addMenuItem('buttons', {
				name: 'editEntity',
				labelTranslation: 'Global.labels.Edit Entity',
				iconClass: 'fas fa-tools fa-sm',
				link: '#Admin/entityManager/' + $.param({ scope: this.scope }),
			});
		}

		protected addViewApiButton(): void {
			const viewApiEnabled = this.view.getConfig().get('viewApiEnabled');

			if (viewApiEnabled) {
				this.view.addMenuItem('buttons', {
					name: 'viewApi',
					labelTranslation: 'Global.labels.View Api',
					iconClass: 'fas fa-plug fa-sm',
					action: 'viewApi',
					// @ts-ignore oof
					auxClick: true
				});

				this.view['actionViewApi'] = () => this.viewApi();
			}
		}

		protected addEditLayoutButton(): void {
			const editLayoutEnabled = this.view.getConfig().get('editLayoutEnabled');

			if (!editLayoutEnabled) {
				return;
			}

			const layoutType = Espo.Utils.lowerCaseFirst(this.view['name'] as string);

			this.view.addMenuItem('buttons', {
				name: 'editLayout',
				labelTranslation: 'Global.labels.Edit Layout',
				iconClass: 'fas fa-table fa-sm',
				action: 'editLayout',
				link: '#Admin/layouts/' + $.param({ scope: this.scope, type: layoutType, em: true }),
			});

			this.view['actionEditLayout'] = () => this.editLayout(layoutType);
		}

		protected addEditFiltersButton(): void {
			const editFiltersEnabled = this.view.getConfig().get('editFiltersEnabled');

			if (!editFiltersEnabled) {
				return;
			}

			if (this.view['name'] !== 'List') {
				return;
			}

			this.view.addMenuItem('buttons', {
				name: 'editFilters',
				labelTranslation: 'Global.labels.Edit Filters',
				iconClass: 'fas fa-filter fa-sm',
				action: 'editFilters',
				link: '#Admin/layouts/' + $.param({ scope: this.scope, type: 'filters', em: true }),
			});

			this.view['actionEditFilters'] = () => this.editLayout('filters');
		}

		protected addEditLabelsButton(): void {
			const editLabelsEnabled = this.view.getConfig().get('editLabelsEnabled');

			if (!editLabelsEnabled) {
				return;
			}

			this.view.addMenuItem('buttons', {
				name: 'editLabels',
				labelTranslation: 'Global.labels.Edit Labels',
				iconClass: 'fas fa-tags fa-sm',
				action: 'editLabels',
				link:
					'#Admin/labelManager/' +
					$.param({ scope: this.scope, language: this.view.getConfig().get('language') }),
			});

			this.view['actionEditLabels'] = () => this.editLabels();
		}

		protected addRefreshEntityButton(): void {
			const refreshEntityEnabled = this.view.getConfig().get('refreshEntityEnabled');

			// If this.view.model isn't set, then we're in a list view
			if (refreshEntityEnabled && this.view.model) {
				this.view.addMenuItem('buttons', {
					name: 'refreshEntity',
					labelTranslation: 'Global.labels.Refresh Entity',
					iconClass: 'fas fa-sync fa-sm',
					action: 'refreshEntity',
				});

				this.view['actionRefreshEntity'] = () => this.refreshEntity(this.view.model);
			}
		}

		protected viewApi(): void {
			const url = this.view.model?.url ?? (this.view.model?.urlRoot ? (this.view.model?.urlRoot + '/' + this.view.model?.id) : null) ?? this.view.collection?.url;

			if (!url) {
				return;
			}

			window.open('/api/v1/' + url, '_blank');
		}

		protected async editLayout(layoutType: string): Promise<void> {
			const editLayoutView = (await this.view.createView('edit-layout', 'autocrm:views/modals/edit-layout', {
				scope: this.scope,
				type: layoutType,
			})) as unknown as ModalView;

			this.view.listenTo(editLayoutView, 'after:save', () => {
				editLayoutView.close();

				Espo.Ui.success(this.view.translate('Saved'));

				const last = this.view.getRouter().getLast();

				this.view.getRouter().dispatch(last.controller, last.action, last.options);
			});

			await editLayoutView.render();
		}

		protected async editLabels(): Promise<void> {
			const scope = this.scope;
			const language = this.view.getConfig().get('language');
			const url = '#Admin/labelManager/' + $.param({ scope, language });

			this.view.getRouter().navigate(url, { trigger: true });
		}

		protected async refreshEntity(model: Model | null): Promise<void> {
			if (model) {
				Espo.Ui.notify(this.view.translate(' ... '));

				model.trigger('update-all');
				await model.fetch();

				Espo.Ui.success(this.view.translate('Done'));
			}
		}
	}

	// @ts-ignore - missing type
	Object.assign(Handler.prototype, Backbone.Events);

	return Handler;
});
