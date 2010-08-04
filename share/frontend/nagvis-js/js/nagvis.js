/*****************************************************************************
 *
 * nagvis.js - Some NagVis function which are used in NagVis frontend
 *
 * Copyright (c) 2004-2010 NagVis Project (Contact: info@nagvis.org)
 *
 * License:
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 *****************************************************************************/
 
/**
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */

/* Comments for jslint */
/*global document, location, navigator, window, setTimeout, ActiveXObject */
/*global XMLHttpRequest, alert */

/*jslint evil: true, */

/* Initiate global vars which are set later in the parsed HTML */
var oWorkerProperties, oGeneralProperties, oRotationProperties, oPageProperties;
var oViewProperties;
var oFileAges;
var oStatusMessageTimer;
var aMapObjects = [];
var oMapSummaryObj;

// Initialize and define some other basic vars
var iNow = Date.parse(new Date());

// Define some state options
var oStates = {};

function date ( format, timestamp ) {
    // Format a local date/time  
    // 
    // version: 909.322
    // discuss at: http://phpjs.org/functions/date
    // +   original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
    // +      parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: MeEtc (http://yass.meetcweb.com)
    // +   improved by: Brad Touesnard
    // +   improved by: Tim Wiel
    // +   improved by: Bryan Elliott
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: David Randall
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +  derived from: gettimeofday
    // +      input by: majak
    // +   bugfixed by: majak
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // %        note 1: Uses global: php_js to store the default timezone
    // *     example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
    // *     returns 1: '09:09:40 m is month'
    // *     example 2: date('F j, Y, g:i a', 1062462400);
    // *     returns 2: 'September 2, 2003, 2:26 am'
    // *     example 3: date('Y W o', 1062462400);
    // *     returns 3: '2003 36 2003'
    // *     example 4: x = date('Y m d', (new Date()).getTime()/1000); // 2009 01 09
    // *     example 4: (x+'').length == 10
    // *     returns 4: true
    // *     example 5: date('W', 1104534000);
    // *     returns 5: '53'
    
    var that = this;
    var jsdate=(
        (typeof(timestamp) == 'undefined') ? new Date() : // Not provided
        (typeof(timestamp) == 'number') ? new Date(timestamp*1000) : // UNIX timestamp
        new Date(timestamp) // Javascript Date()
    );
    var pad = function (n, c){
        if ( (n = n + "").length < c ) {
            return new Array(++c - n.length).join("0") + n;
        } else {
            return n;
        }
    };
    var _dst = function (t) {
        // Calculate Daylight Saving Time (derived from gettimeofday() code)
        var dst=0;
        var jan1 = new Date(t.getFullYear(), 0, 1, 0, 0, 0, 0);  // jan 1st
        var june1 = new Date(t.getFullYear(), 6, 1, 0, 0, 0, 0); // june 1st
        var temp = jan1.toUTCString();
        var jan2 = new Date(temp.slice(0, temp.lastIndexOf(' ')-1));
        temp = june1.toUTCString();
        var june2 = new Date(temp.slice(0, temp.lastIndexOf(' ')-1));
        var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60);
        var daylight_time_offset = (june1 - june2) / (1000 * 60 * 60);

        if (std_time_offset === daylight_time_offset) {
            dst = 0; // daylight savings time is NOT observed
        } else {
            // positive is southern, negative is northern hemisphere
            var hemisphere = std_time_offset - daylight_time_offset;
            if (hemisphere >= 0) {
                std_time_offset = daylight_time_offset;
            }
            dst = 1; // daylight savings time is observed
        }
        return dst;
    };
    var ret = '';
    var txt_weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"];
    var txt_ordin = {1: "st", 2: "nd", 3: "rd", 21: "st", 22: "nd", 23: "rd", 31: "st"};
    var txt_months =  ["", "January", "February", "March", "April",
        "May", "June", "July", "August", "September", "October", "November",
        "December"];

    var f = {
        // Day
            d: function (){
                return pad(f.j(), 2);
            },
            D: function (){
                var t = f.l();
                return t.substr(0,3);
            },
            j: function (){
                return jsdate.getDate();
            },
            l: function (){
                return txt_weekdays[f.w()];
            },
            N: function (){
                //return f.w() + 1;
                return f.w() ? f.w() : 7;
            },
            S: function (){
                return txt_ordin[f.j()] ? txt_ordin[f.j()] : 'th';
            },
            w: function (){
                return jsdate.getDay();
            },
            z: function (){
                return (jsdate - new Date(jsdate.getFullYear() + "/1/1")) / 864e5 >> 0;
            },

        // Week
            W: function (){

                var a = f.z(), b = 364 + f.L() - a;
                var nd2, nd = (new Date(jsdate.getFullYear() + "/1/1").getDay() || 7) - 1;

                if (b <= 2 && ((jsdate.getDay() || 7) - 1) <= 2 - b){
                    return 1;
                } 
                if (a <= 2 && nd >= 4 && a >= (6 - nd)){
                    nd2 = new Date(jsdate.getFullYear() - 1 + "/12/31");
                    return that.date("W", Math.round(nd2.getTime()/1000));
                }
                
                var w = (1 + (nd <= 3 ? ((a + nd) / 7) : (a - (7 - nd)) / 7) >> 0);

                return (w ? w : 53);
            },

        // Month
            F: function (){
                return txt_months[f.n()];
            },
            m: function (){
                return pad(f.n(), 2);
            },
            M: function (){
                var t = f.F();
                return t.substr(0,3);
            },
            n: function (){
                return jsdate.getMonth() + 1;
            },
            t: function (){
                var n;
                if ( (n = jsdate.getMonth() + 1) == 2 ){
                    return 28 + f.L();
                }
                if ( n & 1 && n < 8 || !(n & 1) && n > 7 ){
                    return 31;
                }
                return 30;
            },

        // Year
            L: function (){
                var y = f.Y();
                return (!(y & 3) && (y % 1e2 || !(y % 4e2))) ? 1 : 0;
            },
            o: function (){
                if (f.n() === 12 && f.W() === 1) {
                    return jsdate.getFullYear()+1;
                }
                if (f.n() === 1 && f.W() >= 52) {
                    return jsdate.getFullYear()-1;
                }
                return jsdate.getFullYear();
            },
            Y: function (){
                return jsdate.getFullYear();
            },
            y: function (){
                return (jsdate.getFullYear() + "").slice(2);
            },

        // Time
            a: function (){
                return jsdate.getHours() > 11 ? "pm" : "am";
            },
            A: function (){
                return f.a().toUpperCase();
            },
            B: function (){
                // peter paul koch:
                var off = (jsdate.getTimezoneOffset() + 60)*60;
                var theSeconds = (jsdate.getHours() * 3600) +
                                 (jsdate.getMinutes() * 60) +
                                  jsdate.getSeconds() + off;
                var beat = Math.floor(theSeconds/86.4);
                if (beat > 1000) {
                    beat -= 1000;
                }
                if (beat < 0) {
                    beat += 1000;
                }
                if ((String(beat)).length == 1) {
                    beat = "00"+beat;
                }
                if ((String(beat)).length == 2) {
                    beat = "0"+beat;
                }
                return beat;
            },
            g: function (){
                return jsdate.getHours() % 12 || 12;
            },
            G: function (){
                return jsdate.getHours();
            },
            h: function (){
                return pad(f.g(), 2);
            },
            H: function (){
                return pad(jsdate.getHours(), 2);
            },
            i: function (){
                return pad(jsdate.getMinutes(), 2);
            },
            s: function (){
                return pad(jsdate.getSeconds(), 2);
            },
            u: function (){
                return pad(jsdate.getMilliseconds()*1000, 6);
            },

        // Timezone
            e: function () {
/*                var abbr='', i=0;
                if (this.php_js && this.php_js.default_timezone) {
                    return this.php_js.default_timezone;
                }
                if (!tal.length) {
                    tal = this.timezone_abbreviations_list();
                }
                for (abbr in tal) {
                    for (i=0; i < tal[abbr].length; i++) {
                        if (tal[abbr][i].offset === -jsdate.getTimezoneOffset()*60) {
                            return tal[abbr][i].timezone_id;
                        }
                    }
                }
*/
                return 'UTC';
            },
            I: function (){
                return _dst(jsdate);
            },
            O: function (){
               var t = pad(Math.abs(jsdate.getTimezoneOffset()/60*100), 4);
               t = (jsdate.getTimezoneOffset() > 0) ? "-"+t : "+"+t;
               return t;
            },
            P: function (){
                var O = f.O();
                return (O.substr(0, 3) + ":" + O.substr(3, 2));
            },
            T: function () {
/*                var abbr='', i=0;
                if (!tal.length) {
                    tal = that.timezone_abbreviations_list();
                }
                if (this.php_js && this.php_js.default_timezone) {
                    for (abbr in tal) {
                        for (i=0; i < tal[abbr].length; i++) {
                            if (tal[abbr][i].timezone_id === this.php_js.default_timezone) {
                                return abbr.toUpperCase();
                            }
                        }
                    }
                }
                for (abbr in tal) {
                    for (i=0; i < tal[abbr].length; i++) {
                        if (tal[abbr][i].offset === -jsdate.getTimezoneOffset()*60) {
                            return abbr.toUpperCase();
                        }
                    }
                }
*/
                return 'UTC';
            },
            Z: function (){
               return -jsdate.getTimezoneOffset()*60;
            },

        // Full Date/Time
            c: function (){
                return f.Y() + "-" + f.m() + "-" + f.d() + "T" + f.h() + ":" + f.i() + ":" + f.s() + f.P();
            },
            r: function (){
                return f.D()+', '+f.d()+' '+f.M()+' '+f.Y()+' '+f.H()+':'+f.i()+':'+f.s()+' '+f.O();
            },
            U: function (){
                return Math.round(jsdate.getTime()/1000);
            }
    };

    return format.replace(/[\\]?([a-zA-Z])/g, function (t, s){
        if ( t!=s ){
            // escaped
            ret = s;
        } else if (f[s]){
            // a date function exists
            ret = f[s]();
        } else {
            // nothing special
            ret = s;
        }
        return ret;
    });
}

