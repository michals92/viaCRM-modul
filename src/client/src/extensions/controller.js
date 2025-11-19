extend(Controller => class extends Controller {
	_processMain(mainView, masterView, dto) {
		super._processMain(mainView, masterView, dto);

		masterView.trigger('main-view-set', mainView);
	}
});
