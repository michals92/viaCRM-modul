define(['views/fields/base', 'd3'], (Dep, d3) => class extends Dep {
	type = 'graph';

	listTemplate = 'autocrm:fields/progress-bar/list';
	detailTemplate = 'autocrm:fields/progress-bar/detail';
	editTemplate = 'autocrm:fields/progress-bar/edit';

	range = undefined;
	r = undefined;
	s = undefined;
	progress = undefined;
	pointerHeadLength = undefined;
	value = 0;

	svg = undefined;
	scale = undefined;
	pointer = undefined;

	config = {
		clipHeight: 110,
		ringInset: 20,
		ringWidth: 20,

		height: 100,
		width: 500,
		minValue: 0,
		maxValue: 10,

		transitionMs: 300,

		majorTicks: 5,
		labelFormat: d3.format('d'),
		labelInset: 10,
		labelsFontWidth: 14,

		startColor: '#e8e2ca',
		endColor: '#3e6c0a',
		labelsColor: '#000',
		backgroundColor: '#e0e0e0',

		align: 'Min',
	};

	setup() {
		this.configure({
			clipHeight: this.mode === 'list' ? 50 : this.getHeight(),
			ringWidth: 35,
			height: this.getHeight(),
			width: this.getWidth(),
			labelsFontWidth: this.getLabelsFontWidth(),
			maxValue: this.getTargetValue(),
			labelsFormat: this.getLabelsFormat(),
			startColor: this.getStartColor(),
			endColor: this.getEndColor(),
			labelsColor: this.getLabelsColor(),
			backgroundColor: this.getBackgroundColor(),
			align: this.getAlignment(),
			transitionMs: 800,
		});
		super.setup();

		this.listenTo(this.model, 'change', () => {
			if (
				this.model.hasChanged(this.getCurrentFieldName()) ||
					this.model.hasChanged(this.getTargetFieldName())
			) {
				this.updateGraph();
			}
		});
	}

	configure(configuration) {
		let prop = undefined;
		for (prop in configuration) {
			this.config[prop] = configuration[prop];
		}

		this.range = this.config.maxAngle - this.config.minAngle;
		this.r = this.config.width / 2;
	}

	setupFinal() {
		super.setupFinal();
	}

	async afterRender() {
		super.afterRender();
		this.renderGraph();

		if (this.mode === 'list') {
			await this.model.fetch();
		}
	}

	data() {
		return super.data();
	}

	getValueForDisplay() {
		return ''; //'Loading ...';
	}

	createProgress() {
		this.progress = this.svg
			.append('text')
			.attr('class', 'progress')
			.attr('transform', this.centerTranslation())
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'middle')
			.attr('dy', 25)
			.attr('font-size', this.config.labelsFontWidth + 'px')
			.attr('fill', this.config.labelsColor)
			.text(this.getProgressPercent() + '%');
	}

	centerTranslation() {
		return 'translate(' + this.r + ',' + this.config.labelsFontWidth / 2 + ')';
	}

	renderGraph() {
		this.svg = d3
			.select(`[data-name="${this.name}"]`)
			.append('svg')
			.attr('height', this.config.height)
			.attr('width', this.config.width);

		if (this.mode === 'list') {
			this.svg = d3
				.select(`[data-id="${this.model.get('id')}"] [data-name="${this.name}"]`)
				.append('svg')
				.attr('height', this.config.height)
				.attr('width', this.config.width);
		}

		this.svg
			.append('rect')
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('fill', this.config.backgroundColor)
			.attr('height', this.config.height)
			.attr('width', this.config.width)
			.attr('x', 0);

		this.bar = this.svg
			.append('rect')
			.attr('rx', 3)
			.attr('ry', 3)
			.attr('fill', this.getArcColor())
			.attr('height', this.config.height)
			.attr('width', () => (this.getProgressPercent() / 100) * this.config.width)
			.attr('x', 0);

		this.createProgress();
	}

	updateGraph() {
		this.config.maxValue = this.getTargetValue();

		this.updatePercentDisplay();

		this.bar
			.transition()
			.duration(this.config.transitionMs)
			.ease(d3.easePoly)
			.attr('fill', this.getArcColor())
			.attr('width', (this.getProgressPercent() / 100) * this.config.width + 'px');
	}

	updatePercentDisplay() {
		this.progress.text(this.getProgressPercent() + '%');
	}

	getArcColor() {
		return d3.interpolateHsl(
			d3.rgb(this.config.startColor),
			d3.rgb(this.config.endColor),
		)(this.getProgressPercent() / 100);
	}

	fetch() {
		let value = this.$element.val();
		value = this.parse(value);

		const data = {};

		data[this.name] = value;

		return data;
	}

	getProgressPercent() {
		const percent = (this.getCurrentValue() / this.getTargetValue()) * 100;

		return percent.toFixed(2);
	}

	getCurrentValue() {
		return this.model.get(this.getCurrentFieldName());
	}

	getCurrentFieldName() {
		return this.getFieldParamValue('currentValue');
	}

	getTargetValue() {
		return this.model.get(this.getTargetFieldName());
	}

	getTargetFieldName() {
		return this.getFieldParamValue('targetValue');
	}

	getStartColor() {
		return this.startColor || this.getFieldParamValue('startColor');
	}

	getEndColor() {
		return this.endColor || this.getFieldParamValue('endColor');
	}

	getLabelsFontWidth() {
		return this.labelsFontWidth || this.getFieldParamValue('labelsFontWidth');
	}

	getLabelsEnabled() {
		return this.labelsEnabled || this.getFieldParamValue('labelsEnabled');
	}

	getLabelsFormat() {
		const formats = {
			int: d3.format('d'),
			float: d3.format('.2f'),
		};
		return this.labelsFormat || formats[this.getFieldParamValue('labelsFormat')];
	}

	getHeight() {
		return this.height || this.getFieldParamValue('height');
	}

	getWidth() {
		return this.width || this.getFieldParamValue('width');
	}

	getBackgroundColor() {
		return this.backgroundColor || this.getFieldParamValue('backgroundColor');
	}

	getLabelsColor() {
		return this.labelsColor || this.getFieldParamValue('labelColor');
	}

	getAlignment() {
		const options = {
			left: 'Min',
			right: 'Max',
		};

		return this.align || options[this.getFieldParamValue('align')];
	}

	getFieldParamValue(fieldParam) {
		return this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.name, fieldParam]);
	}
});