/**
 * Update the worker counter
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function updateWorkerCounter() {
	var oWorkerCounter = document.getElementById('workerLastRunCounter');
	// write the time to refresh to header counter
	if(oWorkerCounter) {
		if(oWorkerProperties.last_run) {
			oWorkerCounter.innerHTML = date(oGeneralProperties.date_format, oWorkerProperties.last_run/1000);
		}
	}
	oWorkerCounter = null;
	return true;
}

/**
 * Function to start the page refresh/rotation
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function rotatePage() {
	if(oRotationProperties.nextStepUrl !== '') {
		if(oRotationProperties.rotationEnabled == true) {
			window.open(oRotationProperties.nextStepUrl, "_self");
			return true;
		}
	} else {
		window.location.reload(true);
		return true;
	}
	return false;
}

/**
 * Function counts down in 1 second intervals. If nextRotationTime is smaller
 * than 0, refresh/rotate
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function rotationCountdown() {
	// Only proceed with counting when rotation is enabled and the next step time 
	// has a proper value
	if(oRotationProperties.rotationEnabled && oRotationProperties.rotationEnabled == true && oRotationProperties.nextStepTime && oRotationProperties.nextStepTime !== '') {
		// Countdown one second
		oRotationProperties.nextStepTime -= 1;
		
		if(oRotationProperties.nextStepTime <= 0) {
			return rotatePage();
		} else {
			var oRefCountHead = document.getElementById('refreshCounterHead');
			// write the time to refresh to header counter
			if(oRefCountHead) {
				oRefCountHead.innerHTML = oRotationProperties.nextStepTime;
				oRefCountHead = null;
			}
			
			var oRefCount = document.getElementById('refreshCounter');
			// write the time to refresh to the normal counter
			if(oRefCount) {
				oRefCount.innerHTML = oRotationProperties.nextStepTime;
				oRefCount = null;
			}
		}
	}
	return false;
}

/**
 * Function gets the value of url params
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function getUrlParam(name) {
	var name2 = name.replace('[', '\\[').replace(']', '\\]');
	var regexS = "[\\?&]"+name2+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec(window.location);
	if(results === null) {
		return '';
	} else {
		return results[1];
	}
}

/**
 * Function to set the rotation switch label dynamicaly
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function setRotationLabel() {
	if(oRotationProperties.rotationEnabled == true) {
		document.getElementById('rotationStart').style.display = 'none';
		document.getElementById('rotationStop').style.display = 'inline';
	} else {
		document.getElementById('rotationStart').style.display = 'inline';
		document.getElementById('rotationStop').style.display = 'none';
	}
}

/**
 * Function to start/stop the rotation
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function switchRotation() {
	if(oRotationProperties.rotationEnabled == true) {
		oRotationProperties.rotationEnabled = false;
		
		setRotationLabel();
	} else {
		oRotationProperties.rotationEnabled = true;
		
		setRotationLabel();
	}
}

function getCurrentTime() {
	var oDate = new Date();
	var sHours = oDate.getHours();
	sHours = (( sHours < 10) ? "0"+sHours : sHours);
	var sMinutes = oDate.getMinutes();
	sMinutes = (( sMinutes < 10) ? "0"+sMinutes : sMinutes);
	var sSeconds = oDate.getSeconds();
	sSeconds = (( sSeconds < 10) ? "0"+sSeconds : sSeconds);
	
	return sHours+":"+sMinutes+":"+sSeconds;
}

function getRandomLowerCaseLetter() {
   return String.fromCharCode(97 + Math.round(Math.random() * 25));
}

function getRandom(min, max) {
	if( min > max ) {
		return -1;
	}
	
	if( min == max ) {
		return min;
	}
	
	return min + parseInt(Math.random() * (max-min+1), 0);
}

/**
 * Returns the current height of the header menu
 */
