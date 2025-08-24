<div class="panel panel-default">
    <div class="panel-body">
        <div class="row">
            <div class="col-sm-12">
                <div class="field" data-name="useEasyEmailEditor">{{{useEasyEmailEditor}}}</div>
            </div>
        </div>
        
        <div class="easy-email-info" style="{{#unless useEasyEmail}}display: none;{{/unless}}">
            <hr>
            <div class="alert alert-info">
                <h5><i class="fas fa-info-circle"></i> Easy Email Editor</h5>
                <p>When enabled, you can use the visual drag-and-drop email editor for creating responsive email templates.</p>
                
                <ul class="list-unstyled">
                    <li><i class="fas fa-check text-success"></i> Drag & drop email builder</li>
                    <li><i class="fas fa-check text-success"></i> Mobile responsive design</li>
                    <li><i class="fas fa-check text-success"></i> MJML-based templates</li>
                    <li><i class="fas fa-check text-success"></i> Live preview</li>
                </ul>
                
                {{#if hasBodyMjml}}
                <div class="alert alert-success alert-sm">
                    <i class="fas fa-check-circle"></i> MJML data available
                </div>
                {{/if}}
                
                {{#if hasBody}}
                <div class="alert alert-success alert-sm">
                    <i class="fas fa-check-circle"></i> HTML content available
                </div>
                {{/if}}
            </div>
        </div>
    </div>
</div>