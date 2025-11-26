import type { UiSelectModule, UiSelectItem } from '../../../@types/ui-modules';

import type DurationFieldView from 'espocrm/src/views/fields/duration';

extend<DurationFieldView>(['ui/select'], (Dep, Select: UiSelectModule) => class extends Dep {
	declare $duration: JQuery;
	endFieldView: { isRendered: () => boolean; once: (event: string, callback: () => void) => void } | null = null;

	override afterRender(): void {
		const parentView = this.getParentView();

		if (parentView && 'getView' in parentView) {
			this.endFieldView = (parentView as { getView: (name: string) => unknown }).getView(this.endField) as typeof this.endFieldView;
		}

		if (this.isEditMode()) {
			this.$duration = this.$el.find('.main-element');

			this.$duration.on('change', () => {
				this.seconds = parseInt(this.$duration.val() as string);

				this.updateDateEnd();
			});

			const start = this.model.get(this.startField);
			const end = this.model.get(this.endField);

			const seconds = this.$duration.val();

			if (!end && start && seconds) {
				if (this.endFieldView) {
					if (this.endFieldView.isRendered()) {
						this.updateDateEnd();
					} else {
						this.endFieldView.once('after:render', () => {
							this.updateDateEnd();
						});
					}
				}
			}

			Select.init(this.$duration, {
				sortBy: '$score',
				sortDirection: 'desc',
				score: (search: string, item: { value: string }): number => {
					const num = parseInt(item.value);

					// Parse combined format like "8h 30m"
					const combinedMatch = search.toLowerCase().match(/^(\d+)h\s*(\d+)m$/);
					if (combinedMatch) {
						const hours = parseInt(combinedMatch[1] as string);
						const minutes = parseInt(combinedMatch[2] as string);
						const searchSeconds = hours * 3600 + minutes * 60;

						if (num === searchSeconds) {
							return Number.MAX_SAFE_INTEGER;
						}
						return 0;
					}

					// Handle single number
					const searchNum = parseInt(search);
					if (isNaN(searchNum)) {
						return 0;
					}

					const numOpposite = Number.MAX_SAFE_INTEGER - num;

					if (searchNum === 0 && num === 0) {
						return numOpposite;
					}

					if (searchNum * 60 === num) {
						return numOpposite;
					}

					if (searchNum * 60 * 60 === num) {
						return numOpposite;
					}

					if (searchNum * 60 * 60 * 24 === num) {
						return numOpposite;
					}

					return 0;
				},
				load: (item: string, callback: (items: UiSelectItem[]) => void): void => {
					// Parse combined format like "8h 30m"
					const combinedMatch = item.toLowerCase().match(/^(\d+)h\s*(\d+)m$/);
					if (combinedMatch) {
						const hours = parseInt(combinedMatch[1] as string);
						const minutes = parseInt(combinedMatch[2] as string);
						const totalSeconds = hours * 3600 + minutes * 60;

						// Add to options and update model
						this.seconds = totalSeconds;
						this.updateDateEnd();

						callback([
							{
								value: totalSeconds.toString(),
								text: this.stringifyDuration(totalSeconds),
							},
						]);
						return;
					}

					// Handle single number input
					const num = parseInt(item);
					if (isNaN(num) || num <= 0) {
						return;
					}

					const list: UiSelectItem[] = [];

					// Add minutes option (if under 60)
					if (num < 60) {
						const mSeconds = num * 60;
						list.push({
							value: mSeconds.toString(),
							text: this.stringifyDuration(mSeconds),
						});
					}

					// Add hours option (no upper limit)
					const hSeconds = num * 3600;
					list.push({
						value: hSeconds.toString(),
						text: this.stringifyDuration(hSeconds),
					});

					callback(list);
				},
			});
		}
	}

	override stringifyDuration(seconds: number): string {
		if (!seconds) {
			return '0';
		}

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		const parts: string[] = [];
		if (hours > 0) {
			parts.push(hours + 'h');
		}
		if (minutes > 0) {
			parts.push(minutes + 'm');
		}

		return parts.join(' ') || '0';
	}
});