function getHeaderHeight() {
	var ret = 0;
	
	// FIXME: Check if header is shown
	
	var oHeader = document.getElementById('header');
	if(oHeader) {
		ret = oHeader.clientHeight;
		oHeader = null;
	}
	
	return ret;
}

function cloneObject(what) {
	var o;
	var i;
	
	if(what instanceof Array) {
		o = [];
	} else {
		o = {};
	}
	
	for (i in what) {
		if (typeof what[i] == 'object') {
			if(i != 'parsedObject') {
				o[i] = cloneObject(what[i]);
			}
		} else {
			o[i] = what[i];
		}
	}
	
	return o;
}

function pageWidth() {
	var w;
	
	if(window.innerWidth !== null  && typeof window.innerWidth !== 'undefined') { 
		w = window.innerWidth;
	} else if(document.documentElement && document.documentElement.clientWidth) {
		w = document.documentElement.clientWidth;
	} else if(document.body !== null) {
		w = document.body.clientWidth;
	} else {
		w = null;
	}
	
	return w;
}

function pageHeight() {
	var h;
	
	if(window.innerHeight !== null && typeof window.innerHeight !== 'undefined') {
		h = window.innerHeight;
	} else if(document.documentElement && document.documentElement.clientHeight) {
		h = document.documentElement.clientHeight;
	} else if(document.body !== null) {
		h = document.body.clientHeight;
	} else {
		h = null;
	}
	
	return h;
}

/**
 * Scrolls the screen to the defined coordinates
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function scrollSlow(iTargetX, iTargetY, iSpeed) {
	var currentScrollTop;
	var currentScrollLeft;
	var iMapOffsetTop;
	var scrollTop;
	var scrollLeft;
	var iWidth;
	var iHeight;
	
	var iStep = 2;
	
	if (typeof window.pageYOffset !== 'undefined') {
		currentScrollTop = window.pageYOffset;
	} else if (typeof document.compatMode !== 'undefined' && document.compatMode !== 'BackCompat') {
		currentScrollTop = document.documentElement.scrollTop;
	} else if (typeof document.body !== 'undefined') {
		currentScrollTop = document.body.scrollTop;
	}
	
	if (typeof window.pageXOffset !== 'undefined') {
		currentScrollLeft = window.pageXOffset;
	} else if (typeof document.compatMode != 'undefined' && document.compatMode !== 'BackCompat') {
		currentScrollLeft = document.documentElement.scrollLeft;
	} else if (typeof document.body !== 'undefined') {
		currentScrollLeft = document.body.scrollLeft;
	}
	
	// Get offset of the map div
	var oMap = document.getElementById('map');
	if(oMap && oMap.offsetTop) {
		iMapOffsetTop = oMap.offsetTop;
	} else {
		iMapOffsetTop = 0;
	}
	oMap = null;
	
	// Get measure of the screen
	iWidth = pageWidth();
	iHeight = pageHeight() - iMapOffsetTop;
		
	if(iTargetY <= (currentScrollTop+iHeight)  && iTargetY >= currentScrollTop) {
		// Target is in current view
		scrollTop = 0;
	} else if(iTargetY < currentScrollTop) {
		// Target is above current view
		scrollTop = -iStep;
	} else if(iTargetY > currentScrollTop) {
		// Target is below current view
		scrollTop = iStep;
	}
	
	if(iTargetX <= (currentScrollLeft+iWidth) && iTargetX >= currentScrollLeft) {
		// Target is in current view
		scrollLeft = 0;
	} else if(iTargetX < currentScrollLeft) {
		// Target is left from current view
		scrollLeft = -iStep;
	} else if(iTargetX > currentScrollLeft) {
		// Target is right from current view
		scrollLeft = iStep;
	} else {
		scrollLeft = 0;
	}
	
	eventlog("scroll", "debug", currentScrollLeft+" to "+iTargetX+" = "+scrollLeft+", "+currentScrollTop+" to "+iTargetY+" = "+scrollTop);
	
	if(scrollTop !== 0 || scrollLeft !== 0) {
		window.scrollBy(scrollLeft, scrollTop);
		
		setTimeout(function() { scrollSlow(iTargetX, iTargetY, iSpeed); }, iSpeed);
	} else {
		eventlog("scroll", "debug", 'No need to scroll: '+currentScrollLeft+' - '+iTargetX+', '+currentScrollTop+' - '+iTargetY);
	}
}

/**
 * escapeUrlValues
 *
 * Escapes some evil signs in the url parameters
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function escapeUrlValues(sStr) {
	if(typeof sStr === undefined || sStr === null || sStr === '') {
		return sStr;
	}
	
	sStr = new String(sStr);
	
	if(sStr.search('\\+') !== -1) {
		sStr = sStr.replace(/\+/g, '%2B');
	}
	
	if(sStr.search('&') !== -1) {
		sStr = sStr.replace(/&/g, '%26');
	}
	
	if(sStr.search('#') !== -1) {
		sStr = sStr.replace(/#/g, '%23');
	}
	
	if(sStr.search(':') !== -1) {
		sStr = sStr.replace(/:/g, '%3A');
	}
	
	if(sStr.search(' ') !== -1) {
		sStr = sStr.replace(/ /g, '%20');
	}
	
	if(sStr.search('=') !== -1) {
		sStr = sStr.replace(/=/g, '%3D');
	}
	
	if(sStr.search('\\?') !== -1) {
		sStr = sStr.replace(/\?/g, '%3F');
	}
	
	return sStr;
}

/**
 * Function to dumping arrays/objects in javascript for debugging purposes
 * Taken from http://refactormycode.com/codes/226-recursively-dump-an-object
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function oDump(object, depth, max){
	depth = depth || 0;
	max = max || 2;
	
	if (depth > max) {
		return false;
	}
	
	var indent = "";
	for (var i = 0; i < depth; i++) {
		indent += "  ";
	}
	
	var output = "";  
	for (var key in object) {
		output += "\n" + indent + key + ": ";
		switch (typeof object[key]) {
			case "object": output += oDump(object[key], depth + 1, max); break;
			case "function": output += "function"; break;
			default: output += object[key]; break;        
		}
	}
	return output;
}

/**
 * Detect firefox browser
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function isFirefox() {
  return navigator.userAgent.indexOf("Firefox") > -1;
}

/*
 * addDOMLoadEvent - Option schedules given javascript code to be executed after
 *                   the whole page was loaded in browser
 *
 * (c)2006 Jesse Skinner/Dean Edwards/Matthias Miller/John Resig
 * Special thanks to Dan Webb's domready.js Prototype extension
 * and Simon Willison's addLoadEvent
 *
 * For more info, see:
 * http://www.thefutureoftheweb.com/blog/adddomloadevent
 * http://dean.edwards.name/weblog/2006/06/again/
 * http://www.vivabit.com/bollocks/2006/06/21/a-dom-ready-extension-for-prototype
 * http://simon.incutio.com/archive/2004/05/26/addLoadEvent
 *
 * Hope the use here in NagVis is ok for license reasons. If not please contact me.
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
addDOMLoadEvent = (function(){
    // create event function stack
    var load_events = [],
        load_timer,
        script,
        done,
        exec,
        old_onload,
        init = function () {
            done = true;

            // kill the timer
            clearInterval(load_timer);

            // execute each function in the stack in the order they were added
            while (exec = load_events.shift())
                exec();

            if (script) script.onreadystatechange = '';
        };

    return function (func) {
        // if the init function was already ran, just run this function now and stop
        if (done) return func();

        if (!load_events[0]) {
            // for Mozilla/Opera9
            if (document.addEventListener)
                document.addEventListener("DOMContentLoaded", init, false);

            // for Internet Explorer
            /*@cc_on @*/
            /*@if (@_win32)
                document.write("<script id=__ie_onload defer src=//0><\/scr"+"ipt>");
                script = document.getElementById("__ie_onload");
                script.onreadystatechange = function() {
                    if (this.readyState == "complete")
                        init(); // call the onload handler
                };
              @end
            @*/

            // for Safari
            if (/WebKit/i.test(navigator.userAgent)) { // sniff
                load_timer = setInterval(function() {
                    if (/loaded|complete/.test(document.readyState))
                        init(); // call the onload handler
                }, 10);
            }

            // for other browsers set the window.onload, but also execute the old window.onload
            old_onload = window.onload;
            window.onload = function() {
                init();
                if (old_onload) old_onload();
            };
        }

        load_events.push(func);
    }
})();

/**
 * Handles javascript errors in the browser. It sends some entry to the frontend
 * eventlog. It also displays an error box to the user.
 * It returns true to let the browser also handle the error.
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function handleJSError(sMsg, sUrl, iLine) {
    // Log to javascript eventlog
	eventlog("js-error", "critical", "JS-Error occured: " + sMsg + " " + sUrl + " (" + iLine + ")");
	
	// Show error box
	var oMsg = {};
	oMsg.type = 'CRITICAL';
	oMsg.message = "Javascript error occured:\n " + sMsg + " " + sUrl + " (" + iLine + ")";
	oMsg.title = "Javascript error";
	
	// Handle application message/error
	frontendMessage(oMsg);
	oMsg = null;
	
	return false;
}

// Enable javascript error handler
try {
	window.onerror = handleJSError;
} catch(er) {}

/**
 * Cross browser mapper to add an event to an object
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function addEvent(obj, type, fn) {
   if(obj.addEventListener) {
      obj.addEventListener(type, fn, false);
   } else if (obj.attachEvent) {
      obj["e"+type+fn] = fn;
      
      obj[type+fn] = function() {
      	obj["e"+type+fn](window.event);
      }
      
      obj.attachEvent("on"+type, obj[type+fn]);
   }
}

/**
 * Displays a system status message
 *
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */
function displayStatusMessage(msg, type, hold) {
	var iMessageTime = 5000;
	
	var oMessage = document.getElementById('statusMessage');
	
	// Initialize when not yet done
	if(!oMessage) {
		oMessage = document.createElement('div');
		oMessage.setAttribute('id', 'statusMessage');
		
		document.body.appendChild(oMessage);
	}
	
	// When there is another timer clear it
	if(oStatusMessageTimer) {
		clearTimeout(oStatusMessageTimer);
	}
	
	var cont = msg;
	if (type) {
		cont = '<div class="'+type+'">'+cont+'</div>';
	}
	
	oMessage.innerHTML = cont;
	oMessage.style.display = 'block';
	
	if (type != 'loading') {
		oMessage.onmousedown = function() { hideStatusMessage(); return true; };
	}
	
	if (!hold) {
		oStatusMessageTimer = window.setTimeout(function() { hideStatusMessage(); }, iMessageTime);
	}
	
	oMessage = null;
}


