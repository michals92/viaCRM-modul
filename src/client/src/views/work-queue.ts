import type Collection from 'espocrm/src/collection';
import type SearchManager from 'espocrm/src/search-manager';

define(['views/main', 'autocrm:helpers/version'], (Dep, VersionHelper) => class extends Dep {
	override template = 'autocrm:work-queue';

	// @ts-ignore oof
	collection: Collection;

	override name = 'WorkQueue';

	override scope = 'WorkQueue';

	headerView: string = 'views/header';
	searchView: string = 'views/record/search';
	workQueueEntityTypeList: string[] = [];
	isSetUp = true;
	searchPanel = true;
	searchManager: SearchManager | null = null;

	override setup() {
		super.setup();

		this.workQueueEntityTypeList = this.getConfig().get('workQueueEntityTypeList') || [];

		if (Array.isArray(this.workQueueEntityTypeList) && this.workQueueEntityTypeList.length === 0) {
			this.isSetUp = false;
		}

		// @ts-ignore oof
		this.collection = this.options.collection;

		// @ts-ignore oof
		this.headerView = this.options.headerView || this.headerView;

		this.createView('header', this.headerView, {
			fullSelector: '#main > .page-header',
			scope: this.scope,
			isXsSingleRow: true,
		});
			
		if (this.searchPanel) {
			this.setupSearchManager();
			this.setupSearchPanel();
		}
	}
		
	setupSearchManager() {
		const collection = this.collection;
			
		const searchManager = (new VersionHelper(this.getConfig()))
			.createSearchManager(collection, 'workQueue', this.getStorage(), this.getDateTime(), null);
			
		searchManager.scope = this.scope;
		searchManager.loadStored();
			
		collection.where = searchManager.getWhere();
			
		this.searchManager = searchManager;
	}
		
	setupSearchPanel() {
		this.createView('search', this.searchView, {
			collection: this.collection,
			fullSelector: '#main > .search-container',
			searchManager: this.searchManager,
			scope: this.scope,
			isWide: true,
		}, view => {
			this.listenTo(view, 'reset', () => {
				this.resetSorting();
			});
		});
	}
		
	resetSorting() {
		this.getStorage().clear('listSorting', 'WorkQueue');
	}

	/**
		 * @inheritDoc
		 */
	override afterRender() {
		if (!this.isSetUp) {
			Espo.Ui.warning(this.translate('workQueueNotSetUp', 'messages', 'WorkQueue'));
			return;
		}

		Espo.Ui.notify(false);

		if (!this.hasView('list')) {
			this.loadList();
		}

		const $el = this.$el.get(0);

		if ($el) {
			$el.focus({ preventScroll: true });
		}
	}

	override data() {
		return {
			...super.data(),
			isSetUp: this.isSetUp,
		};
	}

	loadList() {
		if ('isFetched' in this.collection && this.collection.isFetched) {
			this.createListRecordView(false);

			return;
		}

		Espo.Ui.notifyWait();

		this.createListRecordView(true);
	}

	createListRecordView(fetch: boolean) {
		this.createView(
			'list',
			'autocrm:views/work-queue/record/list',
			{
				selector: '.list-container',
				forceDisplayTopBar: false,
				collection: this.options.collection,
				statusField: this.options.statusField,
			},
			view => {
				this.listenToOnce(view, 'after:render', () => {
					if (!this.hasParentView()) {
						view.undelegateEvents();

						this.clearView('list');
					}
				});

				if (!fetch) {
					Espo.Ui.notify(false);

					view.render();

					return;
				}

				this.collection.fetch({ main: true }).then(() => Espo.Ui.notify(false));
			},
		);
	}

	override getHeader() {
		const headerIconHtml = this.getHeaderIconHtml();
		const scopeLabel = this.translate('WorkQueue', 'scopeNamesPlural');

		const $root = $('<span>').text(scopeLabel);

		if (headerIconHtml) {
			$root.prepend(headerIconHtml);
		}

		return this.buildHeaderHtml([$root]);
	}
});
