extend(Dep => class extends Dep {
	setup() {
		super.setup();

		this.once('after:render', this.initializeDragAndDrop.bind(this));
	}

	private initializeDragAndDrop(): void {
		if (!this.$el?.length) {
			return;
		}

		const element = this.$el.get(0);

		element.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			this.handleDragOver(e);
		});

		element.addEventListener('dragleave', (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			this.handleDragLeave();
		});

		element.addEventListener('drop', async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			await this.handleDrop(e);
		});
	}

	private handleDragOver(e: DragEvent): void {
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}

		const isImage = this.hasImageFile(e);
		this.$el.addClass(isImage ? 'drag-over-valid' : 'drag-over-invalid');
	}

	private handleDragLeave(): void {
		this.$el.removeClass('drag-over-valid').removeClass('drag-over-invalid');
	}

	private async handleDrop(e: DragEvent): Promise<void> {
		this.$el.removeClass('drag-over-valid').removeClass('drag-over-invalid');

		const files = e.dataTransfer?.files;

		if (!files?.length) {
			return;
		}

		const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

		if (!imageFiles.length) {
			return;
		}

		await this.handleImagesDrop(imageFiles);
	}

	private hasImageFile(e: DragEvent): boolean {
		const types = e.dataTransfer?.types;

		if (!types) {
			return false;
		}

		if (types.includes('Files') || types.includes('application/x-moz-file')) {
			const items = e.dataTransfer?.items;

			if (!items) {
				return false;
			}

			for (const item of Array.from(items)) {
				if (item.type.startsWith('image/')) {
					return true;
				}
			}
		}
		return false;
	}

	private async handleImagesDrop(files: File[]): Promise<void> {
		try {
			Espo.Ui.notify(this.translate('Uploading...'));

			for (const file of files) {
				try {
					const attachment = await this.uploadInlineAttachment(file);
					const url = `?entryPoint=attachment&id=${attachment.id}`;

					if (this.$summernote) {
						this.$summernote.summernote('insertImage', url);
					}
				} catch (error) {
					Espo.Ui.warning(this.translate('Error uploading file:') + ' ' + file.name);
				}
			}

			Espo.Ui.success(this.translate('Uploaded'));
		} catch (error) {
			Espo.Ui.error(this.translate('Error uploading files'));
		}
	}
});
