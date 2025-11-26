import type EmailDetailRecordView from 'espocrm/src/views/email/record/detail';

type ModelSetFunction = (
	key: string | Record<string, unknown>,
	val?: unknown,
	options?: Record<string, unknown>
) => unknown;

type ModelFetchFunction = (options?: Record<string, unknown>) => Promise<unknown>;

extend<EmailDetailRecordView>(Dep => class extends Dep {
	override setup(): void {
		const emailDoNotMarkAsReadList = (this.getPreferences().get('emailDoNotMarkAsReadList') || []) as string[];
		const readType = this.type === 'detailSmall' ? 'rightClickPreview' : null;

		if (readType) {
			if (emailDoNotMarkAsReadList.includes(readType)) {
				if (this.model) {
					const originalSet = this.model.set as ModelSetFunction;
					this.model.set = function(
						this: { set: ModelSetFunction },
						key: string | Record<string, unknown>,
						val?: unknown,
						options?: Record<string, unknown>
					): unknown {
						const attrs: Record<string, unknown> = typeof key === 'object' ? key : {};
						if (typeof key !== 'object') {
							attrs[key] = val;
						}

						if (attrs.isRead === true) {
							console.info(`Email is not marked as read. type:${readType} in typeList:` + emailDoNotMarkAsReadList.join(','));
							delete attrs.isRead;
						}

						return originalSet.call(this, attrs, typeof key === 'object' ? val as Record<string, unknown> : options);
					}.bind(this.model);
				}
			}

			const originalFetch = this.model.fetch as ModelFetchFunction;
			this.model.fetch = function(
				this: { fetch: ModelFetchFunction },
				options: Record<string, unknown> = {}
			): Promise<unknown> {
				const queryParams = {
					data: { readType },
				};
				const mergedOptions = { ...options, ...queryParams };
				return originalFetch.call(this, mergedOptions);
			};
		}

		super.setup();
	}
});
