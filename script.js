// ==UserScript==
// @name         B2B Widget Injector
// @namespace    http://tomcorke.com
// @version      0.2
// @description  Injects widgets
// @author       Tom Corke
// @match        *
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const magicCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13];
    let enteredCode = [];

    function resetCode() {
        enteredCode = [];
    }

    let $_panel = null;

    function createPanel() {
        let $panel = $('<div>').addClass('widget-injector-panel');
        $panel.append($('<div>').addClass('close').text('X').on('click', hidePanel));
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