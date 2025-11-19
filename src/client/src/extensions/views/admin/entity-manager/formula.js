extend(Dep => class extends Dep {
	setup() {
		const orgGetRequest = Espo.Ajax.getRequest;

		Espo.Ajax.getRequest = (url, data, options) => orgGetRequest.call(Espo.Ajax, url, data, options).then(result => {
			if (url === 'Metadata/action/get' && data.key && data.key.startsWith('formula')) {
				Espo.Ajax.getRequest = orgGetRequest;
				this.model.set('readLoaderCustomScript', result?.readLoaderCustomScript);
				this.model.set('listLoaderCustomScript', result?.listLoaderCustomScript);
			}

			return result;
		});
			
		super.setup();
	}
});
