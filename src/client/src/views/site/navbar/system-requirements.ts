import type View from "espocrm/src/view";

interface SystemRequirement {
	acceptable: boolean;
}

interface SystemRequirementData {
	php?: Record<string, SystemRequirement>;
	database?: Record<string, SystemRequirement>;
	permission?: Record<string, SystemRequirement>;
}

define(['viacrm:views/site/navbar/admin-only'], (Dep: typeof View) => class extends Dep {
	override template = 'viacrm:site/navbar/system-requirements';

	allRequirementsMet = true;

	override data() {
		return {
			label: this.translate('System Requirements', 'labels', 'Admin'),
			iconColor: this.allRequirementsMet ? 'var(--state-success-text)' : 'var(--state-danger-text)',
		};
	}

	isAvailable() {
		// @ts-ignore - base class method exists at runtime
		return (super.isAvailable() && !this.getConfig().get<boolean>('systemRequirementsInNavbarDisabled'));
	}

	override setup() {
		// Early return if not available to prevent unnecessary setup
		if (!this.isAvailable()) {
			return;
		}
		
		this.addActionHandler('showSystemRequirements', () =>
			this.createView('systemRequirementsModal', 'viacrm:views/modals/system-requirements').then(view => view.render()),
		);

		// Check system requirements to determine icon color
		this.wait(
			Espo.Ajax.getRequest('Admin/action/systemRequirementList').then((data: unknown) => {
				const systemData = data as SystemRequirementData;
				if (systemData) {
					// Check if all requirements are acceptable in all categories
					this.allRequirementsMet = true;
					
					// Check PHP requirements
					if (systemData.php) {
						for (const key in systemData.php) {
							if (!systemData.php[key]?.acceptable) {
								this.allRequirementsMet = false;
								break;
							}
						}
					}
					
					// Check database requirements
					if (this.allRequirementsMet && systemData.database) {
						for (const key in systemData.database) {
							if (!systemData.database[key]?.acceptable) {
								this.allRequirementsMet = false;
								break;
							}
						}
					}
					
					// Check permission requirements
					if (this.allRequirementsMet && systemData.permission) {
						for (const key in systemData.permission) {
							if (!systemData.permission[key]?.acceptable) {
								this.allRequirementsMet = false;
								break;
							}
						}
					}
				}
			}).catch(() => {
				// If request fails, assume requirements are not met
				this.allRequirementsMet = false;
			})
		);
	}
});