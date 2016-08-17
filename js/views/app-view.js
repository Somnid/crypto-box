"use strict";

var AppView = (function(){

	function create(){
		var appView = {};
		bind(appView);
		appView.init();
		return appView;
	}

	function bind(appView){
		appView.installServiceWorker = installServiceWorker.bind(appView);
		appView.serviceWorkerInstalled = serviceWorkerInstalled.bind(appView);
		appView.serviceWorkerInstallFailed = serviceWorkerInstallFailed.bind(appView);
		appView.cacheDom = cacheDom.bind(appView);
		appView.setBndr = setBndr.bind(appView);
		appView.init = init.bind(appView);

		appView.save = save.bind(appView);
		appView.load = load.bind(appView);
		appView.crypt = crypt.bind(appView);
		appView.changePassword = changePassword.bind(appView);
	}

	function installServiceWorker(){
		if("serviceWorker" in navigator){
			navigator.serviceWorker.register("service-worker.js", {scope: "./"})
				.then(this.serviceWorkerInstalled)
				.catch(this.serviceWorkerInstallFailed);
		}
	}

	function serviceWorkerInstalled(registration){
		console.log("App Service registration successful with scope:", registration.scope);
	}

	function serviceWorkerInstallFailed(error){
		console.error("App Service failed to install", error);
	}

	function cacheDom(){
		this.dom = {};
	}

	function setBndr(){
		this.bndr = Bndr.create()
						.setTemplate(document.body)
						.setModel({
							encryptMode : true,
							modeText : "Encrypt",
							status : "",
							text : "",
							filename : "",
							resultText : "",
							password : "",
							passwordKey : "",
							cryptoVisible : true
						})
						.bindClassReversed("#mode", "encryptMode", "toggled")
						.bindClassReversed("#encrypted-input", "cryptoVisible", "hidden")

						.bindAttributeExistenceReversed("#load", "filename", "disabled")
						.bindAttributeExistenceReversed("#save", "filename", "disabled")

						.bindElement("#encrypted-input", "resultText")
						.bindElement("#status", "status")
						.bindElement("#mode", "modeText")
						.bindElementReverse("#password", "password")
						.bindElementReverse("#filename", "filename")
						.bindElementTwoWay("#input", "text")

						.bindEvent("#save", "click", this.save)
						.bindEvent("#load", "click", this.load)
						.bindToggleEvent("#preview", "click", "cryptoVisible")
						.bindToggleEvent("#mode", "click", "encryptMode")

						.bindChange("text", this.crypt)
						.bindChange("password", this.changePassword)
						.bindChange("passwordKey", x => this.crypt(this.model.text))

						.computeValue("encryptMode", x => x ? "Encrypt" : "Decrypt", "modeText")

						.attach();
		this.model = this.bndr.getBoundModel();
	}

	function save(){
		if(!this.dropbox.isAuthorized()){
			return this.dropbox.authorize();
		}
		this.dropbox.upload(this.model.resultText,{
					path : `/${this.model.filename}`,
					mode : "overwrite"
			})
			.then(x => this.model.status = "Saved!")
			.then(Util.wait(5000))
			.then(x => this.model.state = "")
			.catch(x => this.model.status = `Error saving: ${x}`);
	}

	function load(){
		if(!this.dropbox.isAuthorized()){
			return this.dropbox.authorize();
		}
		this.dropbox.download(`/${this.model.filename}`)
			.then(x => x.arrayBuffer())
			.then(x => {
				this.model.encryptMode = false;
				this.model.text = Util.arrayBufferToString(new Uint8Array(x))
			})
			.catch(x => this.model.status = `Error loading: ${x}`);
	}

	function crypt(value){
		this.model.status = "";
		if(!this.model.passwordKey){
			return;
		}
		if(this.model.encryptMode){
			let valueBytes = Util.stringToArrayBuffer(value);
			const vector = crypto.getRandomValues(new Uint8Array(16));
			crypto.subtle.encrypt({ name : "AES-CBC", iv : vector }, this.model.passwordKey, valueBytes)
				.then(x => {
					this.model.resultText = Util.arrayBufferToString(Util.concatBuffers(vector, new Uint8Array(x)));
				})
				.catch(x => {
					this.model.status = `Could not encrypt: ${x}`;
					Util.wait(5000).then(y => this.model.status = "");
				});
		}else{
			const buffer = Util.stringToArrayBuffer(value);
			const vector = buffer.slice(0, 16);
			const encryptedBytes = buffer.slice(16);
			crypto.subtle.decrypt({ name : "AES-CBC", iv : vector }, this.model.passwordKey, encryptedBytes)
				.then(x => this.model.resultText = Util.arrayBufferToString(new Uint8Array(x)))
				.catch(x => {
					this.model.status = `Could not decrypt: ${x}`;
					Util.wait(5000).then(y => this.model.status = "");
				});
		}
	}

	function changePassword(password){
		let passwordBytes = Util.stringToArrayBuffer(password);
		crypto.subtle.digest({ name : "SHA-256" }, passwordBytes)
			.then(x => crypto.subtle.importKey("raw", x, { name : "AES-CBC" }, false, ["encrypt", "decrypt"]))
			.then(x => this.model.passwordKey = x);
	}

	function getQueryData(){
		let searchParams = new URLSearchParams(window.location.search.substr(1));
	}

	function init(){
		this.installServiceWorker();
		this.dropbox = Dropbox.create({
			appKey : "hxnx6192t96ejeg",
			appName : "cryptoTool"
		});
		this.cacheDom();
		this.setBndr();
	}

	return {
		create : create
	};

})();
