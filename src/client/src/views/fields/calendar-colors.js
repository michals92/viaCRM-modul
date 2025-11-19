define(['views/fields/array'], Dep => class extends Dep {
	editTemplate = 'autocrm:settings/fields/calendar-colors/edit';

	setup() {
		super.setup();

		this.entityList = this.getConfig().get('calendarEntityList') || [];
		this.colorMap = this.model.get(this.name) || {};

		this.translatedEntityList = this.entityList.map(entityType => ({
			name: entityType,
			label: this.translate(entityType, 'scopeNames'),
		}));

		this.wait(Espo.loader.requirePromise('lib!bootstrap-colorpicker'));
	}

	data() {
		return {
			...super.data(),
			entityList: this.translatedEntityList,
			colorMap: this.colorMap,
		};
	}

	afterRender() {
		if (this.isEditMode()) {
			this.$list = this.$el.find('.list-group');

			const $select = (this.$select = this.$el.find('.select'));

			if (this.allowCustomOptions) {
				this.$addButton = this.$el.find('button[data-action="addItem"]');

				this.$addButton.on('click', () => {
					const value = $select.val().toString();

					this.addValueFromUi(value);

					this.focusOnElement();
				});

				$select.on('input', () => this.controlAddItemButton());

				$select.on('keydown', e => {
					const key = Espo.Utils.getKeyFromKeyEvent(e);

					if (key === 'Enter') {
						const value = $select.val().toString();

						this.addValueFromUi(value);
					}
				});

				this.controlAddItemButton();
			}
		}

		if (this.isSearchMode()) {
			this.renderSearch();
		}

		if (this.isEditMode()) {
			$('.input-group').each((_, element) => {
				const $element = $(element);
				const $input = $element.find('input[data-name="colorValue"]');

				$element
					.colorpicker({
						format: 'hex',
						container: $element.closest('.modal').length ? $element : false,
						component: '.input-group-addon',
						sliders: {
							saturation: {
								maxLeft: 200,
								maxTop: 200,
							},
							hue: {
								maxTop: 200,
							},
							alpha: {
								maxTop: 200,
							},
						},
					})
					.on('changeColor', _ => {
						this.trigger('change');
					});

				$input.on('change', () => {
					if ($input.val() === '') {
						$element.find('.input-group-addon > i').css('background-color', 'transparent');
					}
					this.trigger('change');
				});
			});
		}
	}

	fetch() {
		const data = {};
		data[this.name] = {};

		this.entityList.forEach(entityType => {
			const colorValue = this.$el.find(`input[data-name="colorValue"][data-value="${entityType}"]`).val();

			if (colorValue) {
				data[this.name][entityType] = colorValue;
			}
		});

		return data;
	}
});
