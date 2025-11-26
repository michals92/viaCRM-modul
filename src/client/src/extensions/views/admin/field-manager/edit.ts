import type FieldManagerEditView from 'espocrm/src/views/admin/field-manager/edit';

type ParamDef = {
	name: string;
	type?: string;
	tooltip?: boolean;
	default?: unknown;
	readOnly?: boolean;
};

type FieldDefs = {
	isCustom?: boolean;
	notStorable?: unknown;
	[key: string]: unknown;
};

type FieldManager = {
	getParamList(fieldType: string): ParamDef[];
};

extend<FieldManagerEditView>(Dep => class extends Dep {
	declare scope: string;
	declare type: string;
	declare defs: FieldDefs;
	declare isNew: boolean;
	hasNotStorable!: boolean;

	override setup(): void {
		super.setup();

		this.setupEvents();
	}

	setupEvents(): void {
		this.events['click button[data-action="delete"]'] = () => {
			this.actionDelete();
		};
	}

	override afterRender(): void {
		super.afterRender();

		const $btnGroup = this.$el.find('.button-container > .btn-group');

		if (this.defs.isCustom) {
			$btnGroup.append(
				$('<button>')
					.addClass('btn btn-danger')
					.attr('data-action', 'delete')
					.text(this.translate('Delete') as string),
			);
		}
	}

	actionDelete(): void {
		const field = this.model.get('name') as string;

		const msg = (this.translate('confirmRemove', 'messages', 'FieldManager') as string).replace('{field}', field);

		this.confirm(msg, () => {
			Espo.Ui.notifyWait();

			Espo.Ajax.deleteRequest('Admin/fieldManager/' + this.scope + '/' + field).then(() => {
				Espo.Ui.success(this.translate('Removed') as string);

				Promise.all([this.getMetadata().loadSkipCache(), this.getLanguage().loadSkipCache()]).then(() => {
					this.broadcastUpdate();

					this.getRouter().navigate('#Admin/fieldManager/scope=' + this.scope, { trigger: true });
				});
			});
		});
	}

	override disableButtons(): void {
		super.disableButtons();

		this.$el.find('[data-action="delete"]').attr('disabled', 'disabled').addClass('disabled');
	}

	override enableButtons(): void {
		super.enableButtons();

		this.$el.find('[data-action="delete"]').removeAttr('disabled').removeClass('disabled');
	}

	override setupFieldData(callback: () => void): void {
		const fieldManager = this.getFieldManager() as FieldManager;
		const orgGetParamList = fieldManager.getParamList;
		const context = this;

		this.hasNotStorable = this.getMetadata().get(['fields', this.type, 'notStorable']) !== false;

		if (this.hasNotStorable) {
			fieldManager.getParamList = (fieldType: string): ParamDef[] => {
				const paramList = orgGetParamList.call(fieldManager, fieldType);
				const alreadyHasNotStorable = paramList.some((item: ParamDef) => item.name === 'notStorable');

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

	override createFieldView(
		type: string,
		name: string,
		readOnly: boolean,
		params: Record<string, unknown> | null,
		options: Record<string, unknown>,
		callback: () => void
	): void {
		if (name === 'name') {
			const paramsNameFieldView = this.getMetadata().get(['fields', this.type, 'paramsNameFieldView']) as string | null;

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
