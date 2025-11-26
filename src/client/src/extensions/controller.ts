import type View from 'espocrm/src/view';
import type MasterView from 'espocrm/src/views/site/master';
import type { ProcessMainDto } from 'espocrm/src/controller';

import type Controller from 'espocrm/src/controller';

extend<Controller>(Controller => class extends Controller {
	_processMain(mainView: View, masterView: MasterView, dto: ProcessMainDto): void {
		super._processMain(mainView, masterView, dto);

		masterView.trigger('main-view-set', mainView);
	}
});
