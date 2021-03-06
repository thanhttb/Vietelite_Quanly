/*
Product Name: dhtmlxSuite 
Version: 4.2.1 
Edition: Standard 
License: content of this file is covered by GPL. Usage outside GPL terms is prohibited. To obtain Commercial or Enterprise license contact sales@dhtmlx.com
Copyright UAB Dinamenta http://www.dhtmlx.com
*/

function dhtmlXSlider(data) {
	
	var that = this;
	
	this.conf = {
		size: null,
		skin: null,
		vertical: false,
		min: 0,
		max: 99,
		value: 0,
		step: 1,
		decimals: 0,
		margin: 2,
		border: 1,
		inverse: false,
		disabled: false,
		tooltip: false,
		visible: true,
		linkTo: undefined
	};
	
	this._attachedNode = {};
	this._movingInitialValues = null;
	
	this.base = null;
	
	if (arguments.length > 1) { // init by arguments
		return new dhtmlXSlider(this._renderArgumets(arguments));
	}else if (typeof(data) == "string" || (typeof(data) == "object" && data.tagName)) { // init by node
		return new dhtmlXSlider({parent: data});
	}
	
	if (typeof(data.parent) == "string") {
		this.base = document.getElementById(data.parent);
	} else {
		this.base = data.parent;
	}
	
	this._mergeConfig(this._readAttFormNode(this.base));
	this._mergeConfig(data);
	
	this._detectDecimals();
	
	if (this.conf.size == null || this.conf.size == undefined) {
		if (this.conf.vertical) {
			this.conf.size = this.base.offsetHeight;
		} else {
			this.conf.size = this.base.offsetWidth;
		}
	}
	
	var skin = this.conf.skin || window.dhx4.skin || (typeof(dhtmlx) != "undefined"? dhtmlx.skin : null) || window.dhx4.skinDetect("dhxslider") || "dhx_skyblue";
	
	this.setSkin(skin);
	
	this.base.innerHTML = "<div class='dhxsl_container'>"+
					"<div class='dhxsl_track'></div>"+
					"<div class='dhxsl_runner'></div>"+
				"</div>";
	
	this._nodes = {
		cont: this.base.firstChild,
		track: this.base.firstChild.firstChild,
		runner: this.base.firstChild.childNodes[1]
	};
	
	this._nodes.cont.onmousedown = 
	this._nodes.track.onmousedown = 
	this._nodes.cont.onselectstart = 
	this._nodes.track.onselectstart = function(e) {
		e = e || event;
		if (typeof(e.preventDefault) == "function") {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
		return false;
	};
	
	this.conf.value = this._normalize(this.conf.value);
	this._setOrient(this.conf.vertical);
	this.setSize(this.conf.size);
	
	// events start
	
	this._initMover = function(e) {
		
		e = e || event;
		if (typeof(e.preventDefault) == "function") e.preventDefault();
		
		that._nodes.runner.className = "dhxsl_runner dhxsl_runner_actv";
		
		var type = (e.type=="mousedown"?"client":"page")+(that.conf.vertical?"Y":"X");
		
		that._movingInitialValues = {};
		that._movingInitialValues.value = that.conf.value;
		that._movingInitialValues.coord = (typeof(e[type]) != "undefined" ? e[type] : e.touches[0][type]);
		
		if (that.conf.disabled == false) {
			if (typeof(window.addEventListener) == "function") {
				window.addEventListener("mousemove", that._move, false);
				window.addEventListener("mouseup", that._cleanMove, false);
				window.addEventListener("touchmove", that._move, false);
				window.addEventListener("touchend", that._cleanMove, false);
			} else {
				document.body.attachEvent("onmousemove", that._move);
				document.body.attachEvent("onmouseup", that._cleanMove);
			}
		}
		that.callEvent("_onRunnerMouseDown",[]);
		return false;
	};
	
	this._move = function(e) {
		
		e = e || event;
		if (typeof(e.preventDefault) == "function") e.preventDefault();
		var type = (e.type=="mousemove"?"client":"page")+(that.conf.vertical?"Y":"X");
		
		var runner = (that.conf.vertical) ? that._nodes.runner.offsetHeight : that._nodes.runner.offsetWidth;
		var range = that.conf.max - that.conf.min;
		var n_cord = (typeof(e[type]) != "undefined" ? e[type] : e.touches[0][type]);
		var new_value = that._movingInitialValues.value + (n_cord - that._movingInitialValues.coord)*range/(that.conf.size - runner)*(that.conf.inverse?-1:1);
		
		that.setValue(new_value, true);
	};
	
	this._cleanMove = function(e) {
		if (typeof(window.addEventListener) == "function") {
			window.removeEventListener("mousemove", that._move, false);
			window.removeEventListener("mouseup", that._cleanMove, false);
			window.removeEventListener("touchmove", that._move, false);
			window.removeEventListener("touchend", that._cleanMove, false);
		} else {
			document.body.detachEvent("onmousemove", that._move);
			document.body.detachEvent("onmouseup", that._cleanMove);
		}
		that._movingInitialValues = null;
		that._nodes.runner.className = that._nodes.runner.className.replace(/\s{0,}dhxsl_runner_actv/gi,"");
		that.callEvent("onSlideEnd", [that.conf.value]);
		that.callEvent("_onRunnerMouseUp", []);
	};
	
	this._doOnSetValue = function(e) {
		
		if (that._movingInitialValues != null) return false;
		
		e = e || event;
		if (typeof(e.preventDefault) == "function") e.preventDefault();
		
		var n_coord = (that.conf.vertical) ? (e.offsetY || e.layerY) : (e.offsetX || e.layerX);
		var runner = (that.conf.vertical) ? that._nodes.runner.offsetHeight : that._nodes.runner.offsetWidth;
		var range = that.conf.max - that.conf.min;
		
		if (that.conf.inverse) {
			var new_value = that.conf.max-(n_coord*range/(that.conf.size));
		} else {
			var new_value = (n_coord*range/(that.conf.size) + that.conf.min);
		}
		
		that.setValue(new_value, true);
		
		if (that._movingInitialValues == null) that._initMover(e);
		
		return false;
	};
	
	this._doOnChangeInput = function(e) {
		e = e || event;
		var target = e.target || e.srcElement;
		that.setValue(target.value);
	};
	
	this._doOnKeyDown = function(e) {
		e = e || event;
		var target = e.target || e.srcElement;
		if (e.keyCode == 13) that.setValue(target.value);
	};
	
	// events end
	
	this._attachEvents(this._nodes);
	
	this.unload = function() {
		
		dhx4._eventable(this, "clear");
		
		this._detachNode();
		this._detachEvents(this._nodes);
		
		this.base.removeChild(this._nodes.cont);
		
		this._nodes.cont.onmousedown = 
		this._nodes.track.onmousedown = 
		this._nodes.cont.onselectstart = 
		this._nodes.track.onselectstart = null;
		
		delete this._nodes.cont;
		delete this._nodes.track;
		delete this._nodes.max;
		delete this._nodes.min;
		delete this._nodes.runner;
		
		if (/\s?dhtmlxslider_\S*/.test(this.base.className)) {
			this.base.className = this.base.className.replace(/\s?dhtmlxslider_\S*/, "");
		}
		
		for (var key in this) this[key] = null;
		
		that = null;
	};
	
	dhx4._eventable(this);
	
	if (this.conf.disabled) {
		this.disable();
	}
	
	if (this.conf.tooltip) {
		this.enableTooltip();
	}
	
	if (!this.conf.visible) {
		this.hide();
	}
	
	if (this.conf.linkTo) {
		this.linkTo(this.conf.linkTo);
	}
	
	return this;
	
};

dhtmlXSlider.prototype._setOrient = function(vertical) {
	vertical = vertical || false;
	
	if (/\s?dhxsl_cont_hr/i.test(this._nodes.cont.className)) {
		this._nodes.cont.className = this._nodes.cont.className.replace(/\s?dhxsl_cont_hr/i, "");
	}
	
	if (/\s?dhxsl_cont_vr/i.test(this._nodes.cont.className)) {
		this._nodes.cont.className = this._nodes.cont.className.replace(/\s?dhxsl_cont_vr/i, "");
	}
	
	if (vertical) {
		this._nodes.cont.className += " dhxsl_cont_vr";
	} else {
		this._nodes.cont.className += " dhxsl_cont_hr";
	}
};

dhtmlXSlider.prototype._attachEvents = function(nodes) {
	if (typeof(window.addEventListener) == "function") {
		nodes.runner.addEventListener("mousedown", this._initMover, false);
		nodes.runner.addEventListener("touchstart", this._initMover, false);
		nodes.cont.addEventListener("mousedown", this._doOnSetValue, false);
		nodes.cont.addEventListener("touchstart", this._doOnSetValue, false);
	} else {
		nodes.runner.attachEvent("onmousedown", this._initMover);
		nodes.cont.attachEvent("onmousedown", this._doOnSetValue);
	}
};

dhtmlXSlider.prototype._detachEvents = function(nodes) {
	if (typeof(window.addEventListener) == "function") {
		nodes.runner.removeEventListener("mousedown", this._initMover, false);
		nodes.runner.removeEventListener("touchstart", this._initMover, false);
		nodes.cont.removeEventListener("mousedown", this._doOnSetValue, false);
		nodes.cont.removeEventListener("touchstart", this._doOnSetValue, false);
	} else {
		nodes.runner.detachEvent("onmousedown", this._initMover);
		nodes.cont.detachEvent("onmousedown", this._doOnSetValue);
	}
};

dhtmlXSlider.prototype._mergeConfig = function(data) {
	for (var key in data) {
		switch (key.toLowerCase()) {
			case "min":
			case "max":
			case "size":
			case "step":
			case "value":
			case "inverse":
				this.conf[key] = data[key];
				break;
			case "tooltip":
			case "visible":
			case "vertical":
			case "disabled":
				this.conf[key] = dhx4.s2b(data[key]);
				break;
			case "parent":
				continue;
				break;
			default:
				this.conf[key] = data[key];
		}
	}
};

dhtmlXSlider.prototype._readAttFormNode = function(node) {
	var atts = node.attributes, l = atts.length, i, answer = {}, att;
	
	for (i=0; i<l; i++) {
		att = atts[i];
		switch (att.name.toLowerCase()) {
			case "size":
			case "min":
			case "max":
			case "value":
			case "step":
				answer[att.name] = att.value;
				break;
			case "skin":
				answer.skin = att.value;
				break;
			case "vertical":
			case "disabled":
			case "visible":
				answer[att.name] = dhx4.s2b(att.value);
				break;
			case "linkto":
				answer.linkTo = att.value;
				break;
			case "tooltip":
				answer.tooltip = dhx4.s2b(att.value);
				break;
		}
	}
	
	return answer;
};

dhtmlXSlider.prototype._renderArgumets = function(arg) {
	var answer = {}, i,l;
	l = arg.length;
	
	for (i=0; i<l; i++) {
		switch (i) {
			case 0:
				answer.parent = arg[i];
				break;
			case 1:
				answer.size = arg[i];
				break;
			case 2:
				answer.skin = arg[i];
				break;
			case 3:
				answer.vertical = arg[i];
				break;
			case 4:
				answer.min = arg[i];
				break;
			case 5:
				answer.max = arg[i];
				break;
			case 6:
				answer.value = arg[i];
				break;
			case 7:
				answer.step = arg[i];
				break;
		}
	}
	
	return answer;
};

dhtmlXSlider.prototype._skinCollection = {
	dhx_skyblue: true,
	dhx_web: true,
	dhx_terrace: true
};

dhtmlXSlider.prototype._indexOf = function(arr, el) {
	var i,l,answer = -1;
	l = arr.length;
	for (i=l; i>=0; i--) {
		if (arr[i] == el) {
			answer = i;
			break;
		}
	}
	
	return answer;
};

dhtmlXSlider.prototype._refreshRunner = function() {
	var cmax, cp;
	
	if (this.conf.vertical) {
		cmax = this._nodes.cont.offsetHeight - this._nodes.runner.offsetHeight;
		cp = this._getCoord(cmax);
		
		this._nodes.runner.style.top = cp + this.conf.border + "px";
		this._nodes.runner.style.left = Math.round((this._nodes.cont.offsetWidth - this._nodes.runner.offsetWidth)/2) + "px";
		
	}else {
		cmax = this._nodes.cont.offsetWidth - this._nodes.runner.offsetWidth;
		cp = this._getCoord(cmax);
		
		this._nodes.runner.style.left = cp + this.conf.border + "px";
		this._nodes.runner.style.top = Math.round((this._nodes.cont.offsetHeight - this._nodes.runner.offsetHeight)/2) + "px";
	}
};

dhtmlXSlider.prototype._setValueByCoord = function(data) {
	var cx = dhx4.absLeft(this._nodes.cont),
	cy = dhx4.absTop(this._nodes.cont),
	value, k;
	
	if (this.conf.vertical) {
		k = (data.y - cy - this._nodes.runner.offsetHeight/2)/(this._nodes.cont.offsetHeight - this._nodes.runner.offsetHeight);
	} else {
		k = (data.x - cx - this._nodes.runner.offsetWidth/2)/(this._nodes.cont.offsetWidth - this._nodes.runner.offsetWidth);
	}
	
	value = (this.conf.max-this.conf.min)*k+this.conf.min;
	
	this.setValue(value, true);
};

dhtmlXSlider.prototype._getCoord = function(max) {
	var v = (this.conf.inverse?this._inverseValue(this.conf.value):this.conf.value);
	var k = (v-this.conf.min)/(this.conf.max - this.conf.min);
	return Math.round(max*k);
};

dhtmlXSlider.prototype._normalize = function(value) {
	value = Number(value); // for decimals
	value = Math.round(value/this.conf.step)*this.conf.step;
	var ten = Math.pow(10, this.conf.decimals);
	value = Math.round(value*ten)/ten;
	value = Math.max(this.conf.min, Math.min(this.conf.max, value));
	return value;
};

dhtmlXSlider.prototype._attachNode = function(node) {
	var tagName = node.tagName.toLowerCase();
	if (!tagName) return;
	
	this._attachedNode.node = node;
	
	switch (tagName) {
		case "input":
		case "select":
			if (typeof(window.addEventListener) == "function") {
				node.addEventListener("change", this._doOnChangeInput, false);
				node.addEventListener("keydown", this._doOnKeyDown, false);
			} else {
				node.attachEvent("onchange", this._doOnChangeInput);
				node.attachEvent("onkeydown", this._doOnKeyDown);
			}
			
			this._attachedNode.setValue = function(value, decimals) {
				value = String(value);
				if (decimals > 0) {
					var k = value.match(/\.\d{1,}$/);
					if (k != null) decimals = Math.max(decimals-k[0].length+1);
					value += (value.indexOf(".")<0?".":"");
					for (var q=0; q<decimals; q++) value += "0";
				}
				this.node.value = value;
			};
			break;
		default:
			this._attachedNode.setValue = function(value) {
				this.node.innerHTML = value;
			};
	}
	
	this._attachedNode.setValue(this.conf.value, this.conf.decimals);
};

dhtmlXSlider.prototype._detachNode = function() {
	var node = this._attachedNode.node;
	
	if (!node) {
		return;
	}
	
	var tagName = node.tagName;
	
	switch (tagName) {
		case "input":
		case "select":
			if (typeof(window.addEventListener) == "function") {
				node.removeEventListener("change", this._doOnChangeInput, false);
				node.removeEventListener("keydown", this._doOnChangeInput, false);
			} else {
				node.detachEvent("change", this._doOnChangeInput);
				node.detachEvent("keydown", this._doOnChangeInput);
			}
			break;
	}
	
	delete this._attachedNode.node;
	delete this._attachedNode.setValue;
};

dhtmlXSlider.prototype._detectDecimals = function() {
	var k = this.conf.step.toString().match(/\.(\d*)$/);
	this.conf.decimals = (k!=null?k[1].length:0);
};

dhtmlXSlider.prototype.setSize = function(value) {
	if (!isNaN(value)) {
		if (this.conf.vertical) {
			if (this._nodes.cont.style.width) delete this._nodes.cont.style.width;
			this._nodes.cont.style.height = value-this.conf.margin + "px";
		} else {
			if (this._nodes.cont.style.height) delete this._nodes.cont.style.height;
			this._nodes.cont.style.width = value-this.conf.margin + "px";
		}
		
		this._refreshRunner();
	} 
};

dhtmlXSlider.prototype.setSkin = function (skin) {
	skin = skin.toLowerCase();
	
	var classes, _int = -1, skinName, className="dhtmlxslider";
	
	classes = this.base.className.match(/\S\w+/ig);
	
	if (classes instanceof  Array) {    
		for (skinName in this._skinCollection) {
			if (_int == -1) {
				_int = this._indexOf(classes, className + "_" + skinName);
			} else {
				break;
			}
		}
		
		_int = (_int == -1) ? classes.length : _int;
	} else {
		classes = [];
		_int = 0;
	}
	
	
	
	classes[_int] = className + "_" + skin;
	
	this.base.className = classes.join(" ");
	this.conf.skin = skin;
	
	if (this._nodes) this._refreshRunner();
};

dhtmlXSlider.prototype.setValue = function(value, callEvent) {
	
	callEvent = callEvent || false;
	
	if (!isNaN(value)) {
		value = this._normalize(value);
		if (this.conf.value != value) {
			
			this.conf.value = value;
			
			this._refreshRunner();
			
			if (this.conf.tooltip) this._nodes.cont.title = value;
			
			if (callEvent) this.callEvent("onChange", [value, this]);
		}
	}
	
	if (typeof(this._attachedNode.setValue) == "function") {
		this._attachedNode.setValue(this.conf.value, this.conf.decimals);
	}
};

dhtmlXSlider.prototype.getValue = function() {
	return this.conf.value;
};

dhtmlXSlider.prototype._inverseValue = function() {
	return this.conf.max+this.conf.min-this.conf.value;
};

dhtmlXSlider.prototype.disable = function(mode) {
	mode = (mode == false) ? false : true; // deprecated
	var reg = null;
	if (mode) {
		for (var nm in this._nodes) {
			if (nm == "cont") continue;
			reg = new RegExp("\\s?dhxsl_"+nm+"_dis","i");
			if (!reg.test(this._nodes[nm].className)) {
				this._nodes[nm].className += " dhxsl_"+nm+"_dis";
			}
		}
		
		this.conf.disabled = true;
	} else {
		this.enable();
	}
};

dhtmlXSlider.prototype.enable = function() {
	var reg;
	for (var nm in this._nodes) {
		if (nm == "cont") continue;
		reg = new RegExp("\\s?dhxsl_"+nm+"_dis","i");
		if (reg.test(this._nodes[nm].className)) {
			this._nodes[nm].className = this._nodes[nm].className.replace(reg,"");
		}
	}
	
	this.conf.disabled = false;
};

dhtmlXSlider.prototype.isEnabled = function() {
	return !this.conf.disabled;
};

dhtmlXSlider.prototype.disableTooltip = function() {
	this._nodes.cont.removeAttribute("title");
	this.conf.tooltip = false;
};

dhtmlXSlider.prototype.enableTooltip = function(mode) {
	if (typeof(mode) == "undefined") mode = true; else mode = dhx4.s2b(mode);
	if (mode) {
		this._nodes.cont.title = this.conf.value;
		this.conf.tooltip = true;
	} else {
		this.disableTooltip();
	}
};

dhtmlXSlider.prototype.setMax = function(value) {
	if (!isNaN(value) && this.conf.min < value) {
		this.conf.max = value;
		this.setValue(this.conf.value);
	}
};

dhtmlXSlider.prototype.getMax = function() {
	return this.conf.max;
};

dhtmlXSlider.prototype.setMin = function(value) {
	if (!isNaN(value) && this.conf.max > value) {
		this.conf.min = value;
		this.setValue(this.conf.value);
	}
};

dhtmlXSlider.prototype.getMin = function() {
	return this.conf.min;
};

dhtmlXSlider.prototype.setStep = function(value) {
	var maxValue = this.conf.max - this.conf.min;
	if (!isNaN(value) && value < maxValue) {
		this.conf.step = value;
		this._detectDecimals();
		this.setValue(this.conf.value);
	}
};

dhtmlXSlider.prototype.getStep = function() {
	return this.conf.step;
};

dhtmlXSlider.prototype.show = function() {
	if (/\s?dhxsl_hidden/i.test(this._nodes.cont.className)) {
		this._nodes.cont.className = this._nodes.cont.className.replace(/\s?dhxsl_hidden/i, "");
	}
	
	this.conf.visible = true;
};

dhtmlXSlider.prototype.hide = function() {
	if (!/\s?dhxsl_hidden/i.test(this._nodes.cont.className)) {
		this._nodes.cont.className += " dhxsl_hidden";
	}
	
	this.conf.visible = false;
};

dhtmlXSlider.prototype.isVisible = function() {
	return this.conf.visible;
};

dhtmlXSlider.prototype.linkTo = function(node) {
	if (typeof(node) == "string") {
		node = document.getElementById(node);
	}
	
	if (this._attachedNode.node) {
		this._detachNode();
	}
	
	this._attachNode(node);
};
