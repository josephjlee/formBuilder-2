/**
 * formBuilder.dropDownPanel widget
 *
 * Public Methods:
 * 	getClassNames()
 *	getId()
 *	isOpened()
 *	detach()
 *	attach()
 *	open()
 *
 *
 * Events:
 *	beforeopen
 *	afteropen
 *	beforeclose
 *	afterclose
 */

import $ from 'jquery';

const doc = $(document);
let dropDownPanelCount = 0;

$.widget('formBuilder.dropDownPanel', {

	options: {
		offset: {
			top: 0,
			left: 0
		},

		// What it listens for events on and is positioned under (required)
		target: undefined,

		// Listen for focus/blur to trigger open/close on this element (default = target)
		focusTarget: undefined,

		// Automatically change target to the given target's first .field-item-input child, if it has one
		targetInput: true,

		// Array of name attributes to hide 
		hideFields: undefined	
	},

	_create: function() {
		const self = this,
			o = self.options,
			e = self.element,
			wrapper = $('<div class="fb-dropDownPanel-wrapper" style="position: relative;"></div>'),
			panel = $('<div class="fb-dropDownPanel"></div>').hide().appendTo(wrapper);

		self.wrapper = wrapper;
		self.panel = panel;
		self.isOpen = false;
		self.id = dropDownPanelCount++;

		o.targetInput = !!o.targetInput;

		e.addClass('fb-dropDownPanel-content').appendTo(panel);

		if(o.hideFields && Array.isArray(o.hideFields)) {
			$.each(o.hideFields, function(i, fieldName) {
				panel.find('[name="' + fieldName + '"]').remove();
			});
		}


		self.closeListener = function(ev) {

			// Listen for Escape key
			if(ev.which === 27) {
				ev.preventDefault();
				ev.stopPropagation();
				self.focusTarget.focus();
				setTimeout(function() {
					self.close();
				}, 0);
				return;
			}

			// Listen for a click outside
			if(!$(ev.target).childOf(panel, true) && !$(ev.target).childOf(self.focusTarget, true)) {
				setTimeout(function() {
					self.close();
				}, 0);
			}

		};

		self.openListener = function() {
			setTimeout(function() {
				self.open();
			}, 0);
		};

		
		self.attach(o.target, o.focusTarget);
	},

	getClassNames: function() {
		const self = this;

		return {
			target: 'fb-dropDownPanel-'+self.id+'-target',
			focus: 'fb-dropDownPanel-'+self.id+'-focusTarget'
		};
	},

	getId: function() {
		return this.id;
	},

	isOpened: function() {
		return this.isOpen;
	},

	detach: function() {
		const self = this,
			instanceClasses = self.getClassNames();

		self.close();

		if(self.target) {
			self.target.removeClass(instanceClasses.target);
		}
		if(self.focusTarget) {
			self.focusTarget.removeClass(instanceClasses.focus);
			self.focusTarget.off('click focus', self.openListener);
		}

		self.focusTarget = undefined;
		self.target = undefined;
		self.wrapper.detach();
	},

	attach: function(newTarget, newFocusTarget) {
		const self = this,
			o = self.options,
			instanceClasses = self.getClassNames();

		if(!newTarget || !(newTarget instanceof $) || newTarget.length === 0) {
			throw '[dropDownPanel] No target element specifed.';
		}

		if(self.target) {
			self.detach();
		}


		// Determine correct targets

		if(newTarget.is(':formBuilder-inputField')) {
			if(!newFocusTarget) {
				newFocusTarget = newTarget;
			}
			newTarget = newTarget.closest('.input-field');

		} else if(newTarget.is('.input-field') && !newFocusTarget) {
			newFocusTarget = newTarget.find(':focusable:tabbable'); //NOTE: This may be mutiple elements, but that's okay
			
		} else {
			self.wrapper.insertAfter(newTarget);
		}

		if(newTarget.is('.input-field')) {
			self.wrapper.appendTo(newTarget.closest('.input-field-group'));

			if(o.targetInput) {
				const inputItem = newTarget.find('.field-item-input');
				if(inputItem.length > 0) {
					newTarget = $(inputItem[0]);
				}
			}
		}

		if(!newFocusTarget) {
			newFocusTarget = newTarget;
		}

		// Update targets
		if(self.target) {
			self.target.removeClass(instanceClasses.target);
		}
		if(self.focusTarget) {
			self.focusTarget.removeClass(instanceClasses.focus);
			self.focusTarget.off('click focus', self.openListener);
		}
		
		self.target = newTarget;
		self.focusTarget = newFocusTarget;

		self.target.addClass(instanceClasses.target);
		self.focusTarget.addClass(instanceClasses.focus);

		self.focusTarget.on('click focus', self.openListener);
	},

	open: function() {
		const self = this,
			o = self.options,
			panel = self.panel;
		
		if(self.isOpen || !self.target){
			return;
		}

		self.isOpen = true;

		const wrapperOffset = self.wrapper.offset();
		const targetOffset = self.target.offset();

		const css = {
			left: (targetOffset.left - wrapperOffset.left) + o.offset.left + 'px',
			top: (targetOffset.top + self.target.outerHeight() - wrapperOffset.top) + o.offset.top + 'px',
			width: self.target.outerWidth() - (self.panel.outerWidth() - self.panel.width()) + 'px'
		};

		panel.css(css);
		panel.children().css({
			maxWidth: css.width,
			overflow: 'hidden'
		});


		if(!self._trigger('beforeopen', null, [panel, css])){
			return;
		}

		panel.show();

		doc.on('click keyup', self.closeListener);

		self._trigger('afteropen');

	},

	close: function() {
		const self = this,
			panel = self.panel;

		if(!self.isOpen){
			return;
		}

		if(!self._trigger('beforeclose')){
			return;
		}

		self.isOpen = false;

		panel.hide();

		doc.off('click keyup', self.closeListener);

		self._trigger('afterclose');
	},

	_destroy: function() {
		const self = this;
		doc.off('click keyup', self.closeListener);
		self.wrapper.remove();
	}
});
