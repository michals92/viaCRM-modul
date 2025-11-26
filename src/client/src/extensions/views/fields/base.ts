import type BaseFieldView from 'espocrm/src/views/fields/base';

extend<BaseFieldView>(Dep => class extends Dep {
	MODE_EDITABLE_LIST = 'list-editable';

	_inlineEditNamespace = 'closeInlineListEdit';

	_isEditableListMode = false;

	override init(): void {
		this.listEditDisabled = this.options.inlineEditDisabled ?? this.options.listEditDisabled;

		if (typeof this.listEditDisabled === 'undefined') {
			this.listEditDisabled = true;
		}

		super.init();

		const searchTypeList = this.getMetadata().get(['entityDefs', this.model.name, 'fields', this.name, 'searchTypeList']) as string[] | null;

		if (searchTypeList) {
			this.searchTypeList = searchTypeList;
		}
		// onListModeSet is first called in setupFinal, however we need to change the mode before setup
		// IMPORTANT: Don't override MODE_LIST_LINK as it's used for fields with link: true
		if (this.mode === this.MODE_LIST && !this.listEditDisabled) {
			this.mode = this.MODE_EDITABLE_LIST;
		}
	}

	override setupFinal(): void {
		if (this.mode === this.MODE_EDITABLE_LIST) {
			this.mode = this.MODE_LIST;
		}

		super.setupFinal();
	}

	override onListModeSet(): Promise<void> | undefined {
		if (!this.listEditDisabled) {
			this._isEditableListMode = true;

			this.once('after:render', () => {
				this.initListInlineEdit();
			});
		}

		return super.onListModeSet();
	}

	override inlineEdit(): Promise<void> {
		const callback = (e: JQuery.ClickEvent): void => {
			const $cell = this.get$cell();

			if (!$cell.length || $cell.find(e.target).length) {
				return;
			}

			this.inlineEditSave();
		};

		return super.inlineEdit().then(() => {
			if (this._isEditableListMode) {
				this.$el.closest('.list').toggleClass('edit-mode', true);
				$('#content').on('click.inline-edit-list', callback);

				return;
			}

			$('#content').on('dblclick.inline-edit', callback);
		});
	}

	initListInlineEdit(): void {
		if (this.disabled || this.readOnly || this.$el.find('.inline-edit-list').length) {
			return;
		}
		const $editLink = $('<a>')
			.attr('role', 'button')
			.addClass('inline-edit-list inline-edit-link hidden')
			.append($('<span>').addClass('fas fa-pencil-alt fa-sm'));

		this.$el.append($editLink);

		$editLink.on('click', () => this.inlineEdit());

		this.$el
			.on('mouseenter', () => {
				if (!this.isEditMode()) {
					$editLink.removeClass('hidden');
				}
			})
			.on('mouseleave', () => {
				if (!this.isEditMode()) {
					$editLink.addClass('hidden');
				}
			})
			.on('click', (e: JQuery.ClickEvent) => {
				e.stopPropagation();
			});
	}

	override addInlineEditLinks(): void {
		if (!this._isEditableListMode) {
			super.addInlineEditLinks();
		}
	}

	// when inline edit changes to normal edit mode remove the save-on-outside-click handler
	override setIsInlineEditMode(value: boolean): void {
		super.setIsInlineEditMode(value);

		if (!value) {
			this.removeDocumentClickListener();
		}
	}

	removeDocumentClickListener(): void {
		$('#content').off('click.inline-edit-list').off('dblclick.inline-edit');
	}

	override inlineEditClose(dontReset?: boolean): Promise<void> {
		this.removeDocumentClickListener();

		if (!this._isEditableListMode) {
			return super.inlineEditClose(dontReset);
		}

		this.trigger('inline-edit-list-off');
		this.$el.off('keydown.inline-edit');

		this.$el.closest('.list').toggleClass('edit-mode', false);

		this._value = false;
		this.setMode(this.MODE_LIST);

		this.once('after:render', () => {
			this.initListInlineEdit();
		});

		if (!dontReset) {
			this.model.set(this.initialAttributes);
		}

		this.reRender(true);
		this.trigger('after:inline-edit-list-off');

		return Promise.resolve();
	}

});
