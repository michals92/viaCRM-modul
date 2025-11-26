import type RecordController from 'espocrm/src/controllers/record';
import type View from 'espocrm/src/bull/view';

interface HrCreateData {
	id: string;
}

define(
	'viacrm:controllers/hr',
	['controllers/record'],
	(Controller: typeof RecordController) => Controller.extend({

		actionCreateFromUser(this: InstanceType<typeof RecordController>): void {
			console.log('HR actionCreateFromUser called');

			this.createView('modal', 'viacrm:views/hr/create-from-user-modal', {}, (view: View) => {
				console.log('Modal view created');
				view.render();

				this.listenToOnce(view, 'created', (data: HrCreateData) => {
					console.log('HR record created:', data);
					this.getRouter().navigate('#Hr/view/' + data.id, { trigger: true });
				});
			});
		},

	}),
);
