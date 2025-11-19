<div class='panel panel-default upload'>
	<div class='panel-heading'>
		<h4 class='panel-title'>{{translate 'uploadZip' category='messages' scope='Document'}}</h4>
	</div>
	<div class='panel-body'>
		<div>
			<input type='file' name='zip' accept='application/zip' />
		</div>
		<div class='message-container text-danger' style='height: 20px; margin-bottom: 10px; margin-top: 10px;'></div>
		<div class='buttons-container'>
			<button class='btn btn-primary disabled' data-action='upload'>{{translate 'Upload' scope='Admin'}}</button>
		</div>
	</div>
</div>