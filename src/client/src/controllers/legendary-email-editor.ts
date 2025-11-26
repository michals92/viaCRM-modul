import type Controller from 'espocrm/src/controller';

interface EditorOptions {
	id?: string;
}

define(
	'viacrm:controllers/legendary-email-editor',
	['controller'],
	(ControllerClass: typeof Controller) => ControllerClass.extend({

		defaultAction: 'edit',

		edit(this: InstanceType<typeof ControllerClass>, options: EditorOptions): void {
			const id = options.id || 'new';

			console.log('=€ Legendary Email Editor Controller - Loading for ID:', id);

			this.main('viacrm:views/email-template/legendary-editor', {
				templateId: id,
			});
		},

	}),
);
