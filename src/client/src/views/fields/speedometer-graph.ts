import type BaseFieldView from 'espocrm/src/views/fields/base';

// D3 module type - minimal interface for what we use
interface D3Module {
	format(specifier: string): (n: number) => string;
	range(stop: number): number[];
	arc(): D3Arc;
	select(selector: string): D3Selection;
	line(): D3Line;
	scaleLinear(): D3Scale;
	easeElastic: unknown;
	interpolateHsl(a: D3Color, b: D3Color): (t: number) => string;
	rgb(color: string): D3Color;
	curveMonotoneX: unknown;
}

interface D3Color {
	r: number;
	g: number;
	b: number;
}

interface D3Arc {
	innerRadius(r: number): D3Arc;
	outerRadius(r: number): D3Arc;
	startAngle(fn: (d: number, i: number) => number): D3Arc;
	endAngle(fn: (d: number, i: number) => number): D3Arc;
	(d: unknown): string;
}

interface D3Selection {
	append(name: string): D3Selection;
	attr(name: string, value: unknown): D3Selection;
	style(name: string, value: unknown): D3Selection;
	selectAll(selector: string): D3Selection;
	data(data: unknown[]): D3Selection;
	enter(): D3Selection;
	text(text: string | ((d: number) => string)): D3Selection;
	transition(): D3Transition;
}

interface D3Transition {
	duration(ms: number): D3Transition;
	ease(fn: unknown): D3Transition;
	attr(name: string, value: string): D3Transition;
}

interface D3Line {
	curve(curve: unknown): D3Line;
	(data: number[][]): string;
}

interface D3Scale {
	range(range: number[]): D3Scale;
	domain(domain: number[]): D3Scale;
	ticks(count: number): number[];
	(value: number): number;
}

interface GraphConfig {
	size: number | null;
	clipHeight: number | null;
	ringInset: number | null;
	ringWidth: number | null;
	pointerWidth: number | null;
	pointerTailLength: number | null;
	pointerHeadLengthPercent: number | null;
	minValue: number | null;
	maxValue: number | null;
	minAngle: number | null;
	maxAngle: number | null;
	transitionMs: number | null;
	majorTicks: number | null;
	labelFormat: ((n: number) => string) | null;
	labelsFormat?: ((n: number) => string) | null;
	labelInset: number | null;
	startColor: string | null;
	endColor: string | null;
	align: string | null;
}

interface SpeedometerOptions {
	labelsEnabled?: boolean;
	graphSelector?: string;
	size?: number;
	clipHeight?: number;
	ringInset?: number;
	ringWidth?: number;
	pointerWidth?: number;
	pointerTailLength?: number;
	pointerHeadLengthPercent?: number;
	minValue?: number;
	maxValue?: number;
	transitionMs?: number;
	majorTicks?: number;
	labelFormat?: (n: number) => string;
	labelInset?: number;
	startColor?: string;
	endColor?: string;
	align?: string;
	value?: number | null;
}

// Base view interface
interface BaseView {
	type: string;
	listTemplate: string;
	detailTemplate: string;
	editTemplate: string;
	name: string;
	mode: string;
	model: {
		get(key: string): unknown;
		hasChanged(key: string): boolean;
		fetch(): Promise<void>;
		entityType: string;
	};
	options: SpeedometerOptions;
	$element: JQuery;

	setup(): void;
	setupFinal(): void;
	afterRender(): void;
	data(): Record<string, unknown>;
	parse(value: unknown): unknown;
	getMetadata(): {get(path: string[]): unknown};
	listenTo(obj: unknown, event: string, callback: () => void): void;
}

