define(['views/fields/base', 'd3'], (Dep, d3) => class extends Dep {
	type = 'graph';

	listTemplate = 'autocrm:fields/speedometer-graph/list';
	detailTemplate = 'autocrm:fields/speedometer-graph/detail';
	editTemplate = 'autocrm:fields/speedometer-graph/edit';

	range = undefined;
	r = undefined;
	progress = undefined;
	pointerHeadLength = undefined;
	value = null;

	svg = undefined;
	arc = undefined;
	scale = undefined;
	ticks = undefined;
	tickData = undefined;
	pointer = undefined;

	labelsEnabled = null;
	graphSelector = null;

	size = 200;
	clipHeight = 110;
	ringInset = 20;
	ringWidth = 20;
	pointerWidth = 15;
	pointerTailLength = 10;
	pointerHeadLengthPercent = 0.9;
	minValue = 0;
	maxValue = 10;
	minAngle = -90;
	maxAngle = 90;
	transitionMs = 4000;
	majorTicks = 5;
	labelFormat = d3.format('d');
	labelInset = 10;
	startColor = '#e8e2ca';
	endColor = '#3e6c0a';
	align = 'Min';

	config = {
		size: null,
		clipHeight: null,
		ringInset: null,
		ringWidth: null,

		pointerWidth: null,
		pointerTailLength: null,
		pointerHeadLengthPercent: null,

		minValue: null,
		maxValue: null,

		minAngle: null,
		maxAngle: null,

		transitionMs: null,

		majorTicks: null,
		labelFormat: null,
		labelInset: null,

		startColor: null,
		endColor: null,

		align: null,
	};

	setup() {
		this.labelsEnabled = this.options.labelsEnabled;
		this.graphSelector = this.options.graphSelector ?? `[data-name="${this.name}"]`;

		this.graphConfigSetup();

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

	graphConfigSetup() {
		this.size = this.options.size ?? this.size;
		this.clipHeight = this.options.clipHeight ?? this.clipHeight;
		this.ringInset = this.options.ringInset ?? this.ringInset;
		this.ringWidth = this.options.ringWidth ?? this.ringWidth;
		this.pointerWidth = this.options.pointerWidth ?? this.pointerWidth;
		this.pointerTailLength = this.options.pointerTailLength ?? this.pointerTailLength;
		this.pointerHeadLengthPercent = this.options.pointerHeadLengthPercent ?? this.pointerHeadLengthPercent;
		this.minValue = this.options.minValue ?? this.minValue;
		this.maxValue = this.options.maxValue ?? this.maxValue;
		this.transitionMs = this.options.transitionMs ?? this.transitionMs;
		this.majorTicks = this.options.majorTicks ?? this.majorTicks;
		this.labelFormat = this.options.labelFormat ?? this.labelFormat;
		this.labelInset = this.options.labelInset ?? this.labelInset;
		this.startColor = this.options.startColor ?? this.startColor;
		this.endColor = this.options.endColor ?? this.endColor;
		this.align = this.options.align ?? this.align;

		this.value = this.options.value ?? this.value;

		this.configure({
			size: this.size,
			clipHeight: this.mode === 'list' ? 50 : this.getHeight(),
			ringInset: this.ringInset,
			ringWidth: this.ringWidth,
			pointerWidth: this.pointerWidth,
			pointerTailLength: this.pointerTailLength,
			minValue: this.minValue,
			maxValue: this.getTargetValue(),
			minAngle: this.minAngle,
			maxAngle: this.maxAngle,
			transitionMs: this.transitionMs,
			majorTicks: this.majorTicks,
			labelsFormat: this.getLabelsFormat(),
			labelInset: this.labelInset,
			startColor: this.getStartColor(),
			endColor: this.getEndColor(),
			align: this.getAlignment(),
		});
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

	configure(configuration) {
		var prop = undefined;
		for (prop in configuration) {
			this.config[prop] = configuration[prop];
		}

		this.range = this.config.maxAngle - this.config.minAngle;

		this.r = this.config.size / 2;
		this.pointerHeadLength = Math.round(this.r * this.config.pointerHeadLengthPercent);

		this.setScale();

		this.ticks = this.scale.ticks(this.config.majorTicks);
		this.tickData = d3.range(this.config.majorTicks).map(() => 1 / this.config.majorTicks);

		this.createArc();
	}

	renderGraph() {
		this.svg = d3.select(this.graphSelector);

		if (this.mode === 'list') {
			this.svg = d3.select(`[data-id="${this.model.get('id')}"] [data-name="${this.name}"]`);
		}

		this.svg = this.svg.append('svg:svg');

		this.svg
			.attr('class', 'gauge')
		//.attr('viewBox', '0 0 200 125')
			.attr('preserveAspectRatio', `x${this.config.align}YMid meet`)
			.attr('width', '100%')
			.attr('height', this.config.clipHeight);

		this.createArcs();

		if (this.mode !== 'list' && this.getNumberLineEnabled()) this.createLabels();

		this.createPointer();

		if (this.mode !== 'list' && this.getLabelsEnabled()) this.createProgess();

		this.updateGraph();
	}

	createArc() {
		this.arc = d3
			.arc()
			.innerRadius(this.r - this.config.ringWidth - this.config.ringInset)
			.outerRadius(this.r - this.config.ringInset)
			.startAngle((d, i) => {
				var ratio = d * i;
				return this.deg2rad(this.config.minAngle + ratio * this.range);
			})
			.endAngle((d, i) => {
				var ratio = d * (i + 1);
				return this.deg2rad(this.config.minAngle + ratio * this.range);
			});
	}

	createArcs() {
		var arcs = this.svg.append('g').attr('class', 'arc').attr('transform', this.centerTranslation());

		arcs.selectAll('path')
			.data(this.tickData)
			.enter()
			.append('path')
			.attr('fill', (d, i) => this.getArcColor(d * i))
			.attr('d', this.arc);
	}

	createPointer() {
		var lineData = [
			[this.config.pointerWidth / 2, 0],
			[0, -this.pointerHeadLength],
			[-(this.config.pointerWidth / 2), 0],
			[0, this.config.pointerTailLength],
			[this.config.pointerWidth / 2, 0],
		];
		var pointerLine = d3.line().curve(d3.curveMonotoneX);
		var pg = this.svg
			.append('g')
			.data([lineData])
			.attr('class', 'pointer')
			.attr('transform', this.centerTranslation());

		this.pointer = pg
			.append('path')
			.attr('d', pointerLine /*function(d) { return pointerLine(d) +'Z';}*/)
			.attr('fill', this.getArrowColor())
			.attr('transform', 'rotate(' + this.config.maxAngle + ')');
	}

	createLabels() {
		// text nad grafem
		var lg = this.svg.append('g').attr('class', 'label').attr('transform', this.centerTranslation());

		lg.selectAll('text')
			.data(this.ticks)
			.enter()
			.append('text')
			.attr('transform', d => {
				var ratio = this.scale(d);
				var newAngle = this.config.minAngle + ratio * this.range;
				return 'rotate(' + newAngle + ') translate(0,' + (this.config.labelInset - this.r) + ')';
			})
			.attr('text-anchor', 'middle')
			.style('font-size', this.getNumberLineFontPercentage())
			.text(this.config.labelFormat);
	}

	createProgess() {
		this.progress = this.svg
			.append('text')
			.attr('class', 'progress')
			.attr('transform', this.centerTranslation())
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'middle')
			.attr('dy', 25)
			.style('font-size', this.getLabelsFontPercentage())
			.text(this.getProgressPercent() + '%');
	}

	setScale() {
		// a linear scale that maps domain values to a percent from 0..1
		this.scale = d3.scaleLinear().range([0, 1]).domain([this.config.minValue, this.config.maxValue]);
	}

	updateGraph() {
		this.updatePointerPosition();

		if (this.mode !== 'list') this.updatePercentDisplay();
	}

	updatePercentDisplay() {
		this.progress.text(this.getProgressPercent() + '%');
	}

	//TODO removes comments
	updatePointerPosition() {
		this.config.maxValue = this.getTargetValue();
		this.setScale();

		var ratio = this.scale(this.getCurrentValue());

		// Make sure the ratio is in the range (and the pointer as well)
		ratio = Math.max(0, ratio);
		ratio = Math.min(1, ratio);

		if (!this.config.maxValue) ratio = 0;

		var newAngle = this.config.maxAngle + ratio * this.range;

		if (this.mode !== 'list') {
			this.pointer
				.transition()
				.duration(this.config.transitionMs)
				.ease(d3.easeElastic) // Corrected usage for D3 v4+
				.attr('transform', 'rotate(' + newAngle + ')');
		} else this.pointer.attr('transform', 'rotate(' + newAngle + ')');
	}

	deg2rad(deg) {
		return (deg * Math.PI) / 180;
	}

	newAngle(d) {
		var ratio = this.scale(d);
		var newAngle = this.config.minAngle + ratio * this.range;
		return newAngle;
	}

	centerTranslation() {
		return 'translate(' + this.r + ',' + this.r + ')';
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

	getArcColor(pos) {
		return d3.interpolateHsl(d3.rgb(this.config.startColor), d3.rgb(this.config.endColor))(pos);
	}

	getCurrentValue() {
		return this.value ?? this.model.get(this.getCurrentFieldName());
	}

	getCurrentFieldName() {
		return this.getFieldParamValue('currentValue');
	}

	getTargetValue() {
		return this.maxValue ?? this.model.get(this.getTargetFieldName());
	}

	getTargetFieldName() {
		return this.getFieldParamValue('targetValue');
	}

	getArrowColor() {
		return this.arrowColor ?? this.getFieldParamValue('arrowColor');
	}

	getStartColor() {
		return this.startColor ?? this.getFieldParamValue('startColor');
	}

	getEndColor() {
		return this.endColor ?? this.getFieldParamValue('endColor');
	}

	getLabelsEnabled() {
		return this.labelsEnabled ?? this.getFieldParamValue('labelsEnabled');
	}

	getLabelsFontPercentage() {
		return this.labelsFontPercentage ?? this.getFieldParamValue('labelsFontPercentage') + '%';
	}

	getNumberLineEnabled() {
		return this.numberLineEnabled ?? this.getFieldParamValue('numberLineEnabled');
	}

	getNumberLineFontPercentage() {
		return this.numberLineFontPercentage ?? this.getFieldParamValue('numberLineFontPercentage') + '%';
	}

	getLabelsFormat() {
		const formats = {
			int: d3.format('d'),
			float: d3.format('.2f'),
		};
		return this.labelFormat ?? formats[this.getFieldParamValue('labelsFormat')];
	}

	getHeight() {
		return this.clipHeight ?? this.getFieldParamValue('height');
	}

	getAlignment() {
		const options = {
			left: 'Min',
			right: 'Max',
		};

		return this.align ?? options[this.getFieldParamValue('align')];
	}

	getFieldParamValue(fieldParam) {
		return this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.name, fieldParam]);
	}
});
