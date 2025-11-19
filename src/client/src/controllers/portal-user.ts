define(['controllers/portal-user'], Dep => class extends Dep {
	override checkAccess(action: string): boolean {
		if (this.getAcl().check('PortalUser', action)) {
			return true;
		} else {
			return false;
		}
	}
});
