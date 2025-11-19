define(['dynamic-handler'], Dep => class extends Dep {
	override init() {
		if (this.model.has('type')) {
			this.controlType();
			return;
		}

		this.recordView.listenToOnce(this.model, 'sync', this.controlType.bind(this));
	}

	controlType() {
		if (this.model.get('type') !== 'EasyEmail') {
			if (this.recordView.isRendered()) {
				this.hideEditor();
			}

			this.recordView.once('after:render', this.hideEditor.bind(this));
		} else {
			this.recordView.hideField('body');
			this.recordView.setFieldReadOnly('isHtml');
		}
	}

	hideEditor() {
		const fieldView = this.recordView.getFieldView('bodyEasyEmail');

		if (fieldView) {
			const $cell = fieldView.get$cell().closest('.cell');
			const $label = $cell.find('label');

			$label.addClass('hidden');
			$cell.addClass('hidden-cell');

			fieldView.remove();
		}
	}
});
