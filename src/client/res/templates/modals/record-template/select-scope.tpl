<ul class="list-group array-add-list-group no-side-margin">
    {{#each entityList}}
        <li class="list-group-item clearfix">
            <a href="javascript:" class="add text-bold" data-name="{{name}}">{{translated}}</a>
        </li>
    {{/each}}
</ul>