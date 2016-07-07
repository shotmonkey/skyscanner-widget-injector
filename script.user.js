// ==UserScript==
// @name         B2B Widget Injector
// @namespace    http://tomcorke.com
// @version      0.2.1
// @description  Injects widgets
// @author       Tom Corke
// @include      *
// @require      https://code.jquery.com/jquery-3.0.0.min.js
// @require      https://gateway.skyscanner.net/widget-server/js/loader.js
// @resource     css https://github.com/shotmonkey/skyscanner-widget-injector/raw/master/style.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(GM_getResourceText('css'));

    const magicCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13];
    let enteredCode = [];

    function resetCode() {
        enteredCode = [];
    }

    let $_panel = null;
    let $injectedWidget = null;

    function removeAllWidgets() {
        $('.skyscanner-widget-container').remove();
        $('[data-skyscanner-widget]').remove();
        if($injectedWidget) {
            $injectedWidget.remove();
            $injectedWidget = null;
        }
    }

    function createWidgetCode() {
        let $widget = $('<div>');
        $widget.attr('data-skyscanner-widget', $_panel.inputs.dataWidgetType.val());
        $widget.attr('data-locale', $_panel.inputs.dataLocale.val());
        $widget.attr('data-params', $_panel.inputs.dataParams.val());

        let locationNameScript = $_panel.inputs.dataLocationName.val();
        if(locationNameScript.length>0) {
            $widget.attr('data-location-name', locationNameScript);
        }

        let locationCoordsScript = $_panel.inputs.dataLocationCoords.val();
        if(locationCoordsScript.length>0) {
            $widget.attr('data-location-coords', locationCoordsScript);
        }

        let locationPhraseScript = $_panel.inputs.dataLocationPhrase.val();
        if(locationPhraseScript.length>0) {
            $widget.attr('data-location-phrase', locationPhraseScript);
        }

        return $widget;
    }

    function injectWidgetAtSelector() {

        if($injectedWidget) {
            $injectedWidget.remove();
        }

        let $newWidget = $injectedWidget = createWidgetCode();

        let selector = $_panel.inputs.selector.val();
        let $el = $(selector);
        $el.append($newWidget);

        if (skyscanner) {
            skyscanner.widgets.load();
        }
    }

    function createSavedInput(name, defaultValue) {
        let $input = $('<input>');
        const namePrefix = 'skyscanner-widget-injector-';
        const fullName = namePrefix + name;
        let savedValue = localStorage.getItem(fullName);
        if (savedValue) {
            $input.val(savedValue);
        } else {
            $input.val(defaultValue || '');
        }
        $input.on('change', () => {
            localStorage.setItem(fullName, $input.val());
        });
        return $input;
    }

    function createInputRow(labelElement, inputElement) {
        let $row = $('<div>').addClass('input-row');
        labelElement.addClass('label');
        inputElement.addClass('input');
        $row.append(labelElement, inputElement);
        return $row;
    }

    function createPanel() {

        let $panel = $('<div>').addClass('skyscanner-widget-injector-panel');
        $panel.append($('<div>').addClass('close').on('click', hidePanel));

        let $ul = $('<ul>').appendTo($panel);
        $ul.append($('<li>').append($('<a>').text('Remove all widgets').on('click', removeAllWidgets)));

        $panel.inputs = {};

        $panel.inputs.selector = createSavedInput('selector');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Selector'), $panel.inputs.selector)));

        $panel.inputs.dataWidgetType = createSavedInput('data-skyscanner-widget', 'BasicWidget');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Widget Type'), $panel.inputs.dataWidgetType)));

        $panel.inputs.dataLocale = createSavedInput('data-locale', 'en-GB');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Locale'), $panel.inputs.dataLocale)));

        $panel.inputs.dataParams = createSavedInput('data-params', 'colour:glen');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Params'), $panel.inputs.dataParams)));

        $panel.inputs.dataLocationName = createSavedInput('data-location-name', '');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Location Name Script'), $panel.inputs.dataLocationName)));

        $panel.inputs.dataLocationCoords = createSavedInput('data-location-coords', '');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Location Coords Script'), $panel.inputs.dataLocationCoords)));

        $panel.inputs.dataLocationPhrase = createSavedInput('data-location-phrase', '');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Location Phrase Script'), $panel.inputs.dataLocationPhrase)));

        $ul.append($('<li>').append($('<a>').text('Inject at selector').on('click', injectWidgetAtSelector)));

        $panel.appendTo('body');
        return $panel;
    }

    function getOrCreatePanel() {
        $_panel = $_panel || createPanel();
        return $_panel;
    }

    function hidePanel() {
        $_panel.slideUp();
    }

    function showPanel() {
        let $panel = getOrCreatePanel();
        $panel.hide().slideDown();
    }

    $(document).on('keydown', e => {
        if (e.keyCode === magicCode[enteredCode.length]) {
            e.preventDefault();
            enteredCode.push(e.keyCode);
            console.log(enteredCode.length + '/' + magicCode.length);
            if (enteredCode.length === magicCode.length) {
                showPanel();
                resetCode();
            }
        } else {
            resetCode();
        }
    });

    // Your code here...
})();