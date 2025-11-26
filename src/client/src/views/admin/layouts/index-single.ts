define(['viacrm:views/admin/layouts/index'], IndexLayoutView => class extends IndexLayoutView {
	// To prevent URL (route) change
	navigate = () => {};
});
