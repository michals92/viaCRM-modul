{{#if holiday}}
{{#with holiday}}
<div
    id='nav-date-today'
    data-action='navigateToCalendar'
    class="nav-holiday-container {{#if isLoggedInUserHoliday}}nav-user-holiday{{/if}}"
>
    <div class="nav-holiday-icon">
        <i class="fas fa-calendar-day"></i>
    </div>
    <div class="nav-holiday-content">
        <span class="nav-holiday-date">
            <span>{{../day}}. {{genitive}}</span>
        </span>
        <span class="nav-holiday-user">
        	{{../messageTodayUser}}
        </span>

        {{#if holidayName}}
        <div class="nav-holiday-public">
        	{{../messageTodayPublic}}
        </div>
        {{/if}}
    </div>
</div>
{{/with}}
{{/if}}