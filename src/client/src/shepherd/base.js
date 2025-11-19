define(['lib!shepherd'], Shepherd => {
	class BaseShepherd {
		constructor(helper) {
			this.Shepherd = Shepherd;
			this._helper = helper;

			this.init();
		}

		/**
		 * @protected
		 * @return {string|null}
		 */
		getPreferencesKey() {
			return null;
		}

		isRunOnce() {
			return this.getPreferencesKey() !== null;
		}

		getPreferences() {
			return this.getHelper().preferences;
		}

		init() {
			this.tour = this.createTour();

			if (this.isRunOnce()) {
				this.once('close', () => {
					this.getPreferences().save({
						[this.getPreferencesKey()]: true,
					},{ patch: true });
				});
			}

			this.tour.on('cancel', () => {
				this.trigger('close');
			});

			this.tour.on('complete', () => {
				this.trigger('close');
			});
		}

		getHelper() {
			return this._helper;
		}

		translate(name, category) {
			return this.getHelper().language.translate(name, category, 'Shepherd');
		}

		/** @abstract */
		createTour() {
			throw new Error('Not implemented');
		}

		getNextButton(tour) {
			return {
				text: this.translate('Next', 'labels'),
				action: tour.next,
				classes: 'shepherd-button-next btn btn-primary btn-xs-wide',
			};
		}

		getBackButton(tour) {
			return {
				text: this.translate('Back', 'labels'),
				action: tour.back,
				classes: 'shepherd-button-back btn btn-default btn-xs-wide',
			};
		}

		getFinishButton(tour) {
			return {
				text: this.translate('Finish', 'labels'),
				action: tour.complete,
				classes: 'shepherd-button-next btn btn-primary btn-xs-wide',
			};
		}

		start(force = false) {
			if (!force && this.isRunOnce() && this.getPreferences().get(this.getPreferencesKey())) {
				return;
			}

			if (this.getHelper().config.get('disableIntroductoryGuide')) {
				return;
			}

			this.tour.start();
		}
	}

	const events = Bull.Events || Backbone.Events;
	Object.assign(BaseShepherd.prototype, events);

	return BaseShepherd;
});
