define('viacrm:field-name-controller', ['view'], function (View) {

    var currentStatus = 'disabled';

    try {
        var stored = window.localStorage.getItem('displayInternalFieldNames');
        if (stored) {
            currentStatus = stored;
        }
    } catch (e) {
        // ignore
    }

    /**
     * @typedef {HTMLElement & {
     *   _copyValueHandler?: () => void;
     *   _showTooltipHandler?: (e: MouseEvent) => void;
     *   _hideTooltipHandler?: () => void;
     *   _tooltipElement?: HTMLDivElement | null;
     *   _valueDisplayElement?: HTMLDivElement | null;
     * }} ToggableElement
     */

    var toggleConfigs = [
        {
            selector: 'label.control-label',
            valueSource: {
                type: 'attribute',
                attributeName: 'data-name'
            }
        },
        {
            selector: 'div.panel:has(div.panel-heading)',
            valueSource: {
                type: 'attribute',
                attributeName: 'data-name'
            },
            insertionPoint: function (anchorElement, elementToInsert) {
                if (!anchorElement.firstElementChild) {
                    return;
                }
                var child = anchorElement.firstElementChild;
                elementToInsert.style.marginLeft = 'auto';
                child.append(elementToInsert);
            }
        },
        {
            selector: 'div.header-cell.control-label',
            valueSource: {
                type: 'attribute',
                attributeName: 'data-name'
            }
        },
        {
            selector: 'th.field-header-cell',
            valueSource: {
                type: 'attribute',
                attributeName: 'data-name'
            },
            insertionPoint: function (anchorElement, elementToInsert) {
                if (!anchorElement.firstElementChild) {
                    anchorElement.append(elementToInsert);
                    return;
                }
                var child = anchorElement.firstElementChild;
                child.append(elementToInsert);
            }
        },
        {
            selector: 'a.btn[role=\"button\"]',
            valueSource: {
                type: 'attribute',
                attributeName: 'data-name'
            },
            insertionPoint: function (anchorElement, elementToInsert) {
                var iconEl = anchorElement.querySelector('span');
                var textEl = iconEl && iconEl.nextElementSibling ? iconEl.nextElementSibling : iconEl;
                if (!textEl) {
                    return;
                }
                textEl.append(elementToInsert);
            }
        }
    ];

    function cleanupElementState(element) {
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
        if (element._tooltipElement) {
            element._tooltipElement.remove();
            element._tooltipElement = null;
        }
        if (element._valueDisplayElement) {
            element._valueDisplayElement.remove();
            element._valueDisplayElement = null;
        }
        if (element.dataset) {
            delete element.dataset.fieldNameUiApplied;
        }
    }

    function createValueDisplay(value, copyCallback) {
        var valueContainer = document.createElement('div');
        valueContainer.textContent = value;
        valueContainer.classList.add('data-name-display');
        valueContainer.setAttribute('data-tooltip', 'Click to copy');

        var flexWrapper = document.createElement('div');
        flexWrapper.classList.add('data-name-wrapper');
        flexWrapper.appendChild(valueContainer);

        valueContainer.addEventListener('click', function (e) {
            e.stopPropagation();
            copyCallback(value, valueContainer);
        });

        return { wrapper: flexWrapper, container: valueContainer };
    }

    function showValueTooltip(value, element) {
        if (element._tooltipElement) {
            return;
        }

        var tooltip = document.createElement('div');
        tooltip.classList.add('data-name-tooltip');
        tooltip.textContent = value;
        document.body.appendChild(tooltip);

        void tooltip.offsetWidth;
        tooltip.classList.add('fade-in');

        var rect = element.getBoundingClientRect();
        var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        var tooltipRect = tooltip.getBoundingClientRect();

        var left = scrollX + rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        var top = scrollY + rect.top - tooltipRect.height - 8;

        if (left < scrollX + 5) {
            left = scrollX + 5;
        }
        if (top < scrollY + 5) {
            top = scrollY + rect.bottom + 8;
        }
        if (left + tooltipRect.width > scrollX + window.innerWidth - 5) {
            left = scrollX + window.innerWidth - tooltipRect.width - 5;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';

        element._tooltipElement = tooltip;
    }

    function hideValueTooltip(element) {
        if (element._tooltipElement) {
            element._tooltipElement.remove();
            element._tooltipElement = null;
        }
    }

    function copyValue(value, feedbackElement) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            return;
        }

        navigator.clipboard
            .writeText(value)
            .then(function () {
                if (feedbackElement.classList.contains('data-name-display')) {
                    var originalTooltip = feedbackElement.getAttribute('data-tooltip');
                    feedbackElement.setAttribute('data-tooltip', 'Copied!');
                    feedbackElement.classList.add('copied-feedback');
                    setTimeout(function () {
                        feedbackElement.setAttribute('data-tooltip', originalTooltip || 'Click to copy');
                        feedbackElement.classList.remove('copied-feedback');
                    }, 2000);
                }
            })
            .catch(function (err) {
                // eslint-disable-next-line no-console
                console.error('Failed to copy text: ', err);
            });
    }

    function applyEnabledState(listenerTarget, value, config, anchorElement) {
        if (listenerTarget.dataset && listenerTarget.dataset.fieldNameUiApplied === 'enabled') {
            return;
        }

        var display = createValueDisplay(value, copyValue);
        var insert = config.insertionPoint || function (anchorElementInner, elementToInsert) {
            if (anchorElementInner.parentNode) {
                anchorElementInner.parentNode.insertBefore(elementToInsert, anchorElementInner);
            }
        };

        insert(anchorElement, display.wrapper);

        listenerTarget._valueDisplayElement = display.wrapper;
        if (listenerTarget.dataset) {
            listenerTarget.dataset.fieldNameUiApplied = 'enabled';
        }
    }

    function applyHiddenState(listenerTarget, value) {
        if (listenerTarget.dataset && listenerTarget.dataset.fieldNameUiApplied === 'hidden') {
            return;
        }

        listenerTarget._copyValueHandler = function () {
            copyValue(value, listenerTarget);
        };
        listenerTarget.addEventListener('click', listenerTarget._copyValueHandler);

        listenerTarget._showTooltipHandler = function () {
            showValueTooltip(value, listenerTarget);
        };
        listenerTarget._hideTooltipHandler = function () {
            hideValueTooltip(listenerTarget);
        };

        listenerTarget.addEventListener('mouseenter', listenerTarget._showTooltipHandler);
        listenerTarget.addEventListener('mouseleave', listenerTarget._hideTooltipHandler);

        if (listenerTarget.dataset) {
            listenerTarget.dataset.fieldNameUiApplied = 'hidden';
        }
    }

    function processElement(element, config, status) {
        var valueElement = element;
        if (config.valueSource.relativeElementSelector) {
            valueElement = element.querySelector(config.valueSource.relativeElementSelector);
            if (!valueElement) {
                return;
            }
        }

        var value = null;
        if (config.valueSource.type === 'attribute') {
            value = valueElement.getAttribute(config.valueSource.attributeName);
        }
        if (value === null || value === '') {
            return;
        }

        /** @type {ToggableElement|null} */
        var listenerTarget = element;

        cleanupElementState(listenerTarget);

        if (status === 'enabled') {
            applyEnabledState(listenerTarget, value, config, element);
        } else if (status === 'hidden') {
            applyHiddenState(listenerTarget, value);
        }
    }

    function toggleFieldNamesUI(status) {
        var finalStatus = status || currentStatus || 'disabled';

        toggleConfigs.forEach(function (config) {
            var elements = document.querySelectorAll(config.selector);
            elements.forEach(function (element) {
                try {
                    processElement(/** @type {ToggableElement} */(element), config, finalStatus);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('Error processing element for field name toggle:', element, e);
                }
            });
        });
    }

    window.addEventListener('displayInternalFieldNamesChanged', function (event) {
        var detail = event && event.detail;
        var newValue = detail && detail.newValue ? detail.newValue : 'disabled';

        currentStatus = newValue;
        try {
            window.localStorage.setItem('displayInternalFieldNames', newValue);
        } catch (e) {
            // ignore
        }

        toggleFieldNamesUI(newValue);
    });

    var originalSetup = View.prototype.setup;
    View.prototype.setup = function () {
        if (typeof originalSetup === 'function') {
            originalSetup.call(this);
        }
    };

    var originalAfterRender = View.prototype.afterRender;
    View.prototype.afterRender = function () {
        if (typeof originalAfterRender === 'function') {
            originalAfterRender.call(this);
        }

        toggleFieldNamesUI();
    };

    return View;
});

