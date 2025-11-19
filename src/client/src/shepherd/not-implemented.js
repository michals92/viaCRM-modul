define(['autocrm:shepherd/base'], Base => class extends Base {
	createTour() {
		const tour = new this.Shepherd.Tour({
			useModalOverlay: true,
			defaultStepOptions: {
				cancelIcon: {
					enabled: true,
				},
				classes: 'shepherd-espocrm',
				canClickTarget: false,
				arrow: false,
			},
		});

		tour.addStep({
			title: this.translate('Hint Not Available', 'titles'),
			text: this.translate('Hint Not Available', 'messages'),
		});

		return tour;
	}
});
