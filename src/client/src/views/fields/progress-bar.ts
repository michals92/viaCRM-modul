import type BaseFieldView from 'espocrm/src/views/fields/base';
import type Model from 'espocrm/src/model';
import type * as d3Type from 'd3';
import type { ProgressBarFieldFetch } from 'viacrm/types';

define(
	['views/fields/base', 'd3'],
	(Dep: typeof BaseFieldView, d3: typeof d3Type) => class extends Dep {
		override type = 'graph';

		override listTemplate = 'viacrm:fields/progress-bar/list';
		override detailTemplate = 'viacrm:fields/progress-bar/detail';
		override editTemplate = 'viacrm:fields/progress-bar/edit';

		range: number | undefined = undefined;
		r: number | undefined = undefined;
		s: unknown = undefined;
		progress: d3Type.Selection<SVGTextElement, unknown, null, undefined> | undefined = undefined;
		pointerHeadLength: unknown = undefined;
		value = 0;

		svg: d3Type.Selection<SVGSVGElement, unknown, null, undefined> | undefined = undefined;
		scale: unknown = undefined;
		pointer: unknown = undefined;
		bar!: d3Type.Selection<SVGRectElement, unknown, null, undefined>;

		declare $element: JQuery;
		declare model: Model;
		declare name: string;
		declare mode: string;

		startColor?: string;
		endColor?: string;
		labelsFontWidth?: number;
		labelsEnabled?: boolean;
		labelsFormat?: unknown;
		height?: number;
		width?: number;
		backgroundColor?: string;
		labelsColor?: string;
		align?: string;

		config: {
			clipHeight: number;
			ringInset: number;
			ringWidth: number;
			height: number;
			width: number;
			minValue: number;
			maxValue: number;
			transitionMs: number;
			majorTicks: number;
			labelFormat: (n: number) => string;
			labelInset: number;
			labelsFontWidth: number;
			startColor: string;
			endColor: string;
			labelsColor: string;
			backgroundColor: string;
			align: string;
			minAngle?: number;
			maxAngle?: number;
		} = {
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

		override setup(): void {
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

		configure(configuration: Partial<typeof this.config>): void {
			let prop: keyof typeof configuration;
			for (prop in configuration) {
				(this.config as Record<string, unknown>)[prop] = configuration[prop];
			}

			this.range = (this.config.maxAngle || 0) - (this.config.minAngle || 0);
			this.r = this.config.width / 2;
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
			return '';
		}

		createProgress(): void {
			this.progress = this.svg!
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

		centerTranslation(): string {
			return 'translate(' + this.r + ',' + this.config.labelsFontWidth / 2 + ')';
		}

		renderGraph(): void {
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
				.attr('width', () => (parseFloat(this.getProgressPercent()) / 100) * this.config.width)
				.attr('x', 0);

			this.createProgress();
		}

		updateGraph(): void {
			this.config.maxValue = this.getTargetValue();

			this.updatePercentDisplay();

			this.bar
				.transition()
				.duration(this.config.transitionMs)
				.ease(d3.easePoly)
				.attr('fill', this.getArcColor())
				.attr('width', (parseFloat(this.getProgressPercent()) / 100) * this.config.width + 'px');
		}

		updatePercentDisplay(): void {
			this.progress!.text(this.getProgressPercent() + '%');
		}

		getArcColor(): string {
			return d3.interpolateHsl(
				d3.rgb(this.config.startColor),
				d3.rgb(this.config.endColor),
			)(parseFloat(this.getProgressPercent()) / 100);
		}

		override fetch(): ProgressBarFieldFetch {
			let value = this.$element.val() as string;
			value = this.parse(value);

			const data: ProgressBarFieldFetch = {};

			data[this.name] = parseFloat(value);

			return data;
		}

		parse(value: string): string {
			return value;
		}

		getProgressPercent(): string {
			const percent = (this.getCurrentValue() / this.getTargetValue()) * 100;

			return percent.toFixed(2);
		}

		getCurrentValue(): number {
			return this.model.get(this.getCurrentFieldName()) as number;
		}

		getCurrentFieldName(): string {
			return this.getFieldParamValue('currentValue') as string;
		}

		getTargetValue(): number {
			return this.model.get(this.getTargetFieldName()) as number;
		}

		getTargetFieldName(): string {
			return this.getFieldParamValue('targetValue') as string;
		}

		getStartColor(): string {
			return this.startColor || this.getFieldParamValue('startColor') as string;
		}

		getEndColor(): string {
			return this.endColor || this.getFieldParamValue('endColor') as string;
		}

		getLabelsFontWidth(): number {
			return this.labelsFontWidth || this.getFieldParamValue('labelsFontWidth') as number;
		}

		getLabelsEnabled(): boolean {
			return this.labelsEnabled || this.getFieldParamValue('labelsEnabled') as boolean;
		}

		getLabelsFormat(): (n: number) => string {
			const formats: Record<string, (n: number) => string> = {
				int: d3.format('d'),
				float: d3.format('.2f'),
			};
			return (this.labelsFormat || formats[this.getFieldParamValue('labelsFormat') as string]) as (n: number) => string;
		}

		getHeight(): number {
			return this.height || this.getFieldParamValue('height') as number;
		}

		getWidth(): number {
			return this.width || this.getFieldParamValue('width') as number;
		}

		getBackgroundColor(): string {
			return this.backgroundColor || this.getFieldParamValue('backgroundColor') as string;
		}

		getLabelsColor(): string {
			return this.labelsColor || this.getFieldParamValue('labelColor') as string;
		}

		getAlignment(): string {
			const options: Record<string, string> = {
				left: 'Min',
				right: 'Max',
			};

			return this.align || options[this.getFieldParamValue('align') as string];
		}

		getFieldParamValue(fieldParam: string): unknown {
			return this.getMetadata().get(['entityDefs', this.model.entityType, 'fields', this.name, fieldParam]);
		}
	},
);
