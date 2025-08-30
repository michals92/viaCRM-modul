<div class="record-container">
    <div class="row">
        <div class="col-sm-12">
            <div class="panel panel-default">
                <div class="panel-body">
                    <div class="row">
                        <div class="col-sm-12">
                            <div class="field" data-name="comment">
                                <label class="control-label">
                                    {{translate 'approverComment' scope='Absence' category='fields'}}
                                    {{#if (eq action 'reject')}}<span class="required-sign"> *</span>{{/if}}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>