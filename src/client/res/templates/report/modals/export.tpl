<div class="export-modal">
    <div class="panel panel-default">
        <div class="panel-body">
            <p>{{translate 'Select export format' category='labels' scope='Report'}}</p>
            
            {{#each formats}}
            <div class="radio">
                <label>
                    <input type="radio" name="exportFormat" value="{{value}}">
                    {{label}}
                </label>
            </div>
            {{/each}}
        </div>
    </div>
</div>