import type EmailListView from 'espocrm/src/views/email/list';

extend<EmailListView>(Dep => class extends Dep {
	lastMove: {
            ids: string[];
            fromFolder: string;
            toFolder: string;
        } | null = null;

	override setup() {
		super.setup();

		// Add CTRL+Z handler
		$(document).on('keydown.email-folder-undo', e => {
			if (e.ctrlKey && e.key === 'z') {
				this.undoLastMove();
			}
		});
	}

	override createListRecordView(fetch) {
		return super.createListRecordView(fetch).then(view => {
			this.listenTo(view, 'after:render', () => this.initDraggable(null));
			this.listenTo(view, 'after:show-more', fromIndex => this.initDraggable(fromIndex));
		});
	}

	override onDrop(folderId: string, id: string | true): void {
		const recordView = this.getEmailRecordView();
		if (folderId === this.FOLDER_IMPORTANT) {
			setTimeout(() => {
				id === true ? recordView.massActionMarkAsImportant() : recordView.actionMarkAsImportant({id: id});
			}, 10);
			return;
		}

		if (this.selectedFolderId === this.FOLDER_TRASH) {
			if (folderId === this.FOLDER_TRASH) {
				return;
			}

			id === true
				? recordView.massRetrieveFromTrashMoveToFolder(folderId)
				: recordView.actionRetrieveFromTrashMoveToFolder({id: id, folderId: folderId});
			return;
		}

		if (folderId === this.FOLDER_TRASH) {
			id === true ? recordView.massActionMoveToTrash() : recordView.actionMoveToTrash({id: id});
			return;
		}

		if (this.selectedFolderId.indexOf('group:') === 0 && folderId === this.FOLDER_ALL) {
			folderId = this.FOLDER_INBOX;
		}
		// Use the new moveToFolder method
		this.moveToFolder(folderId, id);
	}

	override initDraggable(fromIndex: number | null) {
		fromIndex = fromIndex || 0;

		if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
			return;
		}

		const $container = this.$el.find('.list-container .list tbody');
		const recordView = this.getEmailRecordView();
		let $helper: JQuery | null = null;

		this.collection.models.slice(fromIndex).forEach(model => {
			const $row = $container.find(`tr.list-row[data-id="${model.id}"]`);

			$row.draggable({
				cancel: 'input,textarea,button,select,option,.dropdown-menu,.action',
				helper: () => {
					let text = this.translate('Moving to Folder', 'labels', 'Email');

					if (
						recordView.isIdChecked(model.id) &&
                            !recordView.allResultIsChecked &&
                            recordView.checkedList.length > 1
					) {
						text += ' · ' + recordView.checkedList.length;
					}

					let draggedId = model.id;
					if (recordView.isIdChecked(model.id) && !recordView.allResultIsChecked) {
						draggedId = '';
					}

					$helper = $('<div>')
						.attr('data-id', draggedId)
						.addClass('draggable-helper')
						.css({
							cursor: 'grabbing',
							padding: '5px 10px',
							background: '#fff',
							border: '1px solid #ddd',
							'border-radius': '3px',
							'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
						})
						.text(text);

					return $helper;
				},
				handle: 'td:not(.action-cell)',
				distance: 8,
				containment: 'body',
				appendTo: 'body',
				cursor: 'grabbing',
				cursorAt: {top: 15, left: 15},
				zIndex: 9999,
				start: e => {
					$(e.target).addClass('being-dragged');
				},
				stop: e => {
					$(e.target).removeClass('being-dragged');
					if (!recordView.isIdChecked(model.id)) {
						$container.find(`tr.list-row[data-id="${model.id}"]`).removeClass('active');
					}
				},
			});
		});
	}

	override initDroppable() {
		this.$el.find('.folders-container .list-group > .list-group-item.droppable').droppable({
			accept: '.list-row',
			tolerance: 'pointer',
			hoverClass: 'drag-over',
			over: (e, ui) => {
				const $target = $(e.target);
				const folderName = $target.find('a.side-link').not('.count').text().trim();
				const $helper = $(ui.helper);

				let text = this.translate('Moving to', 'labels', 'Email') + ' ' + folderName;

				const recordView = this.getEmailRecordView();
				const draggedId = $helper.attr('data-id');
				if (
					draggedId !== undefined &&
                        recordView.isIdChecked(draggedId) &&
                        !recordView.allResultIsChecked &&
                        recordView.checkedList.length > 1
				) {
					text += ' · ' + recordView.checkedList.length;
				}

				$helper.text(text);

				$target.removeClass('success').addClass('active');
				$target.find('a').css('pointer-events', 'none');
			},
			out: (e, ui) => {
				const $target = $(e.target);
				const $helper = $(ui.helper);

				let text = this.translate('Moving to Folder', 'labels', 'Email');

				const recordView = this.getEmailRecordView();
				const draggedId = $helper.attr('data-id');
				if (
					draggedId !== undefined &&
                        recordView.isIdChecked(draggedId) &&
                        !recordView.allResultIsChecked &&
                        recordView.checkedList.length > 1
				) {
					text += ' · ' + recordView.checkedList.length;
				}

				$helper.text(text);

				$target.removeClass('active');
				$target.find('a').css('pointer-events', '');
			},
			drop: (e, ui) => {
				const $target = $(e.target);
				const $helper = $(ui.helper);

				$target.find('a').css('pointer-events', '');

				const folderId = $target.attr('data-id') as string;
				let id = $helper.attr('data-id') as any;
				id = id === '' ? true : id;

				this.onDrop(folderId, id);

				$target.removeClass('active').addClass('success');
				setTimeout(() => $target.removeClass('success'), 1000);
			},
		});
	}

	async undoLastMove(): Promise<void> {
		if (!this.lastMove) {
			return;
		}

		const {ids, fromFolder, toFolder} = this.lastMove;

		// Clear the last move before performing undo to prevent undo loops
		const moveToUndo = this.lastMove;
		this.lastMove = null;

		try {
			await this.moveToFolder(fromFolder, ids);

			// Store the reverse operation
			this.lastMove = {
				ids: ids,
				fromFolder: toFolder,
				toFolder: fromFolder,
			};
		} catch (error) {
			// Restore the original last move in case of error
			this.lastMove = moveToUndo;
			console.error('Error undoing move:', error);
		}
	}

	override setupReuse(params) {
		super.setupReuse(params);
		this.initDroppable();
	}

	override afterRender() {
		super.afterRender();
		this.initDroppable();
	}

	/**
         * Moves emails to a different folder
         * @param folderId - The target folder ID
         * @param ids - Single email ID or true for checked emails
         * @returns Promise
         */
	async moveToFolder(folderId: string, ids: string | true | string[]): Promise<void> {
		// Handle different types of ids input
		const emailIds = Array.isArray(ids) ? ids : ids === true ? this.getEmailRecordView().checkedList : [ids];
		const data = {ids: emailIds};

		await Espo.Ajax.postRequest(`Email/inbox/folders/${folderId}`, data)
			.then(async () => {
				this.lastMove = {
					ids: emailIds,
					fromFolder: this.selectedFolderId,
					toFolder: folderId,
				};
				const $folder = this.$el.find(`.folders-container .list-group-item[data-id="${folderId}"]`);
				const folderName = $folder.find('a.side-link').not('.count').text().trim();
				await this.collection.fetch().then(() => {
					//this.reRender();
					Espo.Ui.success(this.translate('Moved to folder', 'labels', 'Email') + ' ' + folderName);
				});
			})
			.catch(() => {
				Espo.Ui.error(this.translate('Error occurred', 'labels'));
			});
	}
});
