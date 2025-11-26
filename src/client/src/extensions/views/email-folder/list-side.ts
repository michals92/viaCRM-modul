import type EmailFolderListSideView from 'espocrm/src/views/email-folder/list-side';
import type { BaseFieldData } from 'viacrm/types';

extend<EmailFolderListSideView>(Dep => class extends Dep {
	override template = 'viacrm:email-folder/list-side';

	override data(): BaseFieldData {
		const data = super.data();
		data.showAllFolder = this.hasAllFolderPermission();
		return data;
	}

	hasAllFolderPermission(): boolean {
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

	override actionSelectFolder(folderId: string): void {
		// Prevent selection of "All" folder if user doesn't have permission
		if (folderId === 'all' && !this.hasAllFolderPermission()) {
			// Silently switch to inbox instead
			folderId = 'inbox';
		}

		// Call parent method with potentially modified folder ID
		super.actionSelectFolder(folderId);
	}
});
