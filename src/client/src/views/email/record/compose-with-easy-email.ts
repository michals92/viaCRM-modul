define(['views/email/record/compose'], Dep => class extends Dep {


	/**
	 * Object to store signatures for different email addresses
	 */
	protected signatures: Record<string, string> = {};

	/**
		 * Available email addresses for the current user
		 */
	protected availableEmailAddresses: string[] = [];

	/**
		 * Email addresses that don't have custom signatures (to avoid redundant API calls)
		 */
	protected addressBlacklist: string[] = [];

	/**
		 * Flag to bypass parent signatures
		 */
	protected bypassParentSignature: boolean = false;

	/**
		 * Override setupBeforeFinal to intercept the parent's signature adding
		 */
	setupBeforeFinal() {
		// If this is a first load/new compose, we'll let the parent add the default signature
		if (!this.bypassParentSignature) {
			super.setupBeforeFinal();
		} else {
			// If we're controlling signatures, prevent parent from adding one
			// Temporarily modify hasSignature to return false
			const originalHasSignature = this.hasSignature;
			this.hasSignature = function () {
				return false;
			};

			// Call parent without allowing it to add a signature
			super.setupBeforeFinal();

			// Restore original method
			this.hasSignature = originalHasSignature;
		}
	}

	setup() {
		super.setup();

		// Check user preferences for signature position
		const userPreferences = this.getPreferences();

		// Look for a "signaturePosition" preference, default to "prepend" if not found
		const signaturePosition = userPreferences.get('signaturePosition') || 'prepend';

		// Set the appendSignature option based on user preference
		this.options.appendSignature = signaturePosition === 'append';

		// Listen to changes in the 'from' field to handle signature switching
		this.listenTo(this.model, 'change:from', this.handleFromChange);

		// Add Easy Email Editor button to compose view
		this.addButton({
			name: 'useEasyEmailEditor',
			label: 'Easy Email Editor',
			style: 'default',
			position: 'top'
		});

		this.listenTo(this, 'after:render', () => {
			this.setupEasyEmailToggle();
		});
	}


	/**
		 * Completely override prependSignature to fix issues in parent implementation
		 */
	prependSignature(body, isHtml, signature) {
		// Safety checks for null/undefined values
		let bodyContent = body || '';
		const signatureContent = signature || '';

		if (!signatureContent) {
			return bodyContent;
		}

		// Before adding signature, make sure there's no duplicate
		if (bodyContent.includes(signatureContent)) {
			bodyContent = this.removeExistingSignature(bodyContent, isHtml, signatureContent);
		}

		// Add signature to the beginning of the body (with proper spacing)
		let newBody = '';

		if (isHtml) {
			// For HTML mode
			const hasBreakAfter = signatureContent.endsWith('<p><br></p>');
			const bodyStartsWithBreak = bodyContent.startsWith('<p><br></p>');

			// Build the new body based on the content structure
			if (hasBreakAfter || bodyStartsWithBreak) {
				// If either has breaks, don't add extra ones
				newBody = signatureContent + bodyContent;
			} else {
				// Otherwise add a break between
				newBody = signatureContent + '<p><br></p>' + bodyContent;
			}
		} else {
			// For plain text, add a couple newlines after the signature if there's a body
			if (bodyContent) {
				newBody = signatureContent + '\n\n' + bodyContent;
			} else {
				newBody = signatureContent;
			}
		}

		return newBody;
	}

	/**
		 * Handles changes to the "from" email address
		 * Updates the signature when the from address changes
		 */
	handleFromChange = () => {
		const newFromAddress = this.model.get('from');

		// Skip if signatures are disabled
		if (this.options.signatureDisabled) {
			return;
		}

		// Set flag to prevent parent class from adding signatures
		this.bypassParentSignature = true;

		// Update the signature for the new email address
		this.replaceSignatureForAddress(newFromAddress);
	};

	/**
		 * Completely replaces the signature in the email body
		 * @param {string} emailAddress - The email address to use signature for
		 */
	replaceSignatureForAddress(emailAddress: string) {
		if (!emailAddress || this.options.signatureDisabled) {
			return;
		}

		// Get current body and isHtml state
		const currentBody = this.model.get('body') || '';
		const isHtml = this.model.get('isHtml');

		// Get default signature to remove
		const defaultSignature = this.getPreferences().get('signature') || '';

		// First, completely remove any existing signatures from the body
		let cleanBody = currentBody;

		// Try to remove default signature
		if (defaultSignature) {
			cleanBody = this.removeExistingSignature(cleanBody, isHtml, defaultSignature);
		}

		// Also try to remove any other signature in our cache
		Object.values(this.signatures).forEach(signature => {
			if (signature && signature !== defaultSignature) {
				cleanBody = this.removeExistingSignature(cleanBody, isHtml, signature);
			}
		});

		// Get the signature for this email address
		this.getSignatureForAddress(emailAddress, newSignature => {
			if (!newSignature) {
				// Use our helper method to update the body properly
				this.updateBodyContent(cleanBody);
				return;
			}

			// Apply the new signature
			const method = this.options.appendSignature ? 'appendSignature' : 'prependSignature';

			// Call our own method, not the parent's (since we've completely overridden it)
			const newBody = this[method](cleanBody, isHtml, newSignature);

			// Only verify if we have a valid signature and body
			if (newSignature && newSignature.length > 0) {
				// Verify that the signature was actually added to the body
				if (newBody.indexOf(newSignature) === -1) {
					// Try to add signature manually if our method failed
					let manualBody = '';

					if (method === 'prependSignature') {
						manualBody = isHtml
							? `${newSignature}<p><br></p>${cleanBody}`
							: `${newSignature}\n\n${cleanBody}`;
					} else {
						manualBody = isHtml
							? `${cleanBody}<p><br></p>${newSignature}`
							: `${cleanBody}\n\n${newSignature}`;
					}

					// Use the manually created body with signature
					return this.updateBodyContent(manualBody);
				}
			}

			// Use our unified helper method to update the body content
			this.updateBodyContent(newBody);
		});
	}

	/**
		 * Removes any existing signature from email body
		 * @param {string} body - The email body
		 * @param {boolean} isHtml - Whether the body is HTML
		 * @param {string} signature - The signature to remove
		 * @returns {string} - The body with signature removed
		 */
	removeExistingSignature(body: string, isHtml: boolean, signature: string): string {
		// Safety check for missing inputs
		const bodyContent = body || '';
		const signatureContent = signature || '';

		if (!signatureContent || !bodyContent) {
			return bodyContent;
		}

		try {
			// For HTML content
			if (isHtml) {
				// Try different patterns for signature removal

				// 1. Try exact signature match
				if (bodyContent.includes(signatureContent)) {
					return bodyContent.replace(signatureContent, '');
				}

				// 2. Try prepended pattern: <p><br></p> + signature
				const prependPattern = `<p><br></p>${this.escapeRegExp(signatureContent)}`;
				const prependRegex = new RegExp(prependPattern);
				let newBody = bodyContent.replace(prependRegex, '');

				// 3. Try prepended pattern at beginning: ^<p><br></p> + signature
				if (newBody === bodyContent) {
					const startPattern = `^<p><br></p>${this.escapeRegExp(signatureContent)}`;
					const startRegex = new RegExp(startPattern);
					newBody = bodyContent.replace(startRegex, '');
				}

				// 4. Try appended pattern: signature at end
				if (newBody === bodyContent) {
					const endPattern = `${this.escapeRegExp(signatureContent)}$`;
					const endRegex = new RegExp(endPattern);
					newBody = bodyContent.replace(endRegex, '');
				}

				if (newBody !== bodyContent) {
					return newBody;
				}

				return bodyContent;
			}
			// For plain text content
			else {
				const plainSignature = this.htmlToPlain(signatureContent);

				// 1. Try exact signature match for plain text
				if (bodyContent.includes(plainSignature)) {
					return bodyContent.replace(plainSignature, '');
				}

				// 2. Try prepended pattern: \n\n + signature + \n
				const prependPattern = `\\n\\n${this.escapeRegExp(plainSignature)}\\n`;
				const prependRegex = new RegExp(prependPattern);
				let newBody = bodyContent.replace(prependRegex, '');

				// 3. Try prepended pattern at start: ^\n\n + signature + \n
				if (newBody === bodyContent) {
					const startPattern = `^\\n\\n${this.escapeRegExp(plainSignature)}\\n`;
					const startRegex = new RegExp(startPattern);
					newBody = bodyContent.replace(startRegex, '');
				}

				// 4. Try appended pattern: \n\n + signature at end
				if (newBody === bodyContent) {
					const endPattern = `\\n\\n${this.escapeRegExp(plainSignature)}$`;
					const endRegex = new RegExp(endPattern);
					newBody = bodyContent.replace(endRegex, '');
				}

				if (newBody !== bodyContent) {
					return newBody;
				}

				return bodyContent;
			}
		} catch (error) {
			return body;
		}
	}

	/**
		 * Helper to escape special regex characters
		 * @param {string} string - String to escape
		 * @returns {string} - Escaped string
		 */
	escapeRegExp(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/**
		 * Gets the signature for a specific email address
		 * @param {string} emailAddress - The email address
		 * @param {Function} callback - Callback function to receive the signature
		 */
	getSignatureForAddress(emailAddress: string, callback: (signature: string | null) => void) {
		// Return cached signature if available
		if (this.signatures[emailAddress]) {
			callback(this.signatures[emailAddress]);
			return;
		}

		// If address is blacklisted (known to have no custom signature), use default
		if (this.addressBlacklist.includes(emailAddress)) {
			const defaultSig = this.getPreferences().get('signature') || '';
			callback(defaultSig);
			return;
		}

		// Fetch signature from API
		Espo.Ajax.getRequest('Mail/GetSignature', {
			emailAddress: emailAddress,
		})
			.then(response => {
				// Check if the response is a direct signature string
				if (typeof response === 'string' && response) {
					this.signatures[emailAddress] = response;
					callback(response);
					return;
				}

				// Check if the response is an object with email addresses as keys
				if (typeof response === 'object' && response !== null) {
					// Check if it contains the email address we're looking for
					if (emailAddress in response && typeof response[emailAddress] === 'string') {
						this.signatures[emailAddress] = response[emailAddress];
						callback(response[emailAddress]);
						return;
					}

					// Sometimes API returns object with a 'signature' key instead
					if ('signature' in response && typeof response.signature === 'string') {
						this.signatures[emailAddress] = response.signature;
						callback(response.signature);
						return;
					}
				}

				// If we get here, no valid signature was found
				this.addToBlacklist(emailAddress);
				callback(this.getPreferences().get('signature') || '');
			})
			.catch(__ => {
				// In case of error, use default signature
				this.addToBlacklist(emailAddress);
				callback(this.getPreferences().get('signature') || '');
			});
	}

	/**
		 * Mark email address as not having a custom signature
		 * @param {string} emailAddress - Email address to blacklist
		 */
	addToBlacklist(emailAddress: string) {
		if (!this.addressBlacklist.includes(emailAddress)) {
			this.addressBlacklist.push(emailAddress);
			delete this.signatures[emailAddress];
		}
	}

	/**
		 * Helper method to update body content in both model and view
		 * This ensures that the content is updated in all possible places
		 * @param {string} newBody - The new body content to set
		 */
	updateBodyContent(newBody: string) {
		// 1. Update the model directly
		this.model.set('body', newBody);

		// 2. Get the body field view
		const bodyField = this.getFieldView('body');
		if (!bodyField) {
			return;
		}

		// 3. Use bodyField's methods if available
		try {
			if (typeof bodyField.model.set === 'function') {
				bodyField.model.set('body', newBody);
			}

			if (typeof bodyField.setValue === 'function') {
				bodyField.setValue(newBody);
			}

			// 4. For Summernote HTML editor
			if (this.model.get('isHtml')) {
				// Try to find Summernote editor element
				let $summernote: JQuery | null = null;

				// Multiple ways Summernote might be referenced
				if (bodyField.$summernote && bodyField.$summernote.length) {
					$summernote = bodyField.$summernote;
				} else if (bodyField.$element && bodyField.$element.length) {
					$summernote = bodyField.$element;
				} else {
					$summernote = this.$el.find('[data-name="body"] .note-editable');
				}

				if ($summernote && $summernote.length) {
					// Direct DOM update
					if ($summernote.hasClass('note-editable')) {
						$summernote.html(newBody);
					}

					// Check for parent elements that might host Summernote
					let $container = $summernote.closest('.note-editor');
					if (!$container.length) {
						$container = $summernote.closest('.summernote');
					}

					// Use Summernote API if available (on container or element)
					// @ts-ignore oof
					if ($container.length && typeof $container.summernote === 'function') {
						// @ts-ignore oof
						$container.summernote('code', newBody);
						// @ts-ignore oof
					} else if (typeof $summernote.summernote === 'function') {
						// @ts-ignore oof
						$summernote.summernote('code', newBody);
					}

					// Also try using the bodyField's internal references to Summernote
					if (bodyField.$summernote && typeof bodyField.$summernote.summernote === 'function') {
						bodyField.$summernote.summernote('code', newBody);
					}
				}

				// Try to access Summernote instance directly
				try {
					const $editor = this.$el.find('.summernote');
					if ($editor.length && typeof $editor.summernote === 'function') {
						$editor.summernote('code', newBody);
					}
				} catch (e) {
					// Silent error handling
				}
			}
			// 5. For plain text
			else {
				const $textarea = this.$el.find('[data-name="body"] textarea');
				if ($textarea.length) {
					$textarea.val(newBody).trigger('change');
				}
			}

			// 6. Force rendering or refreshing the field if possible
			if (typeof bodyField.render === 'function') {
				bodyField.render();
			}

			// 7. Try to find and use any Wysiwyg-specific methods
			if (this.model.get('isHtml') && bodyField) {
				// Look for various possible methods to update Wysiwyg content
				const possibleMethods = [
					'setContentReady',
					'setContent',
					'updateHtml',
					'htmlContent',
					'setHtml',
					'updateWysiwyg',
					'refreshWysiwyg',
				];

				for (const methodName of possibleMethods) {
					if (typeof bodyField[methodName] === 'function') {
						try {
							bodyField[methodName](newBody);
						} catch (e) {
							// Silent error handling
						}
					}
				}
			}

			// 8. Finally try to execute any client-side reinitialization
			if (typeof bodyField.afterRender === 'function') {
				try {
					bodyField.afterRender();
				} catch (e) {
					// Silent error handling
				}
			}
		} catch (e) {
			// Silent error handling
		}
	}

	/**
		 * Override initInsertTemplate to bypass confirmation
		 */
	initInsertTemplate() {
		this.listenTo(this.model, 'insert-template', data => {
			const body = this.model.get('body') || '';
			let bodyPlain = body.replace(/<br\s*\/?>/mg, '');
			bodyPlain = bodyPlain.replace(/<\/p\s*\/?>/mg, '');
			bodyPlain = bodyPlain.replace(/ /g, '');
			bodyPlain = bodyPlain.replace(/\n/g, '');
			const $div = $('<div>').html(bodyPlain);
			bodyPlain = $div.text();

			if (bodyPlain !== '' && this.isBodyChanged) {
				if (this.getConfig().get('disableConfirmInsertTemplate')) {
					this.insertTemplate(data);

					return;
				} else {
					this.confirm({
						message: this.translate('confirmInsertTemplate', 'messages', 'Email'),
						confirmText: this.translate('Yes')
					}).then(() => this.insertTemplate(data));

					return;
				}
			}

			this.insertTemplate(data);
		});
	}

	insertTemplate(data: any) {
		let body = data.body;

		if (this.hasSignature()) {
			let signature = this.getPlainTextSignature();

			if (data.isHtml) {
				signature = this.getSignature();
			}

			body = this.appendSignature(body || '', data.isHtml, signature);
		}

		if (this.initialBody && !this.isBodyChanged) {
			let initialBody = this.initialBody;

			if (data.isHtml !== this.initialIsHtml) {
				if (data.isHtml) {
					initialBody = this.plainToHtml(initialBody);
				} else {
					initialBody = this.htmlToPlain(initialBody);
				}
			}

			body += initialBody;
		}

		this.model.set('isHtml', data.isHtml);

		if (data.subject) {
			this.model.set('name', data.subject);
		}

		this.model.set('body', '');
		this.model.set('body', body);

		if (!this.options.removeAttachmentsOnSelectTemplate) {
			this.initialAttachmentsIds.forEach((id) => {
				if (data.attachmentsIds) {
					data.attachmentsIds.push(id);
				}

				if (data.attachmentsNames) {
					data.attachmentsNames[id] = this.initialAttachmentsNames[id] || id;
				}
			});
		}

		this.model.set({
			attachmentsIds: data.attachmentsIds,
			attachmentsNames: data.attachmentsNames
		});

		this.isBodyChanged = false;
	}

	/**
		 * Load available email addresses and their signatures after rendering
		 */
	afterRender() {
		super.afterRender();

		if (this.options.signatureDisabled) {
			return;
		}

		if (!this.hasSignature()) {
			return;
		}

		setTimeout(() => {
			// Get the from field view to determine available email addresses
			const fromField = this.getFieldView('from');
			if (!fromField) {
				return;
			}

			// Get available email addresses from the from field
			this.availableEmailAddresses = fromField.params.options || [];

			// Pre-load signatures for all addresses to have them ready when needed
			this.loadAllSignatures(() => {
				// Always update the signature for the current from address
				const currentFrom = this.model.get('from');
				if (currentFrom) {
					// Force signature replacement on initial load
					this.replaceSignatureForAddress(currentFrom);
				}
			});
		}, 100);
	}

	/**
		 * Loads signatures for all available email addresses
		 * @param {Function} callback - Function to call when finished
		 */
	loadAllSignatures(callback?: () => void) {
		if (!this.availableEmailAddresses.length) {
			callback?.();
			return;
		}

		// Filter addresses that need signature loading
		const addressesToLoad = this.availableEmailAddresses.filter(
			email => !this.addressBlacklist.includes(email) && !this.signatures[email],
		);

		if (!addressesToLoad.length) {
			callback?.();
			return;
		}

		// Build query string for batch request
		const params = addressesToLoad.map(email => `emailAddress=${encodeURIComponent(email)}`).join('&');

		// Fetch signatures for all addresses
		Espo.Ajax.getRequest(`Mail/GetSignature?${params}`)
			.then(response => {
				if (typeof response === 'object' && response !== null) {
					// Process each address
					addressesToLoad.forEach(email => {
						if (email in response && typeof response[email] === 'string') {
							this.signatures[email] = response[email];
						} else {
							this.addToBlacklist(email);
						}
					});
				} else {
					// No valid response, blacklist all addresses
					addressesToLoad.forEach(email => {
						this.addToBlacklist(email);
					});
				}
				callback?.();
			})
			.catch(__ => {
				// On error, blacklist all addresses and use default signatures
				addressesToLoad.forEach(email => {
					this.addToBlacklist(email);
				});
				callback?.();
			});
	}

	/**
		 * Completely override appendSignature to fix issues in parent implementation
		 */
	appendSignature(body, isHtml, signature) {
		// Safety checks for null/undefined values
		let bodyContent = body || '';
		const signatureContent = signature || '';

		if (!signatureContent) {
			return bodyContent;
		}

		// Before adding signature, make sure there's no duplicate
		if (bodyContent.includes(signatureContent)) {
			bodyContent = this.removeExistingSignature(bodyContent, isHtml, signatureContent);
		}

		// Add signature to the end of the body (with proper spacing)
		let newBody = '';

		if (isHtml) {
			// For HTML mode
			const bodyEndsWithBreak = bodyContent.endsWith('<p><br></p>');
			const signatureStartsWithBreak = signatureContent.startsWith('<p><br></p>');

			// Build the new body based on the content structure
			if (bodyContent && !bodyEndsWithBreak && !signatureStartsWithBreak) {
				// Add a break between if neither has one
				newBody = bodyContent + '<p><br></p>' + signatureContent;
			} else {
				// Otherwise don't add extra breaks
				newBody = bodyContent + signatureContent;
			}
		} else {
			// For plain text, add a couple newlines before the signature if there's a body
			if (bodyContent) {
				newBody = bodyContent + '\n\n' + signatureContent;
			} else {
				newBody = signatureContent;
			}
		}

		return newBody;
	}

	setupEasyEmailToggle() {
		// Check if email has MJML data
		if (this.model.get('bodyMjml')) {
			this.showEasyEmailIndicator();
		}
	},

	showEasyEmailIndicator: function () {
	const $bodyField = this.$el.find('.field[data-name="body"]');

	if(!$bodyField.find('.easy-email-indicator').length) {
	$bodyField.before(
		'<div class="easy-email-indicator alert alert-info">' +
		'<i class="fas fa-palette"></i> ' +
		'This email was created with Easy Email Editor. ' +
		'<a href="javascript:" class="action-edit-easy-email">Edit with Easy Email</a>' +
		'</div>'
	);
}

this.$el.off('click', '.action-edit-easy-email');
this.$el.on('click', '.action-edit-easy-email', () => {
	this.actionUseEasyEmailEditor();
});
        }

actionUseEasyEmailEditor() {
	const emailId = this.model.id || null;
	const url = `?entryPoint=EasyEmailEditor&emailId=${emailId || ''}&entityType=Email&mode=compose`;

	// Open Easy Email Editor in modal
	this.createView('easyEmailModal', 'viacrm:views/modals/easy-email-composer', {
		url: url,
		emailId: emailId,
		model: this.model,
		isNew: !emailId
	}, (view) => {
		view.render();

		this.listenToOnce(view, 'save', (data) => {
			this.handleEasyEmailSave(data);
		});
	});
}

handleEasyEmailSave(data) {
	// Update email model with Easy Email data
	if (data.mjml) {
		this.model.set('bodyMjml', data.mjml);
	}
	if (data.html) {
		this.model.set('body', data.html);
		this.model.set('isHtml', true);
	}
	if (data.subject) {
		this.model.set('subject', data.subject);
	}

	// Update body field view
	const bodyView = this.getFieldView('body');
	if (bodyView) {
		bodyView.model.set('body', data.html);
		bodyView.render();
	}

	// Show indicator
	this.showEasyEmailIndicator();

	this.notify('Email content updated', 'success');
}

send() {
	// Ensure MJML data is included when sending
	if (this.model.get('bodyMjml')) {
		this.model.set('usedEasyEmailEditor', true);
	}

	return Dep.prototype.send.call(this);
}

saveDraft() {
	// Ensure MJML data is saved with draft
	if (this.model.get('bodyMjml')) {
		this.model.set('usedEasyEmailEditor', true);
	}

	return Dep.prototype.saveDraft.call(this);
}
});