define(['views/fields/base', 'lib!jsignature'], Dep => class extends Dep {
	override detailTemplate = 'autocrm:fields/electronic-signature/detail';

	override editTemplate = 'autocrm:fields/electronic-signature/edit';

	override listTemplate = 'autocrm:fields/electronic-signature/detail';

	override type = 'electronicSignature';

	storePng = false;

	$signature: JQuery | null = null;

	lockAfterSigning = true;

	override setup() {
		if ('lockAfterSigning' in this.params) {
			this.lockAfterSigning = this.params.lockAfterSigning as boolean;
		}

		if ('storePng' in this.params) {
			this.storePng = this.params.storePng as boolean;
		}

		if (this.lockAfterSigning) {
			const check = () => {
				if (this.model.get(this.name)) {
					void this.setReadOnly(true);
				}

				this.stopListening(this.model, 'sync', check);
			};

			this.listenTo(this.model, 'sync', check);

			check();
		}
	}

	getImageUrlForDetail() {
		const value = this.model.get<string | null>(this.name);

		if (!value) {
			return null;
		}

		const $dummy = $('<div>');

		$dummy.jSignature();

		try {
			$dummy.jSignature('setData', value);
		} catch (e) {
			// Invalid signature
			console.error(e);
		}

		return $dummy.jSignature('getData');
	}

	override afterRenderRead() {
		const $signature = this.$el.children('.signature-image-container');
		const value = this.getValueForDisplay();

		if (!value) {
			$signature.text(this.translate('No signature', 'messages', 'ElectronicSignature'));
			return;
		}

		const $dummy = this.$el.children('.dummy-signature-container');

		$dummy.jSignature('init', {
			width: $signature.width(),
		});
		$dummy.jSignature('setData', value);

		$('<img>', {
			src: $dummy.jSignature('getData'),
			alt: this.translate('Electronic Signature'),
		}).appendTo($signature);
	}

	override afterRenderEdit() {
		const renderButton = (container: JQuery) => this.renderUndoButton(container);

		this.$signature = this.$el.children('.signature-container');

		this.$signature.jSignature({
			UndoButton: function (this: any) {
				return renderButton(this.$controlbarLower);
			},
		});

		const value = this.model.get(this.name);

		if (value) {
			this.$signature.jSignature('setData', value);
		}

		this.$signature.on('change', () => this.trigger('change'));
	}

	renderUndoButton(container: JQuery) {
		return $('<button>', {
			class: 'btn btn-default',
			type: 'button',
		})
			.text(this.translate('Undo Last Stroke'))
			.css({
				display: 'block',
				margin: '0 auto',
			})
			.appendTo(container);
	}

	override fetch() {
		let dataUrl: string | null = null;
		let pngData: string | null = null;

		if (this.$signature && this.$signature.length) {
			const vectors = this.$signature!.jSignature('getData', 'native');

			if (vectors.length) {
				const base30 = this.$signature.jSignature('getData', 'base30') || [];

				dataUrl = 'data:' + base30.join(',');

				if (this.storePng) {
					const png = this.$signature.jSignature('getData', 'image');

					if (png) {
						pngData = png[1];
					}
				}
			}
		}

		return {
			[this.name]: dataUrl,
			[this.name + 'Png']: pngData,
		};
	}
});
