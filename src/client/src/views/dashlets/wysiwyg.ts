define(['views/dashlets/memo'], Dep => class extends Dep {
	name = 'Wysiwyg';

	override templateContent = `
        {{#if body}}
            <div class="complex-text complex-text-memo">{{{body}}}</div>
        {{/if}}
    `;

	override data() {
		return {
			body: this.getOption<string>('body'),
		};
	}
});
