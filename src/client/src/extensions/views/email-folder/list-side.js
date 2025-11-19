extend(Dep => class extends Dep {
	template = 'autocrm:email-folder/list-side';

	data() {
		const data = super.data();
		data.showAllFolder = this.hasAllFolderPermission();
		return data;
	}

	hasAllFolderPermission() {
		// Admin users always have access
		if (this.getUser()?.isAdmin()) {
			return true;
		}

		// Check ACL permission for All Email Folder
		const acl = this.getAcl();
		if (!acl) return true; // Default to showing if ACL not available

		// Check the specific permission level
		const permissionLevel = acl.getPermissionLevel('allEmailFolder');
		
		// Permission is allowed by default unless explicitly set to "no"
		return permissionLevel !== 'no';
	}

	actionSelectFolder(folderId) {
		// Prevent selection of "All" folder if user doesn't have permission
		if (folderId === 'all' && !this.hasAllFolderPermission()) {
			// Silently switch to inbox instead
			folderId = 'inbox';
		}

		// Call parent method with potentially modified folder ID
		super.actionSelectFolder(folderId);
	}
});
