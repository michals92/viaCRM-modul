extend(Dep => class extends Dep {
	setup() {
		super.setup();

		this.events['click button[data-action="previous"]'] = () => this.actionPrevious();
		this.events['click button[data-action="next"]'] = () => this.actionNext();
	}

	afterRender() {
		super.afterRender();

		const $modalHeader = this.$el.find('.modal-header');

		const $imageCount = $('<span>').addClass('image-count');

		const $previousButton = $('<button>')
			.attr({
				type: 'button',
				'data-action': 'previous',
				title: this.translate('Previous Entry'),
			})
			.addClass('btn btn-text btn-icon action')
			.append($('<span>').addClass('fas fa-chevron-left'));

		const $nextButton = $('<button>')
			.attr({
				type: 'button',
				'data-action': 'next',
				title: this.translate('Next Entry'),
			})
			.addClass('btn btn-text btn-icon action')
			.append($('<span>').addClass('fas fa-chevron-right'));

		$modalHeader.prepend($imageCount, $previousButton, $nextButton);

		$modalHeader.find('.modal-title').css('display', 'none');

		this.updateButtonStates();
	}

	actionPrevious() {
		this.switchToPrevious();
		this.updateButtonStates();
	}

	actionNext() {
		this.switchToNext();
		this.updateButtonStates();
	}

	updateButtonStates() {
		const $prevButton = this.$el.find('button[data-action="previous"]');
		const $nextButton = this.$el.find('button[data-action="next"]');
		const $imageCount = this.$el.find('.image-count');

		const currentIndex = this.getCurrentIndex();
		const totalImages = this.imageList.length;

		$prevButton.prop('disabled', currentIndex === 0);
		$nextButton.prop('disabled', currentIndex === totalImages - 1);

		$imageCount.text(`${currentIndex + 1}/${totalImages}`);
	}

	getCurrentIndex() {
		return this.imageList.findIndex(image => image.id === this.options.id);
	}
});
