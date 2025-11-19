<div class='panel panel-default'>
	<div class='panel-heading'>
		<h4 class='panel-title'>
			{{translate
				'attachments'
				category='fields'
				scope='SupplierInvoice'
			}}
		</h4>
	</div>
	<div class='panel-body'>
		{{#if attachments.length}}
			<div class="button-container clearfix">
				<div class="btn-group">
					{{#each attachments}}
						<button
							class="btn btn-text btn-xs-wide{{#if active}} active{{/if}}"
							data-action="selectAttachment"
							data-id="{{id}}"
							{{#if ../disabled}}disabled="disabled"{{/if}}
						>{{name}}</button>
					{{/each}}
				</div>
			</div>
			{{#each attachments}}
				<div class="attachment-container" data-id="{{id}}" style="{{#unless active}}display:none;{{/unless}}">
					<object data="{{../baseUrl}}{{id}}" data-name="embeddedPdfViewer"
						type="{{type}}" width="100%" height="100%" style="position: relative;">
						<p>
							{{translate 'EmbeddedIframe.UnableToDisplay'}}
							<a href="{{../downloadUrl}}{{id}}">
								{{translate 'Download'}}
							</a>
						</p>
					</object>
				</div>
			{{/each}}
		{{else}}
			{{translate 'No Data'}}
		{{/if}}
	</div>
</div>