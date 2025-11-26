import type BaseType from 'autocrm:shepherd/base';

interface ShepherdTour {
	on(event: string, callback: () => void): void;
	start(): void;
	next(): void;
	back(): void;
	complete(): void;
	addStep(options: Record<string, unknown>): void;
}

interface ShepherdLib {
	Tour: new (options: Record<string, unknown>) => ShepherdTour;
}

define(
	['autocrm:shepherd/base'],
	(Base: typeof BaseType) => class extends Base {
		Shepherd!: ShepherdLib;

		createTour(): ShepherdTour {
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
	},
);
