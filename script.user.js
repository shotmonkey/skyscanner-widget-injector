// ==UserScript==
// @name         Skyscanner B2B Widget Injector
// @namespace    http://tomcorke.com
// @version      0.3.9
// @description  Test utility for Skyscanner B2B Widgets
// @author       Tom Corke
// @include      *
// @require      https://code.jquery.com/jquery-3.0.0.min.js
// @require      https://gateway.skyscanner.net/widget-server/js/loader.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/highlight.min.js
// @resource     css https://github.com/shotmonkey/skyscanner-widget-injector/raw/master/style.css
// @resource     highlight_css https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/styles/github.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(GM_getResourceText('css'));
    GM_addStyle(GM_getResourceText('highlight_css'));

    const magicCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13];
    let enteredCode = [];
    const magicString = 'magicwidgets';
    let enteredString = '';

    let $_panel = null;
    let $codePanel = null;
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

    function createCodePanel() {
        let $panel = $('<div>').addClass('skyscanner-widget-injector-code-panel').appendTo('body').hide();
        $panel.on('click', e => { e.preventDefault(); $panel.hide(); });
        let $code = $('<div>').addClass('code').appendTo($panel).on('click', (e) => e.stopPropagation());
        $panel.code = $code;
        return $panel;
    }

    function getOrCreateCodePanel() {
        $codePanel = $codePanel || createCodePanel();
        return $codePanel;
    }

    function showWidgetCode() {

        let $widget = createWidgetCode();
        let $widgetWrapper = $('<div>').append($widget);

        let $script = $('<script>')
            .attr('src', 'https://gateway.skyscanner.net/widget-server/js/loader.js')
            .attr('async', '');
        let $scriptWrapper = $('<div>').append($script);

        $codePanel = getOrCreateCodePanel();
        $codePanel.code.empty();

        let highlightedWidgetCode = hljs.highlight('html', $widgetWrapper.html());
        let highlightedScriptCode = hljs.highlight('html', $scriptWrapper.html());

        $codePanel.code.append($('<div>').html(highlightedWidgetCode.value));
        $codePanel.code.append($('<div>').html(highlightedScriptCode.value));

        $codePanel.show();
    }

    function createPanel() {

        let $panel = $('<div>').addClass('skyscanner-widget-injector-panel');
        let $header = $('<div>').addClass('header').appendTo($panel);
        let $close = $('<div>').addClass('close').appendTo($header).on('click', hidePanel);
        let $content = $('<div>').addClass('content').appendTo($panel);

        let $ul = $('<ul>').appendTo($content);
        $ul.append($('<li>').append($('<a>').addClass('warning').text('Remove all widgets').on('click', removeAllWidgets)));

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

        $ul.append($('<li>').append($('<a>').text('Add widget at selector').on('click', injectWidgetAtSelector)));
        $ul.append($('<li>').append($('<a>').text('Show widget code').on('click', showWidgetCode)));

        $panel.appendTo('body').hide();
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
        $panel.slideDown();
    }

    function resetCode() {
        enteredCode = [];
    }

    function resetString() {
        enteredString = '';
    }

    $(document).on('keydown', e => {

        if (e.keyCode === magicCode[enteredCode.length]) {
            enteredCode.push(e.keyCode);
            if (enteredCode.length === magicCode.length) {
                showPanel();
                resetCode();
            }
        } else {
            resetCode();
        }

        if (e.key === magicString.substr(enteredString.length, 1)) {
            enteredString = enteredString + e.key;
            if (enteredString === magicString) {
                showPanel();
                resetString();
            }
        } else {
            resetString();
        }
    });
})();