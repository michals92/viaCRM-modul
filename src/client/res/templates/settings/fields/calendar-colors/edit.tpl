<div class="link-container list-group">
    {{#each entityList}}
    <div class="list-group-item" data-value="{{name}}" style="cursor: default;">
        <span class="text">{{label}}</span>
        <div class="input-group" style="margin-top: 5px;">
            <input 
                type="text" 
                class="form-control input-sm" 
                data-name="colorValue" 
                data-value="{{name}}" 
                value="{{lookup ../colorMap name}}" 
                autocomplete="off"
            >
            <span class="input-group-addon"><i></i></span>
        </div>
    </div>
    {{/each}}
</div>
