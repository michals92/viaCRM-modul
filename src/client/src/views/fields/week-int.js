define(['views/fields/base', 'views/fields/int'], (Dep, IntFieldView) => class extends Dep {
	detailTemplate = 'autocrm:fields/week-int/detail';
	editTemplate = 'autocrm:fields/week-int/edit';
	listTemplate = 'autocrm:fields/week-int/list';

	thousandSeparator = ',';

	init() {
		super.init();

		this.mondayName = this.name + 'Monday';
		this.tuesdayName = this.name + 'Tuesday';
		this.wednesdayName = this.name + 'Wednesday';
		this.thursdayName = this.name + 'Thursday';
		this.fridayName = this.name + 'Friday';
		this.saturdayName = this.name + 'Saturday';
		this.sundayName = this.name + 'Sunday';
	}

	setup() {
		super.setup();

		if (this.getPreferences().has('thousandSeparator')) {
			this.thousandSeparator = this.getPreferences().get('thousandSeparator');
		} else if (this.getConfig().has('thousandSeparator')) {
			this.thousandSeparator = this.getConfig().get('thousandSeparator');
		}
	}

	data() {
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

	afterRender() {
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

	fetch() {
		const data = {};

		data[this.mondayName] = this.parse(this.$monday.val());
		data[this.tuesdayName] = this.parse(this.$tuesday.val());
		data[this.wednesdayName] = this.parse(this.$wednesday.val());
		data[this.thursdayName] = this.parse(this.$thursday.val());
		data[this.fridayName] = this.parse(this.$friday.val());
		data[this.saturdayName] = this.parse(this.$saturday.val());
		data[this.sundayName] = this.parse(this.$sunday.val());

		return data;
	}

	parse(value) {
		return IntFieldView.prototype.parse.call(this, value);
	}
});
