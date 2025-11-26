import type AttachmentMultipleFieldView from 'espocrm/src/views/fields/attachment-multiple';

interface CopyAttachmentsModel {
	get(name: string): unknown;
}

extend<AttachmentMultipleFieldView>(
	Dep =>
		class extends Dep {
			override validations = ['ready', 'required', 'maxCount', 'minCount'];

			override setup(): void {
				this.showPreviewsInListMode = this.params.showPreviewsInListMode ?? this.showPreviewsInListMode;

				super.setup();
			}

			/**
			 * Get maximum allowed file size considering all constraints.
			 * Behavior depends on the forcePhpMaxFileSize setting:
			 * - If true (default): Always enforce PHP upload limits
			 * - If false: Use original behavior allowing chunked uploads to exceed PHP limits
			 *
			 * @return Max file size in MB.
			 */
			override getMaxFileSize(): number {
				const forcePhpMaxFileSize = this.getConfig().get('forcePhpMaxFileSize') ?? true;

				if (forcePhpMaxFileSize) {
					const maxFileSize = super.getMaxFileSize() || 0;
					const post_max_size = this.getHelper().getAppParam('maxUploadSize') || 0;

					if (maxFileSize > post_max_size) {
						return post_max_size;
					}

					return maxFileSize;
				} else {
					// Vanilla Espo behavior
					return super.getMaxFileSize();
				}
			}

			override afterRender(): void {
				super.afterRender();

				if (this.isDetailMode() && (this.model.get(this.name + 'Ids') || []).length > 0) {
					this.addAttachmentButtons();
				}
			}

			validateMinCount(): boolean {
				const minCount = this.params.minCount;

				if (!minCount) {
					return false;
				}

				const idList = this.model.get(this.idsName) || [];

				if (idList.length >= minCount) {
					return false;
				}

				const msg = this.translate('fieldUnderMinCount', 'messages')
					.replace('{field}', this.getLabelText())
					.replace('{minCount}', minCount.toString());

				this.showValidationMessage(msg, 'label');

				return true;
			}

			override getDownloadUrl(id: string): string {
				let url: string = super.getDownloadUrl(id);

				if (this.params.forceDownload) {
					url += '&forceDownload=true';
				}

				return url;
			}

			addAttachmentButtons(): void {
				const $wrapper = $('<div>', {
					class: 'input-group',
				});

				if (this.params.copyAttachmentsButton ?? false) {
					$wrapper.append(this.createCopyAttachmentsButton());
				}

				if (this.params.zipAttachmentsButton ?? false) {
					$wrapper.append(this.createZipAttachmentsButton());
				}

				this.$el.prepend($wrapper);
			}

			createCopyAttachmentsButton(): JQuery {
				const $button = $('<button>', {
					type: 'button',
					class: 'btn btn-default',
					style: 'width: auto;',
					'data-name': 'copyAttachments',
					'data-action': 'copyAttachments',
				})
					.attr('title', this.translate('Copy Attachments', 'labels', 'Global'))
					.append($('<span>', { class: 'fas fa-copy fa-sm' }));

				$button.on('click', this.actionCopyAttachments.bind(this));

				return $button;
			}

			createZipAttachmentsButton(): JQuery {
				const $zipButton = $('<button>', {
					type: 'button',
					class: 'btn btn-default',
					style: 'width: auto;',
					'data-name': 'zipAttachments',
					'data-action': 'zipAttachments',
				})
					.attr('title', this.translate('Zip Attachments', 'labels', 'Global'))
					.append($('<span>', { class: 'fas fa-download fa-sm' }));

				$zipButton.on('click', this.actionZipAttachments.bind(this));

				return $zipButton;
			}

			actionZipAttachments(): void {
				const ids = [this.model.id];
				const entityType = this.model.name;
				const field = this.name;

				const url = `/api/v1/Attachment/action/zip?entityType=${entityType}&field=${field}&ids=${ids.join(
					',',
				)}`;

				window.open(url, '_blank');
			}

			actionCopyAttachments(): void {
				let entityList = this.params.copyAttachmentsEntityList || [];

				if (entityList.length === 0) {
					entityList = this.getEntitiesWithAttachmentMultiple();
				}

				this.createView(
					'dialog',
					'viacrm:views/modals/copy-attachments',
					{
						entityList,
					},
					(view: { render: () => void }) => {
						view.render();
						this.listenToOnce(view, 'done', this.handleCopyAttachmentsDone.bind(this));
					},
				);
			}

			handleCopyAttachmentsDone(model: CopyAttachmentsModel): void {
				const createNew = model.get('createNew');
				const parentId = createNew ? null : model.get('entityId');
				const parentType = model.get('entityType');
				const attachmentField = model.get('attachmentField');

				Espo.Ajax.postRequest('Attachment/action/copy', {
					ids: this.model.get(this.name + 'Ids'),
					parentId,
					parentType,
					attachmentField: attachmentField || this.name,
				})
					.then((response: Record<string, unknown>) => {
						const router = this.getRouter();

						if (createNew) {
							const returnUrl = router.getCurrentUrl();

							router.navigate(`#${parentType}/create`, { trigger: false });
							router.dispatch(parentType, 'create', {
								attributes: response,
								returnUrl,
							});
						} else {
							router.navigate(`#${parentType}/view/${parentId}`, { trigger: false });
							router.dispatch(parentType, 'view', { id: parentId });
						}
					})
					.catch((error: unknown) => {
						console.error('Error copying attachments:', error);
					});
			}

			getEntitiesWithAttachmentMultiple(): string[] {
				const entityDefs = this.getMetadata().get('entityDefs') || {};

				return (
					Object.entries(entityDefs)
						.filter(
							([_, entityDef]) =>
								!(entityDef as Record<string, unknown>).disableAttachments &&
								Object.values((entityDef as Record<string, unknown>).fields || {}).some(
									(field) => (field as Record<string, unknown>).type === 'attachmentMultiple',
								),
						)
						.map(([entityType]) => entityType) || []
				);
			}
		},
);