define(
	['views/fields/base', 'd3'],
	(Dep: new () => BaseView & BaseFieldView, d3: D3Module) => class extends Dep {
		override type = 'graph';

		override listTemplate = 'autocrm:fields/speedometer-graph/list';
		override detailTemplate = 'autocrm:fields/speedometer-graph/detail';
		override editTemplate = 'autocrm:fields/speedometer-graph/edit';

		range: number | undefined = undefined;
		r: number | undefined = undefined;
		progress: D3Selection | undefined = undefined;
		pointerHeadLength: number | undefined = undefined;
		value: number | null = null;

		svg: D3Selection | undefined = undefined;
		arc: D3Arc | undefined = undefined;
		scale: D3Scale | undefined = undefined;
		ticks: number[] | undefined = undefined;
		tickData: number[] | undefined = undefined;
		pointer: D3Selection | undefined = undefined;

		labelsEnabled: boolean | null = null;
		graphSelector: string | null = null;

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
		arrowColor: string | undefined = undefined;
		labelsFontPercentage: string | undefined = undefined;
		numberLineEnabled: boolean | undefined = undefined;
		numberLineFontPercentage: string | undefined = undefined;

		config: GraphConfig = {
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

		override setup(): void {
			this.labelsEnabled = this.options.labelsEnabled ?? null;
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

		graphConfigSetup(): void {
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
				pointerHeadLengthPercent: null,
				minValue: this.minValue,
				maxValue: this.getTargetValue(),
				minAngle: this.minAngle,
				maxAngle: this.maxAngle,
				transitionMs: this.transitionMs,
				majorTicks: this.majorTicks,
				labelsFormat: this.getLabelsFormat(),
				labelFormat: null,
				labelInset: this.labelInset,
				startColor: this.getStartColor(),
				endColor: this.getEndColor(),
				align: this.getAlignment(),
			});
		}

		override setupFinal(): void {
			super.setupFinal();
		}

		override async afterRender(): Promise<void> {
			super.afterRender();
			this.renderGraph();

			if (this.mode === 'list') {
				await this.model.fetch();
			}
		}

		override data(): Record<string, unknown> {
			return super.data();
		}

		override getValueForDisplay(): string {
			return ''; //'Loading ...';
		}

		configure(configuration: Partial<GraphConfig>): void {
			for (const prop in configuration) {
				(this.config as Record<string, unknown>)[prop] = (configuration as Record<string, unknown>)[prop];
			}

			this.range = (this.config.maxAngle ?? 0) - (this.config.minAngle ?? 0);

			this.r = (this.config.size ?? 0) / 2;
			this.pointerHeadLength = Math.round(this.r * (this.config.pointerHeadLengthPercent ?? 0));

			this.setScale();

			this.ticks = this.scale!.ticks(this.config.majorTicks ?? 5);
			this.tickData = d3.range(this.config.majorTicks ?? 5).map(() => 1 / (this.config.majorTicks ?? 5));

			this.createArc();
		}

		renderGraph(): void {
			this.svg = d3.select(this.graphSelector!);

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

		createArc(): void {
			this.arc = d3
				.arc()
				.innerRadius(this.r! - (this.config.ringWidth ?? 0) - (this.config.ringInset ?? 0))
				.outerRadius(this.r! - (this.config.ringInset ?? 0))
				.startAngle((d: number, i: number) => {
					const ratio = d * i;
					return this.deg2rad((this.config.minAngle ?? 0) + ratio * this.range!);
				})
				.endAngle((d: number, i: number) => {
					const ratio = d * (i + 1);
					return this.deg2rad((this.config.minAngle ?? 0) + ratio * this.range!);
				});
		}

		createArcs(): void {
			const arcs = this.svg!.append('g').attr('class', 'arc').attr('transform', this.centerTranslation());

			arcs.selectAll('path')
				.data(this.tickData!)
				.enter()
				.append('path')
				.attr('fill', (d: number, i: number) => this.getArcColor(d * i))
				.attr('d', this.arc);
		}

		createPointer(): void {
			const lineData = [
				[(this.config.pointerWidth ?? 0) / 2, 0],
				[0, -this.pointerHeadLength!],
				[-(this.config.pointerWidth ?? 0) / 2, 0],
				[0, this.config.pointerTailLength ?? 0],
				[(this.config.pointerWidth ?? 0) / 2, 0],
			];
			const pointerLine = d3.line().curve(d3.curveMonotoneX);
			const pg = this.svg!
				.append('g')
				.data([lineData])
				.attr('class', 'pointer')
				.attr('transform', this.centerTranslation());

			this.pointer = pg
				.append('path')
				.attr('d', pointerLine as unknown as string /*function(d) { return pointerLine(d) +'Z';}*/)
				.attr('fill', this.getArrowColor())
				.attr('transform', 'rotate(' + this.config.maxAngle + ')');
		}

		createLabels(): void {
			// text nad grafem
			const lg = this.svg!.append('g').attr('class', 'label').attr('transform', this.centerTranslation());

			lg.selectAll('text')
				.data(this.ticks!)
				.enter()
				.append('text')
				.attr('transform', (d: number) => {
					const ratio = this.scale!(d);
					const newAngle = (this.config.minAngle ?? 0) + ratio * this.range!;
					return 'rotate(' + newAngle + ') translate(0,' + ((this.config.labelInset ?? 0) - this.r!) + ')';
				})
				.attr('text-anchor', 'middle')
				.style('font-size', this.getNumberLineFontPercentage())
				.text(this.config.labelFormat ?? ((n: number) => String(n)));
		}

		createProgess(): void {
			this.progress = this.svg!
				.append('text')
				.attr('class', 'progress')
				.attr('transform', this.centerTranslation())
				.attr('text-anchor', 'middle')
				.attr('alignment-baseline', 'middle')
				.attr('dy', 25)
				.style('font-size', this.getLabelsFontPercentage())
				.text(this.getProgressPercent() + '%');
		}

		setScale(): void {
			// a linear scale that maps domain values to a percent from 0..1
			this.scale = d3.scaleLinear().range([0, 1]).domain([this.config.minValue ?? 0, this.config.maxValue ?? 10]);
		}

		updateGraph(): void {
			this.updatePointerPosition();

			if (this.mode !== 'list') this.updatePercentDisplay();
		}

		updatePercentDisplay(): void {
			this.progress!.text(this.getProgressPercent() + '%');
		}

		//TODO removes comments
		updatePointerPosition(): void {
			this.config.maxValue = this.getTargetValue();
			this.setScale();

			let ratio = this.scale!(this.getCurrentValue());

			// Make sure the ratio is in the range (and the pointer as well)
			ratio = Math.max(0, ratio);
			ratio = Math.min(1, ratio);

			if (!this.config.maxValue) ratio = 0;

			const newAngle = (this.config.maxAngle ?? 0) + ratio * this.range!;

			if (this.mode !== 'list') {
				this.pointer!
					.transition()
					.duration(this.config.transitionMs ?? 4000)
					.ease(d3.easeElastic) // Corrected usage for D3 v4+
					.attr('transform', 'rotate(' + newAngle + ')');
			} else this.pointer!.attr('transform', 'rotate(' + newAngle + ')');
		}

		deg2rad(deg: number): number {
			return (deg * Math.PI) / 180;
		}

		newAngle(d: number): number {
			const ratio = this.scale!(d);
			const newAngle = (this.config.minAngle ?? 0) + ratio * this.range!;
			return newAngle;
		}

		centerTranslation(): string {
			return 'translate(' + this.r + ',' + this.r + ')';
		}

		override fetch(): Record<string, unknown> {
			let value = this.$element.val();
			value = this.parse(value);

			const data: Record<string, unknown> = {};

			data[this.name] = value;

			return data;
		}

		getProgressPercent(): string {
			const percent = (this.getCurrentValue() / this.getTargetValue()) * 100;

			return percent.toFixed(2);
		}

		getArcColor(pos: number): string {
			return d3.interpolateHsl(d3.rgb(this.config.startColor ?? ''), d3.rgb(this.config.endColor ?? ''))(pos);
		}

		getCurrentValue(): number {
			return this.value ?? (this.model.get(this.getCurrentFieldName()) as number);
		}

		getCurrentFieldName(): string {
			return this.getFieldParamValue('currentValue') as string;
		}

		getTargetValue(): number {
			return this.maxValue ?? (this.model.get(this.getTargetFieldName()) as number);
		}

		getTargetFieldName(): string {
			return this.getFieldParamValue('targetValue') as string;
		}

		getArrowColor(): string {
			return this.arrowColor ?? (this.getFieldParamValue('arrowColor') as string);
		}

		getStartColor(): string {
			return this.startColor ?? (this.getFieldParamValue('startColor') as string);
		}

		getEndColor(): string {
			return this.endColor ?? (this.getFieldParamValue('endColor') as string);
		}

		getLabelsEnabled(): boolean {
			return this.labelsEnabled ?? (this.getFieldParamValue('labelsEnabled') as boolean);
		}

		getLabelsFontPercentage(): string {
			return this.labelsFontPercentage ?? (this.getFieldParamValue('labelsFontPercentage') as string) + '%';
		}

		getNumberLineEnabled(): boolean {
			return this.numberLineEnabled ?? (this.getFieldParamValue('numberLineEnabled') as boolean);
		}

		getNumberLineFontPercentage(): string {
			return this.numberLineFontPercentage ?? (this.getFieldParamValue('numberLineFontPercentage') as string) + '%';
		}

		getLabelsFormat(): ((n: number) => string) | null {
			const formats: Record<string, (n: number) => string> = {
				int: d3.format('d'),
				float: d3.format('.2f'),
			};
			const formatName = this.getFieldParamValue('labelsFormat') as string;
			return this.labelFormat ?? formats[formatName] ?? null;
		}

		getHeight(): number {
			return this.clipHeight ?? (this.getFieldParamValue('height') as number);
		}

		getAlignment(): string {
			const options: Record<string, string> = {
				left: 'Min',
				right: 'Max',
			};

			const alignValue = this.getFieldParamValue('align') as string;
			return this.align ?? options[alignValue] ?? 'Min';
		}

		getFieldParamValue(fieldParam: string): unknown {
			return this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.name, fieldParam]);
		}
	},
);
