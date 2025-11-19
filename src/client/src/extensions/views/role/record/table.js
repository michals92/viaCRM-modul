extend(Dep => class extends Dep {
	actionList = ['create', 'read', 'edit', 'delete', 'stream', 'print'];

	/**
	 * @private
	 * @param {string} scope
	 * @param {string} action
	 * @param {string} limitValue
	 * @param {boolean} [dontChange]
	 */
	controlSelect(scope, action, limitValue, dontChange) {
		// Check if stream permission level can be above read level
		const allowStreamAboveRead = this.getConfig().get('allowStreamPermissionLevelAboveRead');

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
