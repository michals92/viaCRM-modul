import type DetailView from 'espocrm/src/views/detail';
import type ActionHandler from 'espocrm/src/action-handler';

define(['action-handler'], (Dep: typeof ActionHandler<DetailView>) => class extends Dep {
	actionViewFeed() {
		const id = this.view.model.id;

		if (this.view.model.get('isPublic')) {
			window.open('?entryPoint=xmlFeedPublic&id=' + id, '_blank');
		} else {
			window.open('?entryPoint=xmlFeed&id=' + id, '_blank');
		}
	}
});
