(function (window, document) {
    'use strict';

    let timer = null;
    const maxDiff = { x: 10, y: 10 };
    let startPos = { x: 0, y: 0 };

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    const hasPointerEvents = 'PointerEvent' in window || (window.navigator && 'msPointerEnabled' in window.navigator);

    const eventMap = hasPointerEvents
        ? { down: 'pointerdown', up: 'pointerup', move: 'pointermove', leave: 'pointerleave' }
        : isTouch
            ? { down: 'touchstart', up: 'touchend', move: 'touchmove', leave: 'touchleave' }
            : { down: 'mousedown', up: 'mouseup', move: 'mousemove', leave: 'mouseleave' };

    // Polyfill for CustomEvent
    if (typeof window.CustomEvent !== 'function') {
        window.CustomEvent = function (event, params = { bubbles: false, cancelable: false, detail: undefined }) {
            const evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        };
        window.CustomEvent.prototype = window.Event.prototype;
    }

    // Polyfill for requestAnimationFrame
    const requestAnimFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        ((callback) => window.setTimeout(callback, 1000 / 60));

    function requestTimeout(fn, delay) {
        if (!requestAnimFrame) return window.setTimeout(fn, delay);

        const start = new Date().getTime();
        const handle = {};

        const loop = () => {
            const delta = new Date().getTime() - start;
            if (delta >= delay) {
                fn();
            } else {
                handle.value = requestAnimFrame(loop);
            }
        };
        handle.value = requestAnimFrame(loop);
        return handle;
    }

    function clearRequestTimeout(handle) {
        if (handle) {
            (window.cancelAnimationFrame || window.clearTimeout)(handle.value);
        }
    }

    function fireLongPressEvent(originalEvent) {
        clearTimer();
        const unifiedEvent = unifyEvent(originalEvent);
        const customEvent = new CustomEvent('long-press', {
            bubbles: true,
            cancelable: true,
            detail: getEventDetails(unifiedEvent)
        });

        const allowClickEvent = this.dispatchEvent(customEvent);
        if (!allowClickEvent) {
            document.addEventListener('click', preventDefaultClick, true);
        }
    }

    function unifyEvent(e) {
        return e.changedTouches ? e.changedTouches[0] : e;
    }

    function getEventDetails(e) {
        return {
            clientX: e.clientX,
            clientY: e.clientY,
            offsetX: e.offsetX,
            offsetY: e.offsetY,
            pageX: e.pageX,
            pageY: e.pageY,
            screenX: e.screenX,
            screenY: e.screenY
        };
    }

    function startTimer(e) {
        clearTimer();
        const el = e.target;
        const delay = parseInt(getNearestAttribute(el, 'data-long-press-delay', '1000'), 10);
        timer = requestTimeout(fireLongPressEvent.bind(el, e), delay);
    }

    function clearTimer() {
        clearRequestTimeout(timer);
        timer = null;
    }

    function preventDefaultClick(e) {
        document.removeEventListener('click', preventDefaultClick, true);
        e.preventDefault();
        e.stopImmediatePropagation();
    }

    function handleMouseDown(e) {
        const unifiedEvent = unifyEvent(e);
        startPos = { x: unifiedEvent.clientX, y: unifiedEvent.clientY };
        startTimer(e);
    }

    function handleMouseMove(e) {
        const unifiedEvent = unifyEvent(e);
        if (
            Math.abs(startPos.x - unifiedEvent.clientX) > maxDiff.x ||
            Math.abs(startPos.y - unifiedEvent.clientY) > maxDiff.y
        ) {
            clearTimer();
        }
    }

    function getNearestAttribute(el, attributeName, defaultValue) {
        while (el && el !== document.documentElement) {
            const value = el.getAttribute(attributeName);
            if (value) return value;
            el = el.parentNode;
        }
        return defaultValue;
    }

    // Event listeners
    document.addEventListener(eventMap.down, handleMouseDown, true);
    document.addEventListener(eventMap.move, handleMouseMove, true);
    document.addEventListener(eventMap.up, clearTimer, true);
    document.addEventListener(eventMap.leave, clearTimer, true);
    document.addEventListener('wheel', clearTimer, true);
    document.addEventListener('scroll', clearTimer, true);
    document.addEventListener('contextmenu', clearTimer, true);
}(window, document));