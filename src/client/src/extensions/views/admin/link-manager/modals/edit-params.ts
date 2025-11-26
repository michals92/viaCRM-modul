import type LinkManagerEditParamsModalView from 'espocrm/src/views/admin/link-manager/modals/edit-params';

type ModelConstructor = new (data?: Record<string, unknown>) => ModelInstance;

type ModelInstance = {
	attributes: Record<string, unknown>;
};

type EditForModalConstructor = new (options: {
	model: ModelInstance;
	detailLayout: Array<{ rows: LayoutRow[] }>;
}) => RecordView;

type RecordView = {
	validate(): boolean;
};

type BoolFieldViewConstructor = new (options: {
	name: string;
	labelText: string;
	params: { tooltip: string };
	model: ModelInstance;
}) => object;

type ForeignNameFieldViewConstructor = new (options: {
	name: string;
	labelText: string;
	params: { tooltip: string };
	entityType: string;
	link: string;
	model: ModelInstance;
}) => object;

type LayoutRow = [{ view: object } | false, false?];

type Props = {
	entityType: string;
	link: string;
};

type ParentPrototype = {
	getParamsFromMetadata: () => Record<string, unknown>;
};

type ExtendedView = {
	props: Props;
	type: string;
	formModel: ModelInstance;
	recordView: RecordView;
	headerText: string;
	buttonList: Array<{ name: string; style?: string; label: string; onClick: () => void }>;
	translate(key: string, category?: string, scope?: string): string;
	getMetadata(): { get(path: string): unknown; loadSkipCache(): Promise<void> };
	addDropdownItem(item: { name: string; text: string; onClick: () => void }): void;
	assignView(name: string, view: RecordView, selector: string): void;
	disableAllActionItems(): void;
	enableAllActionItems(): void;
	broadcastUpdate(): void;
	close(): void;
};

extend<LinkManagerEditParamsModalView>([
	'model',
	'views/record/edit-for-modal',
	'views/fields/bool',
	'viacrm:views/admin/link-manager/fields/foreign-name-field'
], (Dep: { prototype: ParentPrototype; extend: (obj: object) => unknown }, Model: ModelConstructor, EditForModal: EditForModalConstructor, BoolFieldView: BoolFieldViewConstructor, ForeignNameFieldView: ForeignNameFieldViewConstructor) =>
	Dep.extend<LinkManagerEditParamsModalView>({

		setup(this: ExtendedView): void {
			// DON'T call parent setup - we need to create detailLayout with BOTH fields from the start
			// Copy from parent and extend

			this.headerText = this.translate('Parameters', 'labels', 'EntityManager') + ' · ' +
				this.translate(this.props.entityType, 'scopeNames') + ' · ' +
				this.translate(this.props.link, 'links', this.props.entityType);

			const defs = (this.getMetadata().get(`entityDefs.${this.props.entityType}.links.${this.props.link}`) || {}) as { type?: string; isCustom?: boolean; foreignName?: string };
			this.type = defs.type || '';

			this.buttonList = [
				{
					name: 'save',
					style: 'danger',
					label: 'Save',
					onClick: () => this.save(),
				},
				{
					name: 'cancel',
					label: 'Cancel',
					onClick: () => this.close(),
				},
			];

			if (!defs.isCustom) {
				this.addDropdownItem({
					name: 'resetToDefault',
					text: this.translate('Reset to Default', 'labels', 'Admin'),
					onClick: () => this.resetToDefault(),
				});
			}

			const paramsFromMetadata = this.getParamsFromMetadata();

			this.formModel = new Model(paramsFromMetadata);

			const rows: LayoutRow[] = [];

			// Add readOnly field ONLY for hasMany/hasChildren
			if (this.hasReadOnly()) {
				rows.push([
					{
						view: new BoolFieldView({
							name: 'readOnly',
							labelText: this.translate('readOnly', 'fields', 'Admin'),
							params: {
								tooltip: 'EntityManager.linkParamReadOnly',
							},
							model: this.formModel,
						}),
					},
					false
				]);
			}

			// Add foreignName field ONLY for belongsTo links
			if (this.hasForeignName()) {
				rows.push([
					{
						view: new ForeignNameFieldView({
							name: 'foreignName',
							labelText: this.translate('foreignName', 'fields', 'Admin'),
							params: {
								tooltip: 'EntityManager.linkParamForeignName',
							},
							entityType: this.props.entityType,
							link: this.props.link,
							model: this.formModel,
						}),
					},
					false
				]);
			}

			this.recordView = new EditForModal({
				model: this.formModel,
				detailLayout: [
					{
						rows: rows
					}
				]
			});

			this.assignView('record', this.recordView, '.record');
		},

		hasReadOnly(this: ExtendedView): boolean {
			return ['hasMany', 'hasChildren'].includes(this.type);
		},

		hasForeignName(this: ExtendedView): boolean {
			return this.type === 'belongsTo';
		},

		getParamsFromMetadata(this: ExtendedView): Record<string, unknown> {
			// Call parent to get readOnly
			const params = Dep.prototype.getParamsFromMetadata.call(this) as Record<string, unknown>;

			// Add foreignName
			const linkDefs = (this.getMetadata().get(
				`entityDefs.${this.props.entityType}.links.${this.props.link}`
			) || {}) as { foreignName?: string };

			params.foreignName = linkDefs.foreignName || '';

			return params;
		},

		async save(this: ExtendedView): Promise<void> {
			// USE ESPOCRM PATTERN: if (validate()) return;
			// This looks backwards but it's how EspoCRM does it!
			const validationResult = this.recordView.validate();

			if (validationResult) {
				return;
			}

			this.disableAllActionItems();
			Espo.Ui.notifyWait();

			const params: Record<string, unknown> = {};

			if (this.hasReadOnly()) {
				params.readOnly = this.formModel.attributes.readOnly;
			}

			// Send foreignName only for belongsTo links
			if (this.hasForeignName() && this.formModel.attributes.foreignName) {
				params.foreignName = this.formModel.attributes.foreignName;
			}

			try {
				await Espo.Ajax.postRequest('EntityManager/action/updateLinkParams', {
					entityType: this.props.entityType,
					link: this.props.link,
					params: params
				});
			}
			catch (e) {
				this.enableAllActionItems();
				return;
			}

			await Promise.all([
				this.getMetadata().loadSkipCache(),
			]);

			this.broadcastUpdate();

			this.close();

			Espo.Ui.success(this.translate('Saved'));
		}

	})
);
