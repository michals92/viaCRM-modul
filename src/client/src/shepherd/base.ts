import type Language from 'espocrm/src/language';
import type Preferences from 'espocrm/src/models/preferences';

interface Helper {
	language: Language;
	preferences: Preferences;
	config: { get(key: string): unknown };
}

interface ShepherdTour {
	on(event: string, callback: () => void): void;
	start(): void;
	next(): void;
	back(): void;
	complete(): void;
}

interface ShepherdButton {
	text: string;
	action: () => void;
	classes: string;
}

interface ShepherdLib {
	Tour: new (options: Record<string, unknown>) => ShepherdTour;
}

declare const Bull: { Events?: Record<string, unknown> };
declare const Backbone: { Events?: Record<string, unknown> };

define(
	['lib!shepherd'],
	(Shepherd: ShepherdLib) => {
		class BaseShepherd {
			Shepherd: ShepherdLib;
			tour!: ShepherdTour;
			private _helper: Helper;

			constructor(helper: Helper) {
				this.Shepherd = Shepherd;
				this._helper = helper;

				this.init();
			}

			/**
			 * @protected
			 */
			getPreferencesKey(): string | null {
				return null;
			}

			isRunOnce(): boolean {
				return this.getPreferencesKey() !== null;
			}

			getPreferences(): Preferences {
				return this.getHelper().preferences;
			}

			init(): void {
				this.tour = this.createTour();

				if (this.isRunOnce()) {
					this.once('close', () => {
						this.getPreferences().save({
							[this.getPreferencesKey()!]: true,
						}, {patch: true});
					});
				}

				this.tour.on('cancel', () => {
					this.trigger('close');
				});

				this.tour.on('complete', () => {
					this.trigger('close');
				});
			}

			getHelper(): Helper {
				return this._helper;
			}

			translate(name: string, category: string): string {
				return this.getHelper().language.translate(name, category, 'Shepherd');
			}

			/** @abstract */
			createTour(): ShepherdTour {
				throw new Error('Not implemented');
			}

			getNextButton(tour: ShepherdTour): ShepherdButton {
				return {
					text: this.translate('Next', 'labels'),
					action: tour.next,
					classes: 'shepherd-button-next btn btn-primary btn-xs-wide',
				};
			}

			getBackButton(tour: ShepherdTour): ShepherdButton {
				return {
					text: this.translate('Back', 'labels'),
					action: tour.back,
					classes: 'shepherd-button-back btn btn-default btn-xs-wide',
				};
			}

			getFinishButton(tour: ShepherdTour): ShepherdButton {
				return {
					text: this.translate('Finish', 'labels'),
					action: tour.complete,
					classes: 'shepherd-button-next btn btn-primary btn-xs-wide',
				};
			}

			start(force = false): void {
				if (!force && this.isRunOnce() && this.getPreferences().get(this.getPreferencesKey()!)) {
					return;
				}

				if (this.getHelper().config.get('disableIntroductoryGuide')) {
					return;
				}

				this.tour.start();
			}

			// Events mixin methods - these will be added by Object.assign below
			trigger!: (event: string) => void;
			once!: (event: string, callback: () => void) => void;
			on!: (event: string, callback: () => void) => void;
			off!: (event: string, callback?: () => void) => void;
		}

		const events = Bull.Events || Backbone.Events;
		Object.assign(BaseShepherd.prototype, events);

		return BaseShepherd;
	},
);
