MWF.xDesktop.requireApp("process.Xform", "Textfield", null, false);
/** @class Number 数字输入组件。
 * @o2cn 数字输入组件
 * @example
 * //可以在脚本中获取该组件
 * //方法1：
 * var field = this.form.get("name"); //获取组件
 * //方法2
 * var field = this.target; //在组件事件脚本中获取
 * @extends MWF.xApplication.process.Xform.Textfield
 * @o2category FormComponents
 * @o2range {Process|CMS}
 * @hideconstructor
 */
MWF.xApplication.process.Xform.Number = MWF.APPNumber =  new Class({
    Implements: [Events],
    Extends: MWF.APPTextfield,
    iconStyle: "numberIcon",
    isEmpty : function(){
        return !this.getData();
    },
    getInputData: function( flag ){
        if (this.node.getFirst()){
            var v = this.node.getElement("input").get("value");
            if( flag )return v;  //不判断，直接返回原值
            var n = v.toFloat();
            return (isNaN(n)) ? (this.json.emptyValue === "string" ? "" : 0) : n;
            //return (isNaN(n)) ? 0 : n;
        }else{
            return this._getBusinessData();
        }
        return v;
    },
    // getInputData: function(){
    //     var n = this.node.getElement("input").get("value").toFloat();
    //     if ((isNaN(n))) {this.setData('0')};
    //     return (isNaN(n)) ? 0 : n;
    // },

    formatNumber: function(str){
        var v = (str || "0").toFloat();
        if (v){
            if (this.json.decimals && (this.json.decimals!="*")){

                var decimals = this.json.decimals.toInt();

                var p = Math.pow(10,decimals);
                var f_x = Math.round(v*p)/p;
                str = f_x.toString();

                if (decimals>0){
                    var pos_decimal = str.indexOf('.');
                    if (pos_decimal < 0){
                        pos_decimal = str.length;
                        str += '.';
                    }
                    decimalStr = (str).substr(pos_decimal+1, (str).length);
                    while (decimalStr.length < decimals){
                        str += '0';
                        decimalStr += 0;
                    }
                }
            }
        }
        return str;
    },

    validationFormat: function(){
        if( !this.node.getElement("input") )return true;
        var n = this.node.getElement("input").get("value");
        if (isNaN(n)) {
            if( n === "" && this.json.emptyValue === "string" ){
                return true;
            }else{
                this.notValidationMode(MWF.xApplication.process.Xform.LP.notValidation_number);
                return false;
            }
        }else{
            this.node.getFirst().set("value", this.formatNumber(n));
        }
        // var v = n.toFloat();
        // if (v){
        //     if (this.json.decimals && (this.json.decimals!="*")){
        //
        //         var decimals = this.json.decimals.toInt();
        //
        //         var p = Math.pow(10,decimals);
        //         var f_x = Math.round(v*p)/p;
        //         var s_x = f_x.toString();
        //
        //         if (decimals>0){
        //             var pos_decimal = s_x.indexOf('.');
        //             if (pos_decimal < 0){
        //                 pos_decimal = s_x.length;
        //                 s_x += '.';
        //             }
        //             decimalStr = (s_x).substr(pos_decimal+1, (s_x).length);
        //             while (decimalStr.length < decimals){
        //                 s_x += '0';
        //                 decimalStr += 0;
        //             }
        //         }
        //
        //         this.node.getFirst().set("value", s_x);
        //     }
        // }
        return true;
    },
    validationConfigItem: function(routeName, data){
        debugger;
        var flag = (data.status=="all") ? true: (routeName == data.decision);
        if (flag){
            var n = this.getInputData();
            var originN = this.getInputData( true );

            if( n === "" && this.json.emptyValue === "string" )n = 0;

            var v = (data.valueType=="value") ? n : n.length;
            var originV = (data.valueType=="value") ? originN : originN.length;

            switch (data.operateor){
                case "isnull":
                    if (!originV && originV.toString()!=='0'){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "notnull":
                    if (originV){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "gt":
                    if (v>data.value){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "lt":
                    if (v<data.value){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "equal":
                    if (v==data.value){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "neq":
                    if (v!=data.value){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "contain":
                    if (originV.toString().indexOf(data.value)!=-1){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
                case "notcontain":
                    if (originV.toString().indexOf(data.value)==-1){
                        this.notValidationMode(data.prompt);
                        return false;
                    }
                    break;
            }
        }
        return true;
    },
    validationConfig: function(routeName, opinion){
        if (this.json.validationConfig){
            if (this.json.validationConfig.length){
                for (var i=0; i<this.json.validationConfig.length; i++) {
                    var data = this.json.validationConfig[i];
                    if (!this.validationConfigItem(routeName, data)) return false;
                }
            }
            return true;
        }
        return true;
    },

    _resetNodeEdit: function(){
        var input = new Element("input", {
            "styles": {
                "background": "transparent",
                "width": "100%",
                "border": "0px"
            }
        });

        var node = new Element("div", {"styles": {
                "overflow": "hidden",
                "position": "relative",
                "margin-right": "20px",
                "padding-right": "4px"
            }}).inject(this.node, "after");
        input.inject(node);

        this.node.destroy();
        this.node = node;
    },

    _loadNodeEdit: function(){
        if (!this.json.preprocessing) this._resetNodeEdit();
        var input = this.node.getFirst();
        input.set(this.json.properties);

        this.node.set({
            "id": this.json.id,
            "MWFType": this.json.type,
            "events": {
                "click": this.clickSelect.bind(this)
            }
        });
        if (this.json.showIcon!='no' && !this.form.json.hideModuleIcon) {
            this.iconNode = new Element("div", {
                "styles": this.form.css[this.iconStyle]
            }).inject(this.node, "before");
        }else if( this.form.json.nodeStyleWithhideModuleIcon ){
            this.node.setStyles(this.form.json.nodeStyleWithhideModuleIcon)
        }

        this.node.getFirst().addEvent("change", function(){
            this.validationMode();
            if (this.validation()) {
                this._setBusinessData(this.getInputData("change"));
                this.fireEvent("change");
            }
        }.bind(this));

        this.node.getFirst().addEvent("blur", function(){
            this.validation();
        }.bind(this));
        this.node.getFirst().addEvent("keyup", function(){
            this.validationMode();
        }.bind(this));
    },
    _computeValue: function(value){
        if( this.json.defaultValue && this.json.defaultValue.code){
            return this.form.Macro.exec(this.json.defaultValue.code, this)
        }else{
            if(value){
                return value;
            }else{
                return this.json.emptyValue === "string" ? "" : "0";
            }
        }
    },
    getValue: function(){
        if (this.moduleValueAG) return this.moduleValueAG;
        var value = this._getBusinessData();
        if (!value) value = this._computeValue();
        if(!value && this.json.emptyValue === "string"){
            return "";
        }else{
            value = this.formatNumber(value);
            return value || "0";
        }
    },
    __setValue: function(value){
        this._setBusinessData(value);
        if (this.node.getFirst()) this.node.getFirst().set("value", value || (this.json.emptyValue === "string" ? "" : "0"));
        if (this.isReadonly()) this.node.set("text", value);
        this.moduleValueAG = null;
        this.fieldModuleLoaded = true;
        return value;
    }
});
