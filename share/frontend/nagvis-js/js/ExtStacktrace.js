// Taken from http://github.com/emwendelin/javascript-stacktrace/downloads
// on 2010-10-02
function printStackTrace(b){var c=(b&&b.e)?b.e:null;var e=(b&&b.guess)?b.guess:true;var d=new printStackTrace.implementation();var a=d.run(c);return(e)?d.guessFunctions(a):a}printStackTrace.implementation=function(){};printStackTrace.implementation.prototype={run:function(a){var b=this._mode||this.mode();if(b==="other"){return this.other(arguments.callee)}else{a=a||(function(){try{(0)()}catch(c){return c}})();return this[b](a)}},mode:function(){try{(0)()}catch(a){if(a.arguments){return(this._mode="chrome")}else{if(a.stack){return(this._mode="firefox")}else{if(window.opera&&!("stacktrace" in a)){return(this._mode="opera")}}}}return(this._mode="other")},chrome:function(a){return a.stack.replace(/^.*?\n/,"").replace(/^.*?\n/,"").replace(/^.*?\n/,"").replace(/^[^\(]+?[\n$]/gm,"").replace(/^\s+at\s+/gm,"").replace(/^Object.<anonymous>\s*\(/gm,"{anonymous}()@").split("\n")},firefox:function(a){return a.stack.replace(/^.*?\n/,"").replace(/(?:\n@:0)?\s+$/m,"").replace(/^\(/gm,"{anonymous}(").split("\n")},opera:function(h){var c=h.message.split("\n"),b="{anonymous}",g=/Line\s+(\d+).*?script\s+(http\S+)(?:.*?in\s+function\s+(\S+))?/i,f,d,a;for(f=4,d=0,a=c.length;f<a;f+=2){if(g.test(c[f])){c[d++]=(RegExp.$3?RegExp.$3+"()@"+RegExp.$2+RegExp.$1:b+"()@"+RegExp.$2+":"+RegExp.$1)+" -- "+c[f+1].replace(/^\s+/,"")}}c.splice(d,c.length-d);return c},other:function(h){var b="{anonymous}",g=/function\s*([\w\-$]+)?\s*\(/i,a=[],d=0,e,c;var f=10;while(h&&a.length<f){e=g.test(h.toString())?RegExp.$1||b:b;c=Array.prototype.slice.call(h["arguments"]);a[d++]=e+"("+printStackTrace.implementation.prototype.stringifyArguments(c)+")";if(h===h.caller&&window.opera){break}h=h.caller}return a},stringifyArguments:function(a){for(var b=0;b<a.length;++b){var c=a[b];if(typeof c=="object"){a[b]="#object"}else{if(typeof c=="function"){a[b]="#function"}else{if(typeof c=="string"){a[b]='"'+c+'"'}}}}return a.join(",")},sourceCache:{},ajax:function(a){var b=this.createXMLHTTPObject();if(!b){return}b.open("GET",a,false);b.setRequestHeader("User-Agent","XMLHTTP/1.0");b.send("");return b.responseText},createXMLHTTPObject:function(){var c,a=[function(){return new XMLHttpRequest()},function(){return new ActiveXObject("Msxml2.XMLHTTP")},function(){return new ActiveXObject("Msxml3.XMLHTTP")},function(){return new ActiveXObject("Microsoft.XMLHTTP")}];for(var b=0;b<a.length;b++){try{c=a[b]();this.createXMLHTTPObject=a[b];return c}catch(d){}}},getSource:function(a){if(!(a in this.sourceCache)){this.sourceCache[a]=this.ajax(a).split("\n")}return this.sourceCache[a]},guessFunctions:function(b){for(var d=0;d<b.length;++d){var h=/{anonymous}\(.*\)@(\w+:\/\/([-\w\.]+)+(:\d+)?[^:]+):(\d+):?(\d+)?/;var g=b[d],a=h.exec(g);if(a){var c=a[1],f=a[4];if(c&&f){var e=this.guessFunctionName(c,f);b[d]=g.replace("{anonymous}",e)}}}return b},guessFunctionName:function(a,c){try{return this.guessFunctionNameFromLines(c,this.getSource(a))}catch(b){return"getSource failed with url: "+a+", exception: "+b.toString()}},guessFunctionNameFromLines:function(h,f){var c=/function ([^(]*)\(([^)]*)\)/;var g=/['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*(function|eval|new Function)/;var b="",d=10;for(var e=0;e<d;++e){b=f[h-e]+b;if(b!==undefined){var a=g.exec(b);if(a){return a[1]}else{a=c.exec(b)}if(a&&a[1]){return a[1]}}}return"(?)"}};
