<div class="report-result-modal">
    <div class="panel panel-default">
        <div class="panel-body">
            {{#if isChart}}
                <div class="chart-container">
                    <canvas id="reportChart" width="400" height="200"></canvas>
                </div>
            {{/if}}
            
            {{#if isList}}
                <div class="report-content">
                    <!-- List data will be rendered here -->
                </div>
            {{/if}}
            
            {{#if isGrid}}
                <div class="report-content">
                    <!-- Grid data will be rendered here -->
                </div>
            {{/if}}
        </div>
    </div>
</div>