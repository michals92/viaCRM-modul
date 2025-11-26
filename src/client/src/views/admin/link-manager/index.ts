define(['views/admin/link-manager/index'], Dep =>
	class extends Dep {

		setupLinkData() {
			// Call parent implementation
			super.setupLinkData();

			// Extend hasEditParams logic for more link types
			this.linkDataList = this.linkDataList.map(linkData => {
				const link = linkData.link;
				const defs = this.getMetadata().get(`entityDefs.${this.scope}.links.${link}`) || {};

				// Extend hasEditParams to include belongsTo, hasOne, and belongsToParent
				const hasEditParams =
					defs.type === 'hasMany' ||
					defs.type === 'hasChildren' ||
					defs.type === 'belongsTo' ||
					defs.type === 'hasOne' ||
					defs.type === 'belongsToParent';

				return {
					...linkData,
					hasEditParams: hasEditParams,
					hasDropdown: linkData.isEditable || linkData.isRemovable || hasEditParams
				};
			});
		}
	}
);
