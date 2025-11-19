<div class="panel panel-default no-side-margin">
    <div class="panel-body panel-body-form">
        <div class="row">
            <div class="cell col-sm-6 form-group">
                <label class="control-label">{{translate 'recipient' scope='Workflow'}}</label>
                <div class="field field-recipient">
                    {{{recipient}}}
                </div>
            </div>
            <div class="cell col-sm-6 cell-users form-group">
                <label class="control-label">{{translate 'users' scope='Workflow'}}</label>
                <div class="field field-users">
                    {{{users}}}
                </div>
            </div>
            <div class="cell col-sm-6 cell-specifiedTeams form-group">
                <label class="control-label">{{translate 'Team' category='scopeNamesPlural'}}</label>
                <div class="field field-specifiedTeams">
                    {{{specifiedTeams}}}
                </div>
            </div>
        </div>
        <div class="row">
            <div class="cell cell-messageTemplate col-sm-6 form-group">
                <label class="control-label">{{translate 'messageTemplate' scope='Workflow'}}</label>
                <div class="field field-messageTemplate">{{{messageTemplate}}}</div>
            </div>
            <div class="cell col-sm-6 form-group">
                {{complexText alertTemplateHelpText}}
            </div>
        </div>
        <div class="row">
            <div class="cell cell-iconClass col-sm-6 form-group">
                <label class="control-label">{{translate 'iconClass' scope='Workflow'}}</label>
                <div class="field field-iconClass">{{{iconClass}}}</div>
            </div>
            <div class="cell cell-showInCalendar col-sm-6 form-group">
                <label class="control-label">{{translate 'showInCalendar' scope='Workflow'}}</label>
                <div class="field field-showInCalendar">{{{showInCalendar}}}</div>
            </div>
        </div>
    </div>
</div>
