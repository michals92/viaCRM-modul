import type BaseFieldView from 'espocrm/src/views/fields/base';
import type IntFieldViewType from 'espocrm/src/views/fields/int';
import type { WeekIntFieldData } from 'viacrm/types';

define(
	['views/fields/base', 'views/fields/int'],
	(Dep: typeof BaseFieldView, IntFieldView: typeof IntFieldViewType) => class extends Dep {
		override detailTemplate = 'viacrm:fields/week-int/detail';
		override editTemplate = 'viacrm:fields/week-int/edit';
		override listTemplate = 'viacrm:fields/week-int/list';

		thousandSeparator = ',';

		mondayName!: string;
		tuesdayName!: string;
		wednesdayName!: string;
		thursdayName!: string;
		fridayName!: string;
		saturdayName!: string;
		sundayName!: string;

		$monday!: JQuery;
		$tuesday!: JQuery;
		$wednesday!: JQuery;
		$thursday!: JQuery;
		$friday!: JQuery;
		$saturday!: JQuery;
		$sunday!: JQuery;

		override init(): void {
			super.init();

			this.mondayName = this.name + 'Monday';
			this.tuesdayName = this.name + 'Tuesday';
			this.wednesdayName = this.name + 'Wednesday';
			this.thursdayName = this.name + 'Thursday';
			this.fridayName = this.name + 'Friday';
			this.saturdayName = this.name + 'Saturday';
			this.sundayName = this.name + 'Sunday';
		}

		override setup(): void {
			super.setup();

			if (this.getPreferences().has('thousandSeparator')) {
				this.thousandSeparator = this.getPreferences().get('thousandSeparator') as string;
			} else if (this.getConfig().has('thousandSeparator')) {
				this.thousandSeparator = this.getConfig().get('thousandSeparator') as string;
			}
		}

		override data(): WeekIntFieldData {
			const data = super.data();

			data.mondayValue = this.model.get(this.mondayName);
			data.tuesdayValue = this.model.get(this.tuesdayName);
			data.wednesdayValue = this.model.get(this.wednesdayName);
			data.thursdayValue = this.model.get(this.thursdayName);
			data.fridayValue = this.model.get(this.fridayName);
			data.saturdayValue = this.model.get(this.saturdayName);
			data.sundayValue = this.model.get(this.sundayName);

			data.mondayName = this.mondayName;
			data.tuesdayName = this.tuesdayName;
			data.wednesdayName = this.wednesdayName;
			data.thursdayName = this.thursdayName;
			data.fridayName = this.fridayName;
			data.saturdayName = this.saturdayName;
			data.sundayName = this.sundayName;

			data.cid = this.cid;

			return data;
		}

		override afterRender(): void {
			super.afterRender();

			if (this.isEditMode()) {
				this.$monday = this.$el.find(`[data-name='${this.mondayName}']`);
				this.$tuesday = this.$el.find(`[data-name='${this.tuesdayName}']`);
				this.$wednesday = this.$el.find(`[data-name='${this.wednesdayName}']`);
				this.$thursday = this.$el.find(`[data-name='${this.thursdayName}']`);
				this.$friday = this.$el.find(`[data-name='${this.fridayName}']`);
				this.$saturday = this.$el.find(`[data-name='${this.saturdayName}']`);
				this.$sunday = this.$el.find(`[data-name='${this.sundayName}']`);

				this.$monday.on('change', this.trigger.bind(this, 'change'));
				this.$tuesday.on('change', this.trigger.bind(this, 'change'));
				this.$wednesday.on('change', this.trigger.bind(this, 'change'));
				this.$thursday.on('change', this.trigger.bind(this, 'change'));
				this.$friday.on('change', this.trigger.bind(this, 'change'));
				this.$saturday.on('change', this.trigger.bind(this, 'change'));
				this.$sunday.on('change', this.trigger.bind(this, 'change'));
			}
		}

		override fetch(): Record<string, number | null> {
			const data: Record<string, number | null> = {};

			data[this.mondayName] = this.parse(this.$monday.val() as string);
			data[this.tuesdayName] = this.parse(this.$tuesday.val() as string);
			data[this.wednesdayName] = this.parse(this.$wednesday.val() as string);
			data[this.thursdayName] = this.parse(this.$thursday.val() as string);
			data[this.fridayName] = this.parse(this.$friday.val() as string);
			data[this.saturdayName] = this.parse(this.$saturday.val() as string);
			data[this.sundayName] = this.parse(this.$sunday.val() as string);

			return data;
		}

		parse(value: string): number | null {
			return IntFieldView.prototype.parse.call(this, value);
		}
	},
);
