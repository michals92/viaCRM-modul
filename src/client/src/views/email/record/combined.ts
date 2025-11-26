define(['views/email/record/list', 'autocrm:helpers/version'], (Dep, VersionHelper) => class extends Dep {
	listLayout = [
		{
			name: 'combinedCell',
			view: 'autocrm:views/email/record/combined-cell',
			notSortable: true,
			customLabel: '',
		},
	];

	selectAttributes = ['takenStatus'];

	rowActionsDisabled = true;

	lastOpenId = null;

	/**
		 * @type {module:autocrm:helpers/version.Class}
		 */
	versionHelper = null;

	setup() {
		const originalFetch = this.collection.fetch;
		const readType = 'combinedView';
		this.collection.fetch = function (options = {}) {
			const queryParams = {
				data: {readType},
			};
			const mergedOptions = {...options, ...queryParams};
			return originalFetch.call(this, mergedOptions);
		};

		this.setupEvents();

		// No better way to do this
		this.options.settingsEnabled = false;

		super.setup();

		this.versionHelper = new VersionHelper(this.getConfig());

		this.lastOpenId = null;

		this.on('remove', () => this.getParentView().clearView('combinedDetail'));
	}

	setupEvents() {
		this.events['click td.cell[data-name="combinedCell"]'] = e => {
			/* Prevents this event from firing when clicking on hover actions */
			const directTarget = $(e.target);

			if ([directTarget, directTarget.parent()].some($el => $el.hasClass('hover-actions'))) {
				return;
			}

			e.preventDefault();
			const parent = $(e.currentTarget).parent();
			const id = parent.attr('data-id');

			if (!id) {
				return;
			}

			const lastOpenId = this.lastOpenId;
			this.lastOpenId = id;

			if (lastOpenId !== id) {
				const $target = $('.record-checkbox[data-id="' + lastOpenId + '"]');

				if ($target.length) {
					$target.closest('tr').removeClass('selected');
				}
			}

			$(e.currentTarget).closest('tr').addClass('selected');

			this.actionQuickView({id: id});
		};

		delete this.events['click a.link'];
	}

	afterRender() {
		super.afterRender();

		if (!this.collection.length) {
			this.getParentView().clearView('combinedDetail');
			return;
		}

		this.loadHoverActions();
		this.colorRows();

		const emailId = this.lastOpenId || this.collection.selectedEmailId;

		if (!emailId) {
			this.switchTo(0);
			return;
		}

		this.switchOrLoad(emailId);
	}

	/**
		 * Resizes the container to properly display all content after new records are loaded
		 * Adjusts heights and triggers window resize to ensure proper layout
		 */
	resizeAfterNewContent() {
		// Give the browser a moment to render the new content
		setTimeout(() => {
			// Trigger window resize event to force recalculation of container heights
			$(window).trigger('resize');

			// If parent view has a method to adjust layout, call it
			const parentView = this.getParentView();
			if (parentView && typeof parentView.adjustLayout === 'function') {
				parentView.adjustLayout();
			}

			// Scroll to show newly loaded content
			const list = this.$el.find('.list');
			const showMoreButton = this.$el.find('.show-more');
			if (list.length && showMoreButton.length) {
				// Scroll to position the show more button at the bottom of the visible area
				const scrollPosition = showMoreButton.position().top - list.height() + showMoreButton.height() + 20;
				if (scrollPosition > 0) {
					list.scrollTop(scrollPosition);
				}
			}
		}, 50);
	}

	/**
		 * Overrides the parent showMoreRecords to properly handle hover actions for newly loaded records
		 * and ensure the collection is properly updated when total is -1
		 */
	showMoreRecords(options, collection, $list, $showMore, callback) {
		// First capture the current collection length
		const initialLength = collection ? collection.length : 0;
		collection = collection || this.collection;

		// Fix for handling negative total count
		if (collection.total === -1) {
			// If total is -1, we need to handle this specially
			// Keep track of the records we already have
			const existingRecordIds = new Set();
			collection.models.forEach(model => {
				existingRecordIds.add(model.id);
			});

			// Modify the collection's hasMore method temporarily
			const originalHasMore = collection.hasMore;
			collection.hasMore = function () {
				// Always return true if total is -1 and we have records
				// This ensures the "Show more" button remains visible
				if (this.total === -1) {
					return true;
				}
				return originalHasMore.call(this);
			};

			// Create a success handler that will restore the original hasMore method
			// after checking if any new records were actually returned
			const originalSuccess = options ? options.success : null;
			const newSuccess = (c, response) => {
				// Count how many new records were added
				let newRecordCount = 0;

				if (response && response.list) {
					response.list.forEach(record => {
						if (!existingRecordIds.has(record.id)) {
							newRecordCount++;
						}
					});
				}

				// If no new records were returned, hide the "Show more" button
				if (newRecordCount === 0) {
					$showMore.addClass('hidden');
				}

				// Restore original hasMore method
				collection.hasMore = originalHasMore;

				// Call original success handler if it exists
				if (typeof originalSuccess === 'function') {
					originalSuccess(c, response);
				}
			};

			// Apply our modified success handler
			if (options) {
				options.success = newSuccess;
			} else {
				options = {success: newSuccess};
			}
		}

		// Call the parent implementation with our wrapper callback
		const result = super.showMoreRecords(options, collection, $list, $showMore, () => {
			// Check if new records were actually added
			if (collection && collection.length > initialLength) {
				// After records are loaded, initialize hover actions for the new rows
				this.loadHoverActions();
				this.colorRows();

				// Resize the container to accommodate new content
				this.resizeAfterNewContent();
			}

			// Execute original callback if provided
			if (typeof callback === 'function') {
				callback();
			}
		});

		return result;
	}

	switchOrLoad(id) {
		if (this.collection.has(id)) {
			this.switchToId(id);
		} else {
			this.actionQuickView({id: id});
		}
	}

	colorRows() {
		this.collection.models.forEach(model => {
			const status = model.get('takenStatus');
			const style = this.getMetadata().get(['entityDefs', 'Email', 'fields', 'takenStatus', 'style', status]);

			if (!_.isString(style)) {
				return;
			}

			const color = window.getComputedStyle(document.documentElement).getPropertyValue(`--btn-${style}-bg`);

			if (color) {
				this.colorRow(model.id, color);
			}
		});
	}

	colorRow(id, color) {
		this.$el.find(`tr.list-row[data-id="${id}"]`).css('background-color', color + '99');
	}

	getSelectAttributeList(callback) {
		if (this.selectAttributes) {
			callback(this.selectAttributes);

			return;
		}

		this.getHelper().layoutManager.get('Email', 'list', listLayout => {
			const originalListLayout = this.listLayout;

			this.listLayout = listLayout;
			callback(this.fetchAttributeListFromLayout());

			this.listLayout = originalListLayout;
		});
	}

	removeRecordFromList(id) {
		const index = this.collection.models.findIndex(model => model.id === id);

		super.removeRecordFromList(id);

		if (this.lastOpenId !== id) {
			return;
		}

		this.lastOpenId = null;
		this.switchTo(index);
	}

	/**
		 * Tries to fetch the model, if it's not in the collection
		 *
		 * @return {Promise<module:model.Class>}
		 * */
	getModel(id) {
		if (this.collection.has(id)) {
			return new Promise(resolve => resolve(this.collection.get(id)));
		}

		return new Promise(resolve => {
			this.getModelFactory()
				.create('Email', model => (model.id = id))
				.then(model => model.fetch().then(() => resolve(model)));
		});
	}

	actionQuickView(data) {
		const parentView = this.getParentView();

		this.getModel(data.id).then(model => {
			if (parentView.hasView('combinedDetail') && parentView.getView('combinedDetail').model.id === data.id) {
				return;
			}

			const viewName =
					this.getMetadata().get(['clientDefs', 'Email', 'recordViews', 'detailCombined']) ||
					'autocrm:views/email/record/combined-detail';

			const options = {
				model: model,
				el: this.getParentView().getSelector() + ' .detail-container',
			};

			Espo.Ui.notifyWait();

			parentView.createView('combinedDetail', viewName, options, view => {
				model.fetch();

				this.listenToOnce(view, 'after:render', () => {
					Espo.Ui.notify(false);
				});

				this.listenToOnce(view, 'after:save', model => this.trigger('after:save', model));

				this.listenTo(model, 'after:save', () => this.collection.fetch());

				this.listenTo(view, 'switch-neighbor', data => this.switchNeighbor(model, data.direction));

				this.listenTo(view, 'delete', () => {
					this.removeRecordFromList(model.id);
				});

				this.listenTo(view, 'clicked-reply', id => {
					this.switchOrLoad(id);
				});

				this.trigger('select', model);

				view.render();
			});
		});
	}

	switchNeighbor(model, direction = 1) {
		const index = this.collection.indexOf(model) + direction;

		this.switchTo(index);
	}

	switchTo(index) {
		const newIndex = Math.min(this.collection.length - 1, Math.max(0, index));
		const neighbourId = this.collection.at(newIndex).id;

		this.switchToId(neighbourId);
	}

	switchToId(id) {
		this.$el.find('.list-row[data-id="' + id + '"] > .cell[data-name="combinedCell"]').trigger('click');
	}

	/**
		 * Loads the hover actions for every model in view's collection.
		 * Creates hover action elements and appends them to the combined cell element of each row.
		 * @returns {void}
		 * @throws {Error} If the row or combined cell element is not found.
		 *
		 * @see createHoverActions()
		 */
	loadHoverActions() {
		for (const model of this.collection.models) {
			const $row = this.$el.find(`tr.list-row[data-id="${model.id}"]`);

			if (!$row.length) {
				// Don't throw an error, just skip this row
				console.warn(`Row not found for email ID: ${model.id}`);
				continue;
			}

			// Skip if the row already has hover actions
			if ($row.find('.hover-actions').length > 0) {
				continue;
			}

			try {
				const $hoverActions = $('<td class="hover-actions"></td>');
				const $container = $('<div class="container"></div>');

				$container.append(...this.createHoverActions(model));
				$hoverActions.append($container);
				$row.append($hoverActions);
			} catch (error) {
				console.error(`Error adding hover actions to email ID: ${model.id}`, error);
				// Continue processing other rows even if one fails
			}
		}
	}

	computeBackgroundColor($el) {
		if (!this._defaultBackground) {
			this._defaultBackground = $('<div/>').css('background-color');
		}

		const backgroundColor = $el.css('background-color');

		if (backgroundColor === this._defaultBackground) {
			if (!$el.parent().length) {
				return backgroundColor;
			}

			return $el.parent().css('background-color');
		}

		return backgroundColor;
	}

	/** Class representing a hover action. */
	HoverAction = class {
		/**
			 * Creates a new instance of HoverAction.
			 *
			 * Creates the jquery element, applies default active value,
			 * creates event listener that will execute the provided action.
			 *
			 * @param {string} className element's custom css class name
			 * @param {string} faIcon element's font awesome icon class name
			 * @param {boolean} active whether the hover action is active or not at the start
			 * @param {() => boolean} action the action to be executed on click, should return true or false
			 * whether the hover action state should be active or not after the action is executed
			 */
		constructor(className, faIcon, active, action) {
			this.className = className;
			this.faIcon = faIcon;
			this.active = active;
			this.action = action;

			this.$el = this.createElement();
			this.setActive(active);
			this.event();
		}

		/**
			 * Returns the element of this hover action.
			 *
			 * @returns {jQuery|*} jquery element
			 * @throws {Error} if the element is not created yet
			 */
		element() {
			if (!this.$el) throw new Error('Element used before creation');
			return this.$el;
		}

		/**
			 * Creates "onclick" event listener for this hover action element,
			 * which will execute the provided action and set the
			 * hover action to active or inactive based on the result.
			 */
		event() {
			this.element().on('click', () => {
				this.setActive(this.action());
			});
		}

		/**
			 * Sets the hover action state to active or inactive.
			 * And then adds or removes the "active" class to the element, respectively.
			 *
			 * @param {boolean} active
			 */
		setActive(active) {
			this.element().toggleClass('active', active);
		}

		/**
			 * Creates and returns the jquery element for this hover action.
			 * @returns {jQuery|*}
			 */
		createElement() {
			return $(`<i class="fas ${this.faIcon} ${this.className}"></i>`);
		}
	};

	/**
		 * Creates hover actions for a model
		 * @param model to which model the hover actions should be applied
		 * @returns {jQuery[]|*[]} array of jquery elements corresponding to the created hover actions
		 *
		 * @see HoverAction
		 */
	createHoverActions(model) {
		return [
			new this.HoverAction('trash', 'fa-trash', model.get('inTrash'), () => {
				const inTrash = model.get('inTrash');

				if (inTrash) {
					this.actionRetrieveFromTrash({id: model.id});
				} else {
					this.actionMoveToTrash({id: model.id});
				}

				return !inTrash;
			}),
			new this.HoverAction('read', 'fa-check', model.get('isRead'), () => {
				const isRead = model.get('isRead');

				this.actionMarkAsRead(model.id, !isRead);

				return !isRead;
			}),
			new this.HoverAction('important', 'fa-star', model.get('isImportant'), () => {
				const isImportant = model.get('isImportant');

				if (isImportant) this.actionMarkAsNotImportant({id: model.id});
				else this.actionMarkAsImportant({id: model.id});

				return !isImportant;
			}),
		].map(hoverAction => hoverAction.element());
	}

	/**
		 * Mark an email as read or unread
		 *
		 * (EspoCRM does not have a built-in method to mark
		 * a single email message as read/unread, so we have
		 * to create our own.)
		 *
		 * @param {string} id The id of the email
		 * @param {boolean} read Set the email as read or unread
		 * @returns {void}
		 */
	actionMarkAsRead(id, read) {
		let promise;

		if (read) {
			promise = Espo.Ajax.postRequest(`Email/inbox/read`, {
				ids: [id],
			});
		} else {
			promise = Espo.Ajax.deleteRequest(`Email/inbox/read`, {
				ids: [id],
			});
		}

		const model = this.collection.get(id);

		if (model) {
			promise.then(() => model.set('isRead', read));
		}
	}
});
