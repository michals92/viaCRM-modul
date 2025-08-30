<div class="panel panel-default">
    <div class="panel-heading">
        <h4 class="panel-title">
            {{translate 'Approval' scope='Absence'}}
        </h4>
    </div>
    <div class="panel-body">
        {{#each buttonList}}
        <button class="btn btn-{{style}} btn-sm action" data-action="{{name}}">
            {{translate label scope='Absence'}}
        </button>
        {{/each}}
        
        <div class="row">
            <div class="cell col-sm-6" data-name="status">
                <label class="control-label">{{translate 'status' scope='Absence' category='fields'}}</label>
                <div class="field" data-name="status">{{{status}}}</div>
            </div>
            
            {{#if approvedBy}}
            <div class="cell col-sm-6" data-name="approvedBy">
                <label class="control-label">{{translate 'approvedBy' scope='Absence' category='fields'}}</label>
                <div class="field" data-name="approvedBy">{{{approvedBy}}}</div>
            </div>
            {{/if}}
        </div>
        
        {{#if approvedAt}}
        <div class="row">
            <div class="cell col-sm-6" data-name="approvedAt">
                <label class="control-label">{{translate 'approvedAt' scope='Absence' category='fields'}}</label>
                <div class="field" data-name="approvedAt">{{{approvedAt}}}</div>
            </div>
        </div>
        {{/if}}
        
        {{#if approverComment}}
        <div class="row">
            <div class="cell col-sm-12" data-name="approverComment">
                <label class="control-label">{{translate 'approverComment' scope='Absence' category='fields'}}</label>
                <div class="field" data-name="approverComment">{{{approverComment}}}</div>
            </div>
        </div>
        {{/if}}
    </div>
</div>