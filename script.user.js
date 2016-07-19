// ==UserScript==
// @name         Skyscanner B2B Widget Injector
// @namespace    http://tomcorke.com
// @version      0.3.16
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
    let $_tab = null;
    let $_codePanel = null;

    let $injectedWidget = null;

    function removeAllWidgets() {
        $('.skyscanner-widget-container').remove();
        $('[data-skyscanner-widget]').remove();
        if($injectedWidget) {
            $injectedWidget.remove();
            $injectedWidget = null;
        }
    }

    function getWidgetConfig() {
        return {
            selector: $_panel.inputs.selector.val(),
            type: $_panel.inputs.dataWidgetType.val(),
            locale: $_panel.inputs.dataLocale.val(),
            params: $_panel.inputs.dataParams.val(),
            location: {
                name: $_panel.inputs.dataLocationName.val(),
                coords: $_panel.inputs.dataLocationCoords.val(),
                phrase: $_panel.inputs.dataLocationPhrase.val()
            }
        };
    }

    function importConfig(code) {
        getOrCreatePanel();
        try {
            console.log(code);
            const decoded = atob(code);
            const config = JSON.parse(decoded);
            $_panel.inputs.selector.val(config.selector);
            $_panel.inputs.dataWidgetType.val(config.type);
            $_panel.inputs.dataLocale.val(config.locale);
            $_panel.inputs.dataParams.val(config.params);
            $_panel.inputs.dataLocationName.val(config.location.name);
            $_panel.inputs.dataLocationCoords.val(config.location.coords);
            $_panel.inputs.dataLocationPhrase.val(config.location.phrase);
            return true;
        } catch(e) {
            console.error(e);
        }
        return false;
    }

    const urlConfigPattern = /(?:[?&])?skyscannerWidgetInjectorConfig=([^&]+)/;

    function tryImportConfigFromQuery() {
        if (urlConfigPattern.test(document.URL)) {
            const matches = document.URL.match(urlConfigPattern);
            return importConfig(matches[1]);
        }
        return false;
    }

    function exportConfig() {
        let config = getWidgetConfig();
        let code = btoa(JSON.stringify(config));
        window.location.hash = (window.location.hash || '').replace(urlConfigPattern, '') + '&skyscannerWidgetInjectorConfig=' + code
        console.log(window.URL);
    }

    function createWidgetCode(config) {
        let $widget = $('<div>');
        $widget.attr('data-skyscanner-widget', config.type);
        $widget.attr('data-locale', config.locale);
        $widget.attr('data-params', config.params);

        if(config.location.name) {
            $widget.attr('data-location-name', config.location.name);
        }

        if(config.location.coords) {
            $widget.attr('data-location-coords', config.location.coords);
        }

        if(config.location.phrase) {
            $widget.attr('data-location-phrase', config.location.phrase);
        }

        return $widget;
    }

    function injectWidgetAtSelector() {

        if($injectedWidget) {
            $injectedWidget.remove();
        }

        let config = getWidgetConfig();

        let $newWidget = $injectedWidget = createWidgetCode(config);

        let $el = $(config.selector);
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
        labelElement.addClass('swip-label');
        inputElement.addClass('swip-input');
        $row.append(labelElement, inputElement);
        return $row;
    }

    function createCodePanel() {
        let $panel = $('<div>').attr('id', 'skyscanner-widget-injector-code-panel').appendTo('body').hide();
        $panel.on('click', e => { e.preventDefault(); $panel.hide(); });
        let $code = $('<div>').addClass('code').appendTo($panel).on('click', (e) => e.stopPropagation());
        $panel.code = $code;
        return $panel;
    }

    function getOrCreateCodePanel() {
        $_codePanel = $_codePanel || createCodePanel();
        return $_codePanel;
    }

    function showWidgetCode() {

        let config = getWidgetConfig();

        let $widget = createWidgetCode(config);
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

        exportConfig();
    }

    function createPanel() {

        let $panel = $('<div>').attr('id', 'skyscanner-widget-injector-panel');
        let $header = $('<div>').addClass('header').appendTo($panel);
        let $close = $('<div>').addClass('close').appendTo($header).on('click', hidePanel);
        let $content = $('<div>').addClass('content').appendTo($panel);
        let $sandbox = $('<div>').addClass('sandbox').appendTo($panel);

        let $ul = $('<ul>').appendTo($content);
        $ul.append($('<li>').append($('<a>').addClass('swip-button warning').text('Remove all widgets').on('click', removeAllWidgets)));

        $panel.inputs = {};

        $panel.inputs.selector = createSavedInput('selector', '.skyscanner-widget-injector-panel .sandbox');
        $ul.append($('<li>').append(createInputRow($('<span>').text('Selector'), $panel.inputs.selector)));

        $panel.inputs.dataWidgetType = createSavedInput('data-skyscanner-widget', 'LocationWidget');
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

        $ul.append($('<li>').append($('<a>').addClass('swip-button').text('Add widget at selector').on('click', injectWidgetAtSelector)));
        $ul.append($('<li>').append($('<a>').addClass('swip-button').text('Show widget code').on('click', showWidgetCode)));

        $panel.appendTo('body').hide();
        return $panel;
    }

    function getOrCreatePanel() {
        $_panel = $_panel || createPanel();
        return $_panel;
    }

    function hidePanel() {
        $_panel && $_panel.hide();
    }

    function showPanel() {
        hideTab();
        getOrCreatePanel().slideDown();
    }

    function createTab() {

        let $tab = $('<div>').attr('id', 'skyscanner-widget-injector-tab');

        return $tab;

    }

    function getOrCreateTab() {
        $_tab = $_tab || createTab();
        return $_tab;
    }

    function hideTab() {
        $_tab && $_tab.hide();
    }

    function showTab() {
        hidePanel();
        getOrCreatePanel().slideDown();
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

    showTab();

    if (tryImportConfigFromQuery()) {
        showPanel();
    }

})();