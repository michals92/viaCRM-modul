define(['views/record/kanban'], Dep => class extends Dep {
	type = 'partitioned';

	name = 'partitioned';

	template = 'autocrm:record/partitioned';

	layoutName = 'list';

	adjustMinHeight = Function.prototype;

	initStickableHeader = Function.prototype;

	buildRows(callback) {
		this.buildRowsInternal(this.groupRawDataList || [], callback);
	}

	buildRowsInternal(groupList, callback, nestedViewCallback) {
		this.wait(false);
		this.statusField = this.partitionBy = this.collection.partitionBy;

		this.collection.reset();

		this.collection.subCollectionList = [];

		this.getSelectAttributeList(
			selectAttributeList => (this.collection.data.select = selectAttributeList.join(',')),
		);

		this.wait(true);

		this.groupDataList = [];

		let count = 0;
		const promiseList = [];

		this.getListLayout(listLayout => {
			this.listLayout = listLayout;

			groupList.forEach(item => {
				const collection = this.seedCollection.clone();

				collection.total = item.total;

				collection.url = this.collection.url;
				collection.entityType = this.collection.entityType;

				collection.where = this.collection.where;
				collection.name = this.seedCollection.name;
				collection.maxSize = this.seedCollection.maxSize;
				collection.orderBy = this.seedCollection.orderBy;
				collection.order = this.seedCollection.order;

				collection.whereAdditional = [
					{
						field: this.partitionBy,
						type: 'equals',
						value: item.name,
					},
				];

				collection.groupName = item.name;
				collection.set(item.list);

				this.collection.subCollectionList.push(collection);
				this.collection.add(collection.models);

				const listViewName = this.getMetadata().get(
					['clientDefs', collection.name, 'recordViews', 'list'],
					'views/record/list',
				);
				const viewKey = 'partition-' + item.name;
				const style =
						item.style ||
						this.getMetadata().get([
							'entityDefs',
							this.scope,
							'fields',
							this.partitionBy,
							'style',
							item.name,
						]);
				const itemDataList = [];

				collection.models.forEach(model => {
					count++;

					itemDataList.push({
						key: model.id,
						id: model.id,
					});
				});

				this.groupDataList.push({
					name: item.name,
					key: viewKey,
					dataList: itemDataList,
					collection: collection,
					total: collection.total,
					hasShowMore: collection.total > collection.length || collection.total === -1,
					title:
							item.label || this.getLanguage().translateOption(item.name, this.partitionBy, this.scope),
					style,
					totalCountFormatted: this.getNumberUtil().formatInt(collection.total),
				});

				promiseList.push(
					new Promise(resolve => {
						this.createView(
							viewKey,
							listViewName,
							{
								collection: collection,
								scope: collection.name,
								el: this.options.el + ' .partition[data-name="' + item.name + '"]',
								showCount: false,
								setViewBeforeCallback: this.options.skipBuildRows && !this.isRendered(),
								...this.getNestedViewAdditionalOptions(),
							},
							nestedView => {
								if (nestedViewCallback) {
									nestedViewCallback(nestedView);
								}

								resolve();
							},
						);
					}),
				);
			});

			const wrappedCallback = () => {
				this.wait(false);

				if (typeof callback === 'function') {
					callback();
				}
			};

			if (count === 0) {
				wrappedCallback();

				return;
			}

			Promise.all(promiseList).then(wrappedCallback);
		});
	}

	getNestedViewAdditionalOptions() {
		return {};
	}
});
