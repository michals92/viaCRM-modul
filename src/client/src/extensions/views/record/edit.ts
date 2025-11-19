import type EditRecordView from 'espocrm/src/views/record/edit';

extend((Dep: typeof EditRecordView) => class extends Dep {
	template = 'autocrm:record/edit';

	override afterNotValid() {
		super.afterNotValid();

		const errorElements = this.$el.find('.has-error');

		if (errorElements.length) {
			const tabElements = this.$el.find('[data-tab]');

			if (tabElements.length) {
				const firstErrorElement = errorElements.first();
				const firstErrorTab = firstErrorElement.closest('[data-tab]').attr('data-tab');

				if (firstErrorTab === '0') {
					this.selectErrorElement(firstErrorElement);
				} else {
					this.handleErrorInOtherTabs(errorElements);
				}
			} else {
				this.handleErrorWithoutTabs(errorElements);
			}
		}
	}

	selectErrorElement(element: JQuery) {
		const elementTop = element.offset()?.top as number;
		const elementHeight = element.outerHeight() as number;
		const windowHeight = $(window).height() as number;
		const scrollTop = $(window).scrollTop() as number;

		if (elementTop < scrollTop || elementTop + elementHeight > scrollTop + windowHeight) {
			$('html, body').animate(
				{
					scrollTop: elementTop - windowHeight / 2 + elementHeight / 2,
				},
				500,
			);
		}

		this.highlightErrorField(element);
	}

	handleErrorInOtherTabs(errorElements) {
		const invalidTabButton = this.$el.find('button.btn.invalid').first();

		if (invalidTabButton.length) {
			invalidTabButton.click();

			setTimeout(() => {
				this.selectErrorElement(errorElements.first());
			}, 100);
		}
	}

	handleErrorWithoutTabs(errorElements) {
		this.selectErrorElement(errorElements.first());
	}

	highlightErrorField($field: JQuery) {
		$field.addClass('highlight-error');

		setTimeout(() => $field.removeClass('highlight-error'), 2000);
	}

	convertDetailLayout(simplifiedLayout) {
		const layout = super.convertDetailLayout(simplifiedLayout);

		this.middlePanelDefsList = [];

		layout.forEach((panel, _p) => {
			const middlePanel = this.middlePanelDefs[panel.name];

			middlePanel.tabIconClass = simplifiedLayout[_p].tabIconClass;
			middlePanel.tabColor = simplifiedLayout[_p].tabColor;

			this.middlePanelDefs[panel.name] = middlePanel;
			this.middlePanelDefsList.push(middlePanel);
		});

		return layout;
	}
});
