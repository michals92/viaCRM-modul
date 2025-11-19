<div class="popup-notification-message alert-notification animate__animated animate__fadeInRight">
    <div class="notification-content">
        <div class="notification-header">
				<span class="badge-icon {{notificationData.iconClass}}"></span>
				<span class="status-badge">
					<a href="#{{notificationData.entityType}}/view/{{notificationData.id}}">
						{{translateOption notificationData.status field='status' scope=notificationData.entityType}}
					</a>
				</span>

        </div>
        <span class="popup-message">{{{notificationData.message}}}</span>
    </div>
    {{#if closeButton}}
        <button class="close-button" data-action="close" title="{{translate 'Close'}}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    {{/if}}
</div>
