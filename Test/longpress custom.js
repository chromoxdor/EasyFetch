(function (window, document) {
    'use strict';

    let timer = null;
    const maxDiff = { x: 10, y: 10 };
    let startPos = { x: 0, y: 0 };
    let longPressDelay = 1000; // Default delay

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    const hasPointerEvents = 'PointerEvent' in window || (window.navigator && 'msPointerEnabled' in window.navigator);

    const eventMap = hasPointerEvents
        ? { down: 'pointerdown', up: 'pointerup', move: 'pointermove', leave: 'pointerleave' }
        : isTouch
            ? { down: 'touchstart', up: 'touchend', move: 'touchmove', leave: 'touchleave' }
            : { down: 'mousedown', up: 'mouseup', move: 'mousemove', leave: 'mouseleave' };

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

    function startTimer(e, delay = longPressDelay) {
        clearTimer();
        const el = e.target;
        timer = setTimeout(() => fireLongPressEvent.call(el, e), delay);
    }

    function clearTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
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

    // Event listeners
    document.addEventListener(eventMap.down, handleMouseDown, true);
    document.addEventListener(eventMap.move, handleMouseMove, true);
    document.addEventListener(eventMap.up, clearTimer, true);
    document.addEventListener(eventMap.leave, clearTimer, true);
    document.addEventListener("wheel", clearTimer, true);
    document.addEventListener("scroll", clearTimer, true);
    
    // Only add 'contextmenu' event if NOT on Android
    if (!navigator.userAgent.toLowerCase().includes("android")) {
        document.addEventListener("contextmenu", clearTimer, true);
    }

    // Allow setting delay dynamically
    window.setLongPressDelay = function (delay) {
        longPressDelay = delay;
    };
    
}(window, document));