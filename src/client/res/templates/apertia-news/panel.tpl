<ul class="dropdown-menu dropdown-menu-right ape-news-panel show" role="menu" aria-labelledby="nav-apertia-news">
    {{#unless iframeDisabled}}
    <iframe
        src="{{iframeUrl}}"
        style="width: 100%; height: {{iframeHeight}}rem"
        frameborder="0"
        webkitallowfullscreen mozallowfullscreen allowfullscreen
    ></iframe>
    {{/unless}}
</ul>