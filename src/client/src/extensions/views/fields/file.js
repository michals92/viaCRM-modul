extend(Dep => class extends Dep {
	listLinkTemplate = 'autocrm:fields/file/list-link';
		
	getDownloadUrl(id) {
		let url = super.getDownloadUrl(id);
		if (this.params.forceDownload) {
			url += '&forceDownload=true';
		}
		return url;
	}
});
