"use strict";
var Util = (function(){
	function wait(time){
		return new Promise(function(resolve){
			setTimeout(resolve, time);
		});
	}
	function concatBuffers(buffer1, buffer2) {
		var newBuffer = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
		newBuffer.set(new Uint8Array(buffer1), 0 );
		newBuffer.set(new Uint8Array(buffer2), buffer1.byteLength);
		return newBuffer;
	}
	function stringToArrayBuffer(str){
		var bytes = new Uint8Array(str.length);
		for (var i = 0; i < str.length; i++){
			bytes[i] = str.charCodeAt(i);
		}
		return bytes;
	}
	function arrayBufferToString(buffer){
		var str = "";
		for (var i = 0; i < buffer.byteLength; i++) {
			str += String.fromCharCode(buffer[i]);
		}
		return str;
	}
	return {
		wait,
		concatBuffers,
		stringToArrayBuffer,
		arrayBufferToString
	};
})();
