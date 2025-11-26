interface WebSocketConnection {
	subscribe(category: string, callback: (topic: string, data: unknown) => void): void;
	publish(topic: string, data: string): void;
}

interface SubscriptionItem {
	category: string;
	callback: (topic: string, data: unknown) => void;
}

interface Config {
	get(key: string): unknown;
}

interface WebSocketManager {
	connection: WebSocketConnection | null;
	isConnected: boolean;
	subscribeQueue: SubscriptionItem[];
	subscriptions: SubscriptionItem[];
	pingInterval: number;
}

extend(
	(Dep: new (config: Config) => WebSocketManager) => class extends Dep {
		pingTimeout: ReturnType<typeof setTimeout> | number | undefined;

		constructor(config: Config) {
			super(config);

			this.pingTimeout = config.get('webSocketPingTimeout') as number | undefined;
		}

		/**
		 * Subscribe to a topic.
		 */
		subscribe(category: string, callback: (topic: string, data: unknown) => void): void {
			if (!this.connection) {
				console.warn('WebSocketManager: Attempted to subscribe without a connection object.');
				return;
			}

			if (!this.isConnected) {
				this.subscribeQueue.push({
					category,
					callback,
				});
				this.subscribeQueue = this.subscribeQueue.filter((item, index, self) =>
					index === self.findIndex(t => t.category === item.category && t.callback === item.callback),
				);
				return;
			}

			try {
				this.connection.subscribe(category, callback);

				this.subscriptions.push({
					category,
					callback,
				});
			} catch (e) {
				const errorMsg = typeof e === 'string' ? e : (e instanceof Error ? e.message : String(e));
				if (errorMsg.includes('Autobahn not connected')) {
					console.warn(`WebSocketManager: Autobahn is not yet connected. Re-queuing category '${category}'.`);
					this.subscribeQueue.push({
						category,
						callback,
					});
					return;
				}

				throw e;
			}
		}

		/**
		 * @private
		 */
		schedulePing(): void {
			if (this.pingTimeout !== undefined) {
				clearTimeout(this.pingTimeout as ReturnType<typeof setTimeout>);
			}
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
					const errorMsg = typeof e === 'string' ? e : (e instanceof Error ? e.message : String(e));
					if (errorMsg.includes('Autobahn not connected')) {
						console.warn('WebSocketManager: Caught disconnect race condition during ping. Reconnect logic should handle it.');
					} else {
						console.error(`WebSocket: Could not send ping. Error: ${errorMsg}`);
						this.schedulePing();
					}
				}
			}, this.pingInterval * 1000);
		}
	},
);