// make a message row disapear
function hideStatusMessage() {
	var oMessage = document.getElementById('statusMessage');
	
	// Only hide when initialized
	if(oMessage) {
		oMessage.style.display = 'none';
		oMessage.onmousedown = null;
	}
}

/**
 * Creates a html box on the map. Used by textbox objects, labels and line labels
 *
 * @return  Object  Returns the div object of the textbox
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function drawNagVisTextbox(id, className, bgColor, borderColor, x, y, z, w, h, text, customStyle) {
		var oLabelDiv = document.createElement('div');
		oLabelDiv.setAttribute('id', id);
		oLabelDiv.setAttribute('class', className);
		oLabelDiv.setAttribute('className', className);
		oLabelDiv.style.background = bgColor;
		oLabelDiv.style.borderColor = borderColor;
		
		oLabelDiv.style.position = 'absolute';
		oLabelDiv.style.left = x + 'px';
		oLabelDiv.style.top = y + 'px';
		
		if(w && w !== '' && w !== 'auto') {
			oLabelDiv.style.width = w+'px';
		}
		
		if(h && h !== '' && h !== 'auto') {
			oLabelDiv.style.height = h+'px';
		}
		
		oLabelDiv.style.zIndex = z + 1;
		oLabelDiv.style.overflow = 'visible';
		
		/**
		 * IE workaround: The transparent for the color is not enough. The border
		 * has really to be hidden.
		 */
		if(borderColor == 'transparent') {
			oLabelDiv.style.borderStyle = 'none';
		} else {
			oLabelDiv.style.borderStyle = 'solid';
		}
		
		// Create span for text and add label text
		var oLabelSpan = document.createElement('span');
		
		// Setting custom style if someone wants the textbox to be
		// styled.
		//
		// The problem here is that the custom style is given as content of the
		// HTML style attribute. But that can not be applied easily using plain
		// JS. So parse the string and apply the options manually.
		if(customStyle && customStyle !== '') {
			// Split up the coustom style string to apply the attributes
			var aStyle = customStyle.split(';');
			for(var i in aStyle) {
				var aOpt = aStyle[i].split(':');
				
				if(aOpt[0] && aOpt[0] != '' && aOpt[1] && aOpt[1] != '') {
					var sKey = aOpt[0].replace(/(-[a-zA-Z])/g, '$1');
					
					var regex = /(-[a-zA-Z])/;
					var result = regex.exec(aOpt[0]);
					
					if(result !== null) {
						for (var i = 1; i < result.length; i++) {
							var fixed = result[i].replace('-', '').toUpperCase();
							sKey = sKey.replace(result[i], fixed);
						}
					}
					
					oLabelSpan.style[sKey] = aOpt[1];
				}
			}
		}
		
		oLabelSpan.innerHTML = text;
		
		oLabelDiv.appendChild(oLabelSpan);
		oLabelSpan = null;
		
		return oLabelDiv;
}

/**
 * Scales a hex color down/up
 *
 * @return  String  New and maybe scaled hex code
 * @author  Lars Michelsen <lars@vertical-visions.de>
 */
function lightenColor(code, rD, gD, bD) {
	var r = parseInt(code.substring(1, 3), 16);
	var g = parseInt(code.substring(3, 5), 16);
	var b = parseInt(code.substring(5, 7), 16);
	
	r += rD;  if (r > 255) r = 255;  if (r < 0) r = 0;
	g += gD;  if (g > 255) g = 255;  if (g < 0) g = 0;
	b += bD;  if (b > 255) b = 255;  if (b < 0) b = 0;
	
	code  = r.length < 2 ? "0"+r.toString(16) : r.toString(16);
	code += g.length < 2 ? "0"+g.toString(16) : g.toString(16);
	code += b.length < 2 ? "0"+b.toString(16) : b.toString(16);
	
	return "#" + code.toUpperCase();
}
	
