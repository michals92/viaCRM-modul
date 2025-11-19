extend(Dep => class extends Dep {
	clone(options = {}) {
		options = {...options};

		options.withModels = false;

		return super.clone(options);
	}
});
