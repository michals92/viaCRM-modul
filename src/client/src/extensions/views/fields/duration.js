extend(['ui/select'], (Dep, Select) => class extends Dep {
	afterRender() {
		let parentView = this.getParentView();

		if (parentView && 'getView' in parentView) {
			this.endFieldView = parentView.getView(this.endField);
		}

		if (this.isEditMode()) {
			this.$duration = this.$el.find('.main-element');

			this.$duration.on('change', () => {
				this.seconds = parseInt(this.$duration.val());

				this.updateDateEnd();
			});

			let start = this.model.get(this.startField);
			let end = this.model.get(this.endField);

			let seconds = this.$duration.val();

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
				/**
					 * @param {string} search
					 * @param {{value: string}} item
					 * @return {number}
					 */
				score: (search, item) => {
					let num = parseInt(item.value);

					// Parse combined format like "8h 30m"
					const combinedMatch = search.toLowerCase().match(/^(\d+)h\s*(\d+)m$/);
					if (combinedMatch) {
						const hours = parseInt(combinedMatch[1]);
						const minutes = parseInt(combinedMatch[2]);
						const searchSeconds = hours * 3600 + minutes * 60;

						if (num === searchSeconds) {
							return Number.MAX_SAFE_INTEGER;
						}
						return 0;
					}

					// Handle single number
					let searchNum = parseInt(search);
					if (isNaN(searchNum)) {
						return 0;
					}

					let numOpposite = Number.MAX_SAFE_INTEGER - num;

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
				load: (item, callback) => {
					// Parse combined format like "8h 30m"
					const combinedMatch = item.toLowerCase().match(/^(\d+)h\s*(\d+)m$/);
					if (combinedMatch) {
						const hours = parseInt(combinedMatch[1]);
						const minutes = parseInt(combinedMatch[2]);
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
					let num = parseInt(item);
					if (isNaN(num) || num <= 0) {
						return;
					}

					let list = [];

					// Add minutes option (if under 60)
					if (num < 60) {
						let mSeconds = num * 60;
						list.push({
							value: mSeconds.toString(),
							text: this.stringifyDuration(mSeconds),
						});
					}

					// Add hours option (no upper limit)
					let hSeconds = num * 3600;
					list.push({
						value: hSeconds.toString(),
						text: this.stringifyDuration(hSeconds),
					});

					callback(list);
				},
			});
		}
	}

	stringifyDuration(seconds) {
		if (!seconds) {
			return '0';
		}

		let hours = Math.floor(seconds / 3600);
		let minutes = Math.floor((seconds % 3600) / 60);

		let parts = [];
		if (hours > 0) {
			parts.push(hours + 'h');
		}
		if (minutes > 0) {
			parts.push(minutes + 'm');
		}

		return parts.join(' ') || '0';
	}
});
