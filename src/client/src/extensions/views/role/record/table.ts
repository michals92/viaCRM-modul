import type RoleRecordTableView from 'espocrm/src/views/role/record/table';

interface EnumView {
	setOptionList(options: string[]): void;
}

extend<RoleRecordTableView>(Dep => class extends Dep {
	override actionList = ['create', 'read', 'edit', 'delete', 'stream', 'print'];
	declare enumViews: Record<string, EnumView>;
	declare formRecordHelper: { setFieldOptionList(attribute: string, options: string[]): void };

	/**
	 * @private
	 * @param {string} scope
	 * @param {string} action
	 * @param {string} limitValue
	 * @param {boolean} [dontChange]
	 */
	override controlSelect(scope: string, action: string, limitValue: string, dontChange?: boolean): void {
		// Check if stream permission level can be above read level
		const allowStreamAboveRead = this.getConfig().get('allowStreamPermissionLevelAboveRead') as boolean;

		// If this is the stream action and the setting is enabled, don't enforce the limit
		if (action === 'stream' && allowStreamAboveRead) {
			// Just set the options to the full level list without limiting
			const attribute = `${scope}-${action}`;
			const options = this.getLevelList(scope, action);

			this.formRecordHelper.setFieldOptionList(attribute, options);

			const view = this.enumViews[attribute];

			if (view) {
				view.setOptionList(options);
			}

			return;
		}

		// Otherwise, call the parent implementation
		super.controlSelect(scope, action, limitValue, dontChange);
	}
});
