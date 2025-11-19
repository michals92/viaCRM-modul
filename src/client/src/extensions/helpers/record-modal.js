extend(Dep => class extends Dep {
	showDetail(view, params) {
		const originalCreateView = view.createView;

		view.createView = function (key, viewName, options, ...args) {
			const layoutName = view.getParentView()?.detailSmallEditName;

			if (key === 'modal' && layoutName) {
				options = options || {};
				options.layoutName = layoutName;
			}

			return originalCreateView.call(this, key, viewName, options, ...args);
		};

		const promise = super.showDetail(view, params);

		view.createView = originalCreateView;

		return promise;
	}
});