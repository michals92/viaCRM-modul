<% _.each(layout, function (defs, key) { %>
    <%
    let width = null;
    if (defs.options && defs.options.defs && 'width' in defs.options.defs) {
        width = (defs.options.defs.width + '%') || null;
    }
    if (defs.options && defs.options.defs && 'widthPx' in defs.options.defs) {
        width = defs.options.defs.widthPx || null;
    }
    let align = false;
    let breakText = false;
    if (defs.options && defs.options.defs) {
        align = defs.options.defs.align || false;
        breakText = defs.options.defs.breakText || false;
    }
    %>
    <td class="cell"
        data-name="<%= defs.columnName %>"
        <% if (width || align || breakText) { %>
        style="<% if (width) print('width: ' + width); %><% if (align) print('; text-align: ' + align); %><% if (breakText) print('; white-space: normal'); %>"
        <% } %>>
        <%
        var tag = 'tag' in defs ? defs.tag : false;
        if (tag) {
            print( '<' + tag);
            if ('id' in defs) {
                print(' id="'+defs.id+'"');
            }
            if ('class' in defs) {
                print(' class="'+defs.class+'"');
            };
            print('>');
        }
        %>{{{this.<%= defs.name %>}}}<%
        if (tag) {
            print( '</' + tag + '>');
        }
        %>
    </td>
<% }); %>