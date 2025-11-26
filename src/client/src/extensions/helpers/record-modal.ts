import type RecordModalHelper from 'espocrm/src/helpers/record-modal';

interface ModalOptions {
	layoutName?: string;
	[key: string]: unknown;
}

extend<RecordModalHelper>(Dep => class extends Dep {
	override showDetail(view: { createView: (...args: unknown[]) => unknown; getParentView: () => { detailSmallEditName?: string } | null }, params: unknown): Promise<unknown> {
		const originalCreateView = view.createView;

		view.createView = function (key: string, viewName: string, options?: ModalOptions, ...args: unknown[]): unknown {
			const layoutName = view.getParentView()?.detailSmallEditName;

			if (key === 'modal' && layoutName) {
				options = options ?? {};
				options.layoutName = layoutName;
			}

			return originalCreateView.call(this, key, viewName, options, ...args);
		};

		const promise = super.showDetail(view, params);

		view.createView = originalCreateView;

		return promise;
	}
});
