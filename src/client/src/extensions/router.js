extend(Dep => {
	// Store the original getHash function that EspoCRM already overrides
	const originalGetHash = Backbone.history.getHash;

	// Override Backbone.history.getHash to normalize trailing slashes
	Backbone.history.getHash = function (window) {
		// Call the original getHash (which already handles whitespace issues)
		let hash = originalGetHash.call(this, window);

		// Normalize by removing trailing slashes
		// This ensures #Entity and #Entity/ are treated the same
		if (hash && hash.endsWith('/')) {
			hash = hash.slice(0, -1);
		}

		return hash;
	};

	return Dep;
});
