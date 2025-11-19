extend(Dep => class extends Dep {
	setup() {
		super.setup();

		this.setupEvents();
	}

	setupEvents() {
		this.events['click button[data-action="delete"]'] = () => {
			this.actionDelete();
		};
	}

	afterRender() {
		super.afterRender();

		const $btnGroup = this.$el.find('.button-container > .btn-group');

		if (this.defs.isCustom) {
			$btnGroup.append(
				$('<button>')
					.addClass('btn btn-danger')
					.attr('data-action', 'delete')
					.text(this.translate('Delete')),
			);
		}
	}

	actionDelete() {
		const field = this.model.get('name');

		const msg = this.translate('confirmRemove', 'messages', 'FieldManager').replace('{field}', field);

		this.confirm(msg, () => {
			Espo.Ui.notifyWait();

			Espo.Ajax.deleteRequest('Admin/fieldManager/' + this.scope + '/' + field).then(() => {
				Espo.Ui.success(this.translate('Removed'));

				Promise.all([this.getMetadata().loadSkipCache(), this.getLanguage().loadSkipCache()]).then(() => {
					this.broadcastUpdate();

					this.getRouter().navigate('#Admin/fieldManager/scope=' + this.scope, { trigger: true });
				});
			});
		});
	}

	disableButtons() {
		super.disableButtons();

		this.$el.find('[data-action="delete"]').attr('disabled', 'disabled').addClass('disabled');
	}

	enableButtons() {
		super.enableButtons();

		this.$el.find('[data-action="delete"]').removeAttr('disabled').removeClass('disabled');
	}

	setupFieldData(callback) {
		const fieldManager = this.getFieldManager();
		const orgGetParamList = fieldManager.getParamList;
		const context = this;

		this.hasNotStorable = this.getMetadata().get(['fields', this.type, 'notStorable']) !== false;

		if (this.hasNotStorable) {
			fieldManager.getParamList = fieldType => {
				const paramList = orgGetParamList.call(fieldManager, fieldType);
				const alreadyHasNotStorable = paramList.some(item => item.name === 'notStorable');

				if (!alreadyHasNotStorable) {
					if (typeof context.defs.notStorable === 'undefined') {
						context.defs.notStorable = false;
					}

					paramList.unshift({
						name: 'notStorable',
						type: 'bool',
						tooltip: true,
						default: false,
						readOnly: !context.isNew,
					});
				}

				fieldManager.getParamList = orgGetParamList;
				return paramList;
			};
		}

		super.setupFieldData(callback);
	}

	createFieldView(type, name, readOnly, params, options, callback) {
		if (name === 'name') {
			const paramsNameFieldView = this.getMetadata().get(['fields', this.type, 'paramsNameFieldView']);

			if (paramsNameFieldView) {
				if (!params) {
					params = {};
				}

				params.view = paramsNameFieldView;
			}
		}

		return super.createFieldView(type, name, readOnly, params, options, callback);
	}
});
