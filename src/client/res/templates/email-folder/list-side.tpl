<ul class="list-group list-group-side list-group-no-border folder-list">
    {{#if showAllFolder}}
    <li
        data-id="all"
        class="list-group-item{{#ifEqual 'all' selectedFolderId}} selected{{/ifEqual}} droppable"
    >
        <a
            href="#Email/list/folder=all"
            data-action="selectFolder"
            data-id="all"
            class="side-link"
        >
        <span class="fas fa-asterisk"></span>
        {{translate 'all' category='presetFilters' scope='Email'}}</a>
    </li>
    {{/if}}
    {{#each collection.models}}
    <li
        data-id="{{get this 'id'}}"
        class="list-group-item{{#ifAttrEquals this 'id' ../selectedFolderId}} selected{{/ifAttrEquals}}{{#if droppable}} droppable{{/if}}"
    >
        <a
            href="#Email/list/folder={{get this 'id'}}"
            data-action="selectFolder"
            data-id="{{get this 'id'}}"
            class="side-link pull-right count"
            {{#if (get this 'color')}} style="color: {{get this 'color'}}!important" {{/if}}
        ></a>
        <a
            href="#Email/list/folder={{get this 'id'}}"
            data-action="selectFolder"
            data-id="{{get this 'id'}}"
            class="side-link"
            {{#if title}}title="{{title}}"{{/if}}
            {{#if (get this 'color')}} style="color: {{get this 'color'}}" {{/if}}
        >
        {{#if (get this 'iconClass')}}
            <span class="fas {{get this 'iconClass'}}" {{#if (get this 'color')}} style="color: {{get this 'color'}}" {{/if}}></span>
        {{/if}}
        {{get this 'name'}}
        </a>
    </li>
    {{/each}}
</ul>
