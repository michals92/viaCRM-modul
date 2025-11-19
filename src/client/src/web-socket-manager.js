extend(Dep => class extends Dep {
	constructor(config) {
		super(config);

		this.pingTimeout = config.get('webSocketPingTimeout');
	}

	/**
	 * Subscribe to a topic.
	 *
	 * @param {string} category A topic.
	 * @param {function(string, *): void} callback A callback.
	 */
	subscribe(category, callback) {
		if (!this.connection) {
			console.warn("WebSocketManager: Attempted to subscribe without a connection object.");
			return;
		}

		if (!this.isConnected) {
			this.subscribeQueue.push({
				category: category,
				callback: callback,
			});
			this.subscribeQueue = this.subscribeQueue.filter((item, index, self) =>
				index === self.findIndex((t) => (t.category === item.category && t.callback === item.callback))
			);
			return;
		}

		try {
			this.connection.subscribe(category, callback);

			this.subscriptions.push({
				category: category,
				callback: callback,
			});
		} catch (e) {
			const errorMsg = typeof e === 'string' ? e : (e && e.message);
			if (errorMsg && errorMsg.includes("Autobahn not connected")) {
				console.warn(`WebSocketManager: Autobahn is not yet connected. Re-queuing category '${category}'.`);
				this.subscribeQueue.push({
					category: category,
					callback: callback,
				});
				return;
			}

			throw e;
		}
	}

	/**
	 * @private
	 */
	schedulePing() {
		clearTimeout(this.pingTimeout);
		this.pingTimeout = undefined;

		if (!this.connection || !this.isConnected) {
			return;
		}

		this.pingTimeout = setTimeout(() => {
			if (!this.connection || !this.isConnected) {
				return;
			}

			try {
				this.connection.publish('', '');
				this.schedulePing();
			} catch (e) {
				const errorMsg = typeof e === 'string' ? e : (e && e.message);
				if (errorMsg && errorMsg.includes("Autobahn not connected")) {
					console.warn("WebSocketManager: Caught disconnect race condition during ping. Reconnect logic should handle it.");
				} else {
					console.error(`WebSocket: Could not send ping. Error: ${errorMsg || e}`);
					this.schedulePing();
				}
			}
		}, this.pingInterval * 1000);
	}
});