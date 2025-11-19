define(['view'], Dep =>
	/* This class serves as a base for admin-only navbar items */
	class extends Dep {
		isAvailable() {
			const user = this.getUser();
			return user.isAdmin() && !user.isPortal();
		}
	});
