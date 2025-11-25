define(['views/modal'], Dep => class extends Dep {
	template = 'viacrm:modals/simple-select';
	backdrop = true;

	events = {
		'click a[data-action="select"]': function (e) {
			const value = $(e.currentTarget).data('value');
			this.trigger('select', value);
			this.remove();
		},
		'keyup input[data-name="quick-search"]': function (e) {
			this.processQuickSearch(e.currentTarget.value);
		},
	};

	data() {
		return {
			itemList: this.itemDataList || [],
			header: this.options.header
		};
	}

	setup() {
		this.headerText = this.options.header || this.headerText || '';

		const itemList = this.options.itemList || this.itemList;

		if (!itemList) {
			throw new Error('No itemList provided in options');
		}

		this.itemDataList = itemList.map(item => ({
			value: item.value,
			label: item.label || item.value
		}));
	}

	afterRender() {
		this.$noData = this.$el.find('.no-data');

		setTimeout(() => this.$el.find('input[data-name="quick-search"]').focus(), 50);
	}

	processQuickSearch(text) {
		text = text.trim();
		const $noData = this.$noData;

		$noData.addClass('hidden');

		if (!text) {
			this.$el.find('ul .list-group-item').removeClass('hidden');
			return;
		}

		const matchedList = [];
		const lowerCaseText = text.toLowerCase();

		this.itemDataList.forEach(item => {
			const matched = item.label.toLowerCase().indexOf(lowerCaseText) === 0;

			if (matched) {
				matchedList.push(item.value);
			}
		});

		if (matchedList.length === 0) {
			this.$el.find('ul .list-group-item').addClass('hidden');
			$noData.removeClass('hidden');
			return;
		}

		this.itemDataList.forEach(item => {
			const $row = this.$el.find(`ul .list-group-item[data-name="${item.value}"]`);

			if (!~matchedList.indexOf(item.value)) {
				$row.addClass('hidden');
				return;
			}

			$row.removeClass('hidden');
		});
	}
});
