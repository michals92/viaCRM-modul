/**
 * Enhanced Datepicker Helper
 * 
 * Always bypasses EspoCRM's datepicker wrapper to provide full Bootstrap Datepicker API access.
 * This includes support for beforeShowDay, classes, tooltips, and all other Bootstrap Datepicker features.
 * 
 * Usage:
 * In your field's afterRender method:
 * require(['autocrm:helpers/datepicker-enhanced'], (DatepickerEnhanced) => {
 *     this.datepickerEnhanced = new DatepickerEnhanced(this);
 *     this.datepickerEnhanced.setup();
 * });
 */
define(['moment'], (_moment) => {
	
	class DatepickerEnhanced {
		
		constructor(view) {
			this.view = view;
		}
		
		/**
		 * Set up enhanced datepicker functionality
		 */
		setup() {
			// Only enhance if the field has setupDatepickerOptions method
			if (typeof this.view.setupDatepickerOptions !== 'function') {
				console.warn('[DatepickerEnhanced] Field does not have setupDatepickerOptions method');
				return;
			}
			
			// Only enhance in edit or search mode
			if (this.view.mode !== this.view.MODE_EDIT && this.view.mode !== this.view.MODE_SEARCH) {
				return;
			}
			
			// Get the enhanced options from the field
			const options = this.view.setupDatepickerOptions();
			
			// Always bypass EspoCRM's wrapper to provide full Bootstrap Datepicker API access
			this.setupDirectDatepicker(options);
		}
		
		/**
		 * Set up direct Bootstrap Datepicker with full API access
		 */
		setupDirectDatepicker(options) {
			// Find the datepicker element
			const $element = this.view.$el.find(`[data-name="${this.view.name}"]`);
			
			if (!$element || !$element.length) {
				console.warn('[DatepickerEnhanced] No datepicker element found');
				return;
			}
			
			// Small delay to ensure EspoCRM's datepicker is initialized first
			setTimeout(() => {
				// Destroy any existing datepicker
				$element.datepicker('destroy');
				
				// Create direct Bootstrap Datepicker with full API
				$element.datepicker({
					autoclose: true,
					todayHighlight: true,
					format: options.format ? options.format.toLowerCase() : 'yyyy-mm-dd',
					weekStart: options.weekStart || 0,
					startDate: options.startDate,
					todayBtn: options.todayButton || false,
					orientation: 'bottom auto',
					language: this.view.getConfig().get('language') || 'en',
					beforeShowDay: options.beforeShowDay
				}).on('changeDate', () => {
					this.view.trigger('change');
				});
			}, 50);
		}
		
		/**
		 * Update the datepicker with new options
		 */
		updateDatepicker() {
			if (typeof this.view.setupDatepickerOptions !== 'function') {
				return;
			}
			
			const options = this.view.setupDatepickerOptions();
			
			// Always recreate the datepicker to ensure all options are applied properly
			this.setupDirectDatepicker(options);
		}
		
		/**
		 * Destroy the enhanced datepicker
		 */
		destroy() {
			const $element = this.view.$el.find(`[data-name="${this.view.name}"]`);
			if ($element && $element.length) {
				$element.datepicker('destroy');
			}
		}
	}
	
	return DatepickerEnhanced;
});