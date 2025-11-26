import type AdvancedFiltersFieldView from 'viacrm/views/fields/advanced-filters';
import type VersionHelper from 'viacrm/helpers/version';
import type SearchManager from 'espocrm/src/search-manager';
import type {AdvancedFilter} from 'espocrm/src/search-manager';

define(
	['viacrm:views/fields/advanced-filters', 'viacrm:helpers/version'],
	(Dep, VersionHelperClass) => {
		const Base = Dep as typeof AdvancedFiltersFieldView;
		const Helper = VersionHelperClass as typeof VersionHelper;

		return class extends Base {
			override detailTemplateContent = "{{translate 'displayableOnlyInEditMode' category='messages'}}";

			searchManager!: SearchManager;

			override setup(): void {
				this.entityType = this.model.get('entityType') as string;

				this.wait(this.getCollectionFactory().create('XmlFeed', collection => {
					this.searchManager = (new Helper(this.getConfig()))
						.createSearchManager(collection, null, null, this.getDateTime(), {});
				}));

				super.setup();
			}

			override fetch(): Record<string, Record<string, unknown> | null> {
				const data = super.fetch();

				const filters = data[this.name] as Record<string, AdvancedFilter>;

				this.searchManager.setAdvanced(filters);

				// WhereItem[] needs to be cast to satisfy parent type constraint
				(data as Record<string, unknown>)[this.name + 'Processed'] = this.searchManager.getWhere();

				return data;
			}
		};
	},
);
