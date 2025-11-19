interface DisplayInternalFieldNamesChangedEvent extends CustomEvent {
    detail: {
        newValue: 'hidden' | 'enabled' | 'disabled';
    };
}

// More generic interface for elements we attach state to
interface ToggableElement extends HTMLElement {
    _copyValueHandler?: () => void;
    _showTooltipHandler?: (e: MouseEvent) => void;
    _hideTooltipHandler?: () => void;
    _tooltipElement?: HTMLDivElement | null;
    _valueDisplayElement?: HTMLDivElement | null; // Reference to the 'enabled' state display (the wrapper)
}

// Configuration structure remains the same
interface ToggleConfig {
    selector: string;
    valueSource: {
        type: 'attribute';
        attributeName: string;
        relativeElementSelector?: string;
    };
    insertionPoint?: (anchorElement: HTMLElement, elementToInsert: HTMLElement) => void;
    listenerTargetSelector?: string;
}

// Default insertion function (insert before anchor)
const defaultInsertionPoint = (anchorElement: HTMLElement, elementToInsert: HTMLElement) => {
	anchorElement.parentNode?.insertBefore(elementToInsert, anchorElement);
};

extend(Dep => class FieldNameController extends Dep {

	// --- Configuration ---
	private toggleConfigs: ToggleConfig[] = [
		{
			selector: 'label.control-label',
			valueSource: {
				type: 'attribute',
				attributeName: 'data-name',
			},
		},
		{ //panels
			selector: 'div.panel:has(div.panel-heading)',
			valueSource: {
				type: 'attribute',
				attributeName: 'data-name'
			},
			insertionPoint: (anchorElement, elementToInsert) => {
				if (!anchorElement.firstElementChild) {
					return;
				}
				const child = anchorElement.firstElementChild as HTMLElement;
				elementToInsert.style.marginLeft = 'auto';
				child.append(elementToInsert);
			},
		},
		{ //columnList header
			selector: 'div.header-cell.control-label',
			valueSource: {
				type: 'attribute',
				attributeName: 'data-name',
			},
		},
		{ //recordList header
			selector: 'th.field-header-cell',
			valueSource: {
				type: 'attribute',
				attributeName: 'data-name',
			},
			insertionPoint: (anchorElement, elementToInsert) => {
				if (!anchorElement.firstElementChild) {
					anchorElement.append(elementToInsert);
					return;
				}
				const child = anchorElement.firstElementChild as HTMLElement;
				/*child.style.display = 'flex';
                    child.style.flexFlow = 'row';
                    child.style.gap = '1.6rem';*/
				child.append(elementToInsert);
			},
		},
		{ //menuItem type buttons
			selector: 'a.btn[role="button"]',
			valueSource: {
				type: 'attribute',
				attributeName: 'data-name',
			},
			insertionPoint: (anchorElement, elementToInsert) => {
				const iconEl = anchorElement.querySelector('span');
				const textEl = iconEl?.nextElementSibling ?? iconEl;
				if (!textEl) {
					return;
				}
				/*if (elementToInsert.textContent) {
                        const dataHandler = anchorElement.getAttribute('data-handler');
                        if (dataHandler) {
                            const handlerEl = document.createElement('div');
                            handlerEl.textContent = dataHandler;
                            elementToInsert.append(handlerEl);
                        }

                    }*/
				textEl.append(elementToInsert);
			},
		},
	];

	// --- Lifecycle & Setup ---
	setup(): void {
		super.setup();
		window.addEventListener<any>('displayInternalFieldNamesChanged', (event: DisplayInternalFieldNamesChangedEvent) => {
			this.toggleFieldNamesUI(event.detail.newValue);
		});
		window["fieldNameController"] = this;
	}

	afterRender(): void {
		super.afterRender();
		this.toggleFieldNamesUI();
	}

	// --- Public API ---
	setFieldNameStatus(status: 'hidden' | 'enabled' | 'disabled'): void {
		const allowed: string[] = ['hidden', 'enabled', 'disabled'];
		if (!allowed.includes(status)) {
			console.info(`Status '${status}' is not supported. Choose one from:`, allowed);
			return;
		}
		this.getStorage()?.set('state', 'displayInternalFieldNames', status);
		window.dispatchEvent(new CustomEvent('displayInternalFieldNamesChanged', {
			detail: {newValue: status}
		}));
	}

	// --- Core Logic ---
	toggleFieldNamesUI(
		showFieldNameStatus: string = (this.getStorage()?.get('state', 'displayInternalFieldNames') ?? 'disabled')
	): void {
		this.toggleConfigs.forEach(config => {
			const elements = document.querySelectorAll<HTMLElement>(config.selector);
			elements.forEach(element => {
				// Use try-catch for robustness during processing individual elements
				try {
					this.processElement(element, config, showFieldNameStatus);
				} catch (error) {
					console.error("Error processing element for field name toggle:", element, error);
				}
			});
		});
	}

	private processElement(element: HTMLElement, config: ToggleConfig, status: string): void {
		// 1. Extract value (logic remains the same, uses config.valueSource)
		let valueElement: Element | null = element;
		if (config.valueSource.relativeElementSelector) {
			valueElement = element.querySelector(config.valueSource.relativeElementSelector);
			if (!valueElement) return; // Cannot proceed without value element
		}
		let value: string | null = null;
		if (config.valueSource.type === 'attribute') {
			value = valueElement.getAttribute(config.valueSource.attributeName);
		}
		if (value === null || value === '') return; // No value

		// 2. Determine Listener Target (Refined Logic)
		let listenerTarget: ToggableElement | null = null;
		if (config.listenerTargetSelector) {
			const potentialTargets = element.querySelectorAll<HTMLElement>(config.listenerTargetSelector);

			// Try to find the *visible* interactive element
			for (let i = 0; i < potentialTargets.length; i++) {
				const target = potentialTargets[i];
				if (target === undefined || target === null) {
					console.error("Target is undefined. index:" + i + ",config:" + config);
				}
				// Check if it's selectize-input OR if it's the select and it's visible
				// (offsetParent is null for hidden elements)
				if (target?.offsetParent !== null) {
					listenerTarget = target as ToggableElement;
					// Prefer selectize-input if both are somehow found and visible
					if (target?.matches('.selectize-input')) {
						break;
					}
				}
			}
		}

		// Fallback to the main element (div.field) if no specific, visible target found
		if (!listenerTarget) {
			// console.warn("Visible listener target not found for", element, "using config selector", config.listenerTargetSelector, ". Falling back to main element.");
			listenerTarget = element as ToggableElement;
		}

		// 3. Cleanup previous state for the determined listenerTarget
		this.cleanupElementState(listenerTarget);

		// 4. Apply the new state based on the status
		switch (status) {
			case 'enabled':
				// Apply state TO the listenerTarget, but use original element (div.field) for insertion context
				this.applyEnabledState(listenerTarget, value, config, element);
				break;
			case 'hidden':
				this.applyHiddenState(listenerTarget, value);
				break;
			case 'disabled':
				// Cleanup already done
				break;
		}
	}

	// --- State Application Helpers ---

	private cleanupElementState(element: ToggableElement): void {
		// Remove event listeners
		if (element._copyValueHandler) {
			element.removeEventListener('click', element._copyValueHandler);
			delete element._copyValueHandler;
		}
		if (element._showTooltipHandler) {
			element.removeEventListener('mouseenter', element._showTooltipHandler);
			delete element._showTooltipHandler;
		}
		if (element._hideTooltipHandler) {
			element.removeEventListener('mouseleave', element._hideTooltipHandler);
			delete element._hideTooltipHandler;
		}

		// Remove tooltip element if it exists
		if (element._tooltipElement) {
			element._tooltipElement.remove();
			element._tooltipElement = null;
		}

		// Remove the inserted value display element (wrapper) if it exists
		if (element._valueDisplayElement) {
			element._valueDisplayElement.remove(); // This should remove the element with 'data-name-wrapper'
			element._valueDisplayElement = null;
		}
		// Using a data attribute as a marker is still useful
		delete element.dataset.fieldNameUiApplied;
	}

	private applyEnabledState(
		listenerTarget: ToggableElement,
		value: string,
		config: ToggleConfig,
		anchorElement: HTMLElement
	): void {
		if (listenerTarget.dataset.fieldNameUiApplied === 'enabled') return;

		// Create and insert the value display using YOUR CSS classes
		const {wrapper,} = this.createValueDisplay(value); // container has 'data-name-display'
		const insert = config.insertionPoint ?? defaultInsertionPoint;
		insert(anchorElement, wrapper); // wrapper has 'data-name-wrapper'

		// Store reference to the WRAPPER for cleanup
		listenerTarget._valueDisplayElement = wrapper;
		listenerTarget.dataset.fieldNameUiApplied = 'enabled';
	}

	private applyHiddenState(listenerTarget: ToggableElement, value: string): void {
		if (listenerTarget.dataset.fieldNameUiApplied === 'hidden') return;

		// Add click event to copy value
		listenerTarget._copyValueHandler = () => {
			// Prevent click from bubbling up if needed, e.g., if listenerTarget is inside another clickable element
			// e.stopPropagation();
			this.copyValue(value, listenerTarget);
		};
		listenerTarget.addEventListener('click', listenerTarget._copyValueHandler);

		// Add tooltip on hover
		listenerTarget._showTooltipHandler = (e: MouseEvent) => {
			this.showValueTooltip(value, listenerTarget, e); // Pass event for positioning
		};
		listenerTarget._hideTooltipHandler = () => {
			this.hideValueTooltip(listenerTarget);
		};

		listenerTarget.addEventListener('mouseenter', listenerTarget._showTooltipHandler);
		listenerTarget.addEventListener('mouseleave', listenerTarget._hideTooltipHandler);

		listenerTarget.dataset.fieldNameUiApplied = 'hidden';
	}

	// --- UI Creation & Interaction Helpers ---

	private createValueDisplay(value: string): { wrapper: HTMLDivElement; container: HTMLDivElement } {
		const valueContainer = document.createElement('div');
		valueContainer.textContent = value;
		// *** Use your specific CSS class ***
		valueContainer.classList.add('data-name-display');
		valueContainer.setAttribute('data-tooltip', 'Click to copy'); // For the CSS tooltip

		const flexWrapper = document.createElement('div');
		// *** Use your specific CSS class ***
		flexWrapper.classList.add('data-name-wrapper');
		flexWrapper.appendChild(valueContainer);

		// Add click-to-copy directly to the displayed element
		valueContainer.addEventListener('click', (e) => {
			e.stopPropagation(); // Prevent triggering parent listeners
			this.copyValue(value, valueContainer); // Provide feedback on the container itself
		});

		return {wrapper: flexWrapper, container: valueContainer};
	}

	// Updated to use position: absolute and account for scroll
	private showValueTooltip(value: string, element: ToggableElement, __event: MouseEvent): void {
		if (element._tooltipElement) return; // Prevent duplicates

		const tooltip = document.createElement('div');
		// *** Use your specific CSS class ***
		tooltip.classList.add('data-name-tooltip');
		tooltip.textContent = value;

		// Append to body for positioning freedom
		document.body.appendChild(tooltip);

		// Apply fade-in animation class AFTER appending and forcing reflow
		void tooltip.offsetWidth; // Force reflow
		tooltip.classList.add('fade-in'); // Your CSS handles this animation

		// Calculate position based on the element's viewport coordinates
		const rect = element.getBoundingClientRect();

		// Since CSS uses position: absolute, calculate top/left relative to document
		// Add scroll offsets to viewport coordinates
		const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
		const scrollY = window.pageYOffset || document.documentElement.scrollTop;

		const tooltipRect = tooltip.getBoundingClientRect(); // Measure after append/reflow

		// Position tooltip centered above the element, adjusting for scroll
		// Adjusting calculation slightly based on your CSS (arrow points down from tooltip)
		let left = scrollX + rect.left + (rect.width / 2) - (tooltipRect.width / 2);
		let top = scrollY + rect.top - tooltipRect.height - 8; // 8px gap above element

		// Basic boundary checks (optional, but good practice)
		if (left < scrollX + 5) left = scrollX + 5; // Prevent going off left edge
		if (top < scrollY + 5) { // If not enough space above, show below
			top = scrollY + rect.bottom + 8; // 8px gap below element
			// You might need CSS to flip the arrow direction if shown below
		}
		if (left + tooltipRect.width > scrollX + window.innerWidth - 5) {
			left = scrollX + window.innerWidth - tooltipRect.width - 5; // Prevent going off right edge
		}


		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;

		element._tooltipElement = tooltip;
	}


	private hideValueTooltip(element: ToggableElement): void {
		if (element._tooltipElement) {
			element._tooltipElement.remove();
			element._tooltipElement = null;
		}
	}

	private copyValue(value: string, feedbackElement: HTMLElement): void {
		navigator.clipboard
			.writeText(value)
			.then(() => {
				if (feedbackElement.classList.contains('data-name-display')) {
					const originalTooltip = feedbackElement.getAttribute('data-tooltip');
					feedbackElement.setAttribute('data-tooltip', 'Copied!');
					feedbackElement.classList.add('copied-feedback');
					setTimeout(() => {
						feedbackElement.setAttribute('data-tooltip', originalTooltip ?? 'Click to copy');
						feedbackElement.classList.remove('copied-feedback');
					}, 2000);
				} else {
					feedbackElement.classList.add('copied-feedback-alt');

					setTimeout(() => {
						feedbackElement.classList.remove('copied-feedback-alt');
					}, 1500);
				}
			})
			.catch(err => {
				console.error('Failed to copy text: ', err);
				if (feedbackElement.classList.contains('data-name-display')) {
					const originalTooltip = feedbackElement.getAttribute('data-tooltip');
					feedbackElement.setAttribute('data-tooltip', 'Copy Failed!');
					setTimeout(() => {
						feedbackElement.setAttribute('data-tooltip', originalTooltip ?? 'Click to copy');
					}, 2000);
				} else {
					feedbackElement.classList.add('copy-failed-feedback');

					setTimeout(() => {
						feedbackElement.classList.remove('copy-failed-feedback');
					}, 2000);
				}
			});
	}
});