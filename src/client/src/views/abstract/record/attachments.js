define(['view'], Dep => class extends Dep {
	template = 'autocrm:abstract/record/attachments';

	events = {
		'click [data-action="selectAttachment"]': e => {
			const id = $(e.target).data('id');
			this.previewAttachment(id);
		},
		'click [data-action="prevAttachment"]': _ => {
			this.prevAttachment();
		},
		'click [data-action="nextAttachment"]': _ => {
			this.nextAttachment();
		}
	};

	constructor(...args) {
		super(...args);
		// Prepare an in‑memory cache for fetched attachment files.
		this.attachmentCache = {};

		// Get the attachment field name from options, default to 'attachments'
		this.attachmentField = this.options.attachmentField || 'attachments';
	}

	// Helper: detect MIME type by file extension
	detectFileType(fileName, providedType) {
		if (providedType) return providedType;

		const extension = fileName.split('.').pop().toLowerCase();
		const extensionMap = {
			'pdf': 'application/pdf',
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'png': 'image/png',
			'gif': 'image/gif',
			'txt': 'text/plain',
			'csv': 'text/csv'
		};

		return extensionMap[extension] || 'application/octet-stream';
	}

	// Helper: get the attachment file.
	// It first checks if the file is already cached.
	// expectedType is used to enforce a proper MIME type (for example, for PDFs).
	getAttachmentFile(attachment, expectedType) {
		const url = `${this.getBasePath()}?entryPoint=download&id=${attachment.id}`;

		if (this.attachmentCache[attachment.id]) {
			return Promise.resolve(this.attachmentCache[attachment.id]);
		}

		return fetch(url)
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.blob();
			})
			.then(blob => {
				if (expectedType && blob.type !== expectedType) {
					blob = new Blob([blob], {type: expectedType});
				}
				const objectUrl = URL.createObjectURL(blob);
				this.attachmentCache[attachment.id] = objectUrl;
				return objectUrl;
			});
	}

	// Preview the attachment by id.
	previewAttachment(id) {
		// Update “active” styling on attachment selection.
		this.$el.find('[data-action="selectAttachment"]').removeClass('active');
		this.$el.find(`[data-action="selectAttachment"][data-id="${id}"]`).addClass('active');

		// Hide all attachment containers and then show the selected one.
		this.$el.find('.attachment-container').hide();
		const container = this.$el.find(`.attachment-container[data-id="${id}"]`);
		container.show();

		// Find the attachment details.
		const attachment = this.attachments.find(a => a.id === id);
		if (!attachment) return;

		// Determine MIME type by file name (or using provided type)
		const detectedType = this.detectFileType(attachment.name, attachment.type);
		container.empty();

		// For images, use the direct URL.
		if (detectedType.startsWith('image/')) {
			const downloadUrl = `${this.getBasePath()}?entryPoint=download&id=${attachment.id}`;
			const img = $('<img>', {
				src: downloadUrl,
				class: 'attachment-preview-image',
				style: 'max-width: 100%; max-height: 500px;'
			});
			container.append(img);

			// For PDFs, use the helper to fetch (or retrieve from cache) and then create
			// an object URL with MIME type set to "application/pdf".
		} else if (detectedType === 'application/pdf') {
			this.getAttachmentFile(attachment, 'application/pdf')
				.then(objectUrl => {
					const iframe = $('<iframe>', {
						src: objectUrl,
						class: 'pdf-preview',
						style: 'width: 100%; height: 500px; border: none;'
					});
					container.append(iframe);
				})
				.catch(error => {
					console.error('Error loading PDF preview:', error);
					container.text('Error loading PDF preview.');
				});

			// For text files, fetch similarly so that caching applies.
		} else if (detectedType.startsWith('text/')) {
			this.getAttachmentFile(attachment, detectedType)
				.then(objectUrl => {
					const iframe = $('<iframe>', {
						src: objectUrl,
						class: 'text-preview',
						style: 'width: 100%; height: 500px; border: none;'
					});
					container.append(iframe);
				})
				.catch(error => {
					console.error('Error loading text file preview:', error);
					container.text('Error loading text file preview.');
				});

			// For any other file types, simply offer a download link.
		} else {
			const downloadUrl = `${this.getBasePath()}?entryPoint=download&id=${attachment.id}`;
			const downloadLink = $('<a>', {
				href: downloadUrl,
				text: `Download ${attachment.name}`,
				class: 'btn btn-primary'
			});
			container.append(downloadLink);
		}

		// Update the pagination control appearance
		//this.updatePaginationControls();
	}

	// Moves to the next attachment; wraps to the first if at the end.
	nextAttachment() {
		const currentIndex = this.attachments.findIndex(a => a.active);
		let nextIndex = currentIndex + 1;
		if (nextIndex >= this.attachments.length) {
			nextIndex = 0;
		}
		this.attachments.forEach((a, idx) => {
			a.active = (idx === nextIndex);
		});
		this.previewAttachment(this.attachments[nextIndex].id);
	}

	// Moves to the previous attachment; wraps to the last if at the beginning.
	prevAttachment() {
		const currentIndex = this.attachments.findIndex(a => a.active);
		let prevIndex = currentIndex - 1;
		if (prevIndex < 0) {
			prevIndex = this.attachments.length - 1;
		}
		this.attachments.forEach((a, idx) => {
			a.active = (idx === prevIndex);
		});
		this.previewAttachment(this.attachments[prevIndex].id);
	}

	// Optionally update or show a container with pagination controls.
	updatePaginationControls() {
		// Look for a container for pagination controls.
		let paginationContainer = this.$el.find('.attachment-pagination');
		if (this.attachments.length <= 1) {
			if (paginationContainer.length) {
				paginationContainer.hide();
			}
			return;
		}

		if (paginationContainer.length === 0) {
			// If not already present, create it.
			paginationContainer = $('<div>', {
				class: 'attachment-pagination',
				style: 'margin-top: 10px;'
			});
			const prevButton = $('<button>', {
				text: this.translate('Previous', 'labels'),
				'data-action': 'prevAttachment',
				class: 'btn btn-secondary'
			});
			const nextButton = $('<button>', {
				text: this.translate('Next', 'labels'),
				'data-action': 'nextAttachment',
				class: 'btn btn-secondary',
				style: 'margin-left: 5px;'
			});
			paginationContainer.append(prevButton, nextButton);
			// Append the pagination container to the module's element.
			this.$el.append(paginationContainer);
		} else {
			paginationContainer.show();
		}
	}

	data() {
		const attachments = [];
		let attachmentIds = [];

		// Get field type to determine how to access attachment data
		const fieldType = this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.attachmentField, 'type']);

		if (fieldType === 'file') {
			// For 'file' type, the field contains a single attachment ID
			const attachmentId = this.model.get(this.attachmentField + 'Id');
			if (attachmentId) {
				attachmentIds = [attachmentId];
			}
		} else {
			// For 'attachmentMultiple' type, the field has an 'Ids' suffix with an array
			attachmentIds = this.model.get(this.attachmentField + 'Ids') || [];
		}

		const selectedId = this.selectedId || attachmentIds[0];

		// Get the names and types maps
		const attachmentsNames = this.model.get(this.attachmentField + 'Names') || {};
		const attachmentsTypes = this.model.get(this.attachmentField + 'Types') || {};

		attachmentIds.forEach(id => {
			attachments.push({
				id,
				name: attachmentsNames[id],
				type: attachmentsTypes[id],
				active: id === selectedId
			});
		});

		// Store attachments for later use.
		this.attachments = attachments;

		return {
			attachments,
			downloadUrl: this.getBasePath() + '?entryPoint=download&forceDownload=true&id=',
			baseUrl: this.getBasePath() + '?entryPoint=attachmentInline&id='
		};
	}

	afterRender() {
		if (this.attachments && this.attachments.length > 0) {
			this.previewAttachment(this.attachments[0].id);
		}
		/*if (this.attachments && this.attachments.length > 1) {
				this.updatePaginationControls();
			}*/
	}
});