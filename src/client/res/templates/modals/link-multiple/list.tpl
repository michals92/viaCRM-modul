<div class="modal-dialog {{cssName}}">
    <div class="modal-content">
        {{#if header}}
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title">{{header}}</h4>
            </div>
        {{/if}}
        <div class="modal-body">
			<div class="recordList">{{{list}}}</div>
        </div>
    </div>
</div>
