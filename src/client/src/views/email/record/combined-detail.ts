import type ModalView from "espocrm/src/views/modal";

define(['views/record/detail', 'views/email/detail'], (Dep, Detail) => class extends Dep {
	override setup() {
		super.setup();

		this.setupEvents();
		const emailDoNotMarkAsReadList: string[] = this.getPreferences().get('emailDoNotMarkAsReadList') || [];
		const readType = this?.collection ? 'combinedView' : null;
			
		if (readType) {
			const originalFetch = this.model.fetch;
			this.model.fetch = function (options = {}) {
				const queryParams = {
					data: {readType},
				};
				const mergedOptions = {...options, ...queryParams};
				return originalFetch.call(this, mergedOptions);
			};
		}

		if (!readType || !emailDoNotMarkAsReadList.includes(readType)) {
			this.listenToOnce(this.model, 'sync', () => setTimeout(() => this.model.set('isRead', true), 25));
		}

		this.setupButtons();
	}

	setupEvents() {
		this.events['click .field[data-name="replies"] a, .field[data-name="replied"] a'] = (e: any) => {
			e.preventDefault();
			const target = $(e.currentTarget);
			const id = target.attr('data-id') || (target.attr('href') as string).split('/').pop();
			this.trigger('clicked-reply', id);
		};

		this.events['auxclick button[data-name="fullForm"]'] = e => {
			this.actionFullForm({name: 'fullForm'}, e);
		};
	}

	setupButtons() {
		this.addButton(
			{
				name: 'forward',
				label: 'Forward',
			},
			false,
		);

		if (this.getAcl().checkScope('Task', 'create')) {
			this.addButton(
				{
					name: 'createTask',
					label: 'Create Task',
					style: 'success',
				},
				false,
			);
		}

		this.addButton(
			{
				name: this.getPreferences().get('emailReplyToAllByDefault') ? 'replyToAll' : 'reply',
				label: 'Reply',
				style: 'danger',
			},
			false,
		);

		this.addButton(
			{
				name: 'fullForm',
				label: 'Full Form',
			},
			false,
		);

		this.addDropdownItem(false, true);

		this.addDropdownItem(
			{
				label: 'Reply to All',
				name: 'replyToAll',
			},
			true,
		);

		this.addDropdownItem(
			{
				label: 'Reply',
				name: 'reply',
			},
			true,
		);

		this.addDropdownItem(false);

		if (this.model.get('status') === 'Archived') {
			if (!this.model.get('parentId')) {
				if (this.getAcl().checkScope('Lead', 'create')) {
					this.addDropdownItem({
						label: 'Create Lead',
						name: 'createLead',
					});
				}

				if (this.getAcl().checkScope('Contact', 'create')) {
					this.addDropdownItem({
						label: 'Create Contact',
						name: 'createContact',
					});
				}
			}
		}

		if (this.getAcl().checkScope('Task', 'create')) {
			this.addDropdownItem({
				label: 'Create Task',
				name: 'createTask',
			});
		}

		if (this.getAcl().checkScope('Meeting', 'create')) {
			this.addDropdownItem({
				label: 'Create Meeting',
				name: 'createMeeting',
			});
		}

		if (this.model.get('parentType') !== 'Case' || !this.model.get('parentId')) {
			if (this.getAcl().checkScope('Case', 'create')) {
				this.addDropdownItem({
					label: 'Create Case',
					name: 'createCase',
				});
			}
		}
	}

	actionFullForm(_data, e) {
		const router = this.getRouter();

		const url = '#Email/view/' + this.model.id;
		const options = {
			attributes: {...this.fetch(), ...this.model.getClonedAttributes()},
			returnUrl: this.getRouter().getCurrentUrl(),
			model: this.model,
			id: this.model.id,
		};

		if (e && e.which === 2) {
			// Middle mouse button click
			window.open(url, '_blank');
		} else {
			setTimeout(() => {
				router.dispatch('Email', 'view', options);
				router.navigate(url, {trigger: false});
			}, 10);
		}
	}

	actionCreateLead() {
		Detail.prototype.actionCreateLead.call(this);
	}

	actionCreateContact() {
		Detail.prototype.actionCreateContact.call(this);
	}

	actionCreateTask() {
		Detail.prototype.actionCreateTask.call(this);
	}

	actionCreateMeeting(): void {
		const attributes: Record<string, any> = {};

		attributes.parentId = this.model.get('parentId');
		attributes.parentName = this.model.get('parentName');
		attributes.parentType = this.model.get('parentType');
		attributes.originalEmailId = this.model.id;

		const subject = this.model.get('name');

		attributes.description = `[${this.translate('Email', 'scopeNames')}: ${subject}](#Email/view/${this.model.id})`;

		Espo.Ui.notifyWait();

		this.createView('quickCreate', 'views/modals/edit', {
			scope: 'Meeting',
			attributes: attributes,
		}, (view: ModalView) => {
			view.render();

			this.listenToOnce(view, 'after:save', () => {
				view.close();
				this.model.fetch();
			});
		});
	}

	actionCreateCase() {
		Detail.prototype.actionCreateCase.call(this);
	}

	actionForward() {
		Detail.prototype.actionForward.call(this);
	}

	actionReply(data, e, cc: boolean) {
		Detail.prototype.actionReply.call(this, data, e, cc);
	}

	actionReplyToAll(data, e) {
		Detail.prototype.actionReplyToAll.call(this, data, e);
	}

	override actionPrevious() {
		this.trigger('switch-neighbor', {
			direction: -1,
		});
	}

	override actionNext() {
		this.trigger('switch-neighbor', {
			direction: 1,
		});
	}

	// Hacks for email detail view methods
	getRecordView() {
		return this;
	}

	removeMenuItem(name) {
		this.removeActionItem(name);
	}

	exitAfterDelete() {
		return true; // prevent folder change on delete
	}
});