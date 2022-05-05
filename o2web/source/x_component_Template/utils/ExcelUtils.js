MWF.xApplication.Template = MWF.xApplication.Template || {};
MWF.xApplication.Template.utils = MWF.xApplication.Template.utils || {};

MWF.xApplication.Template.utils.ExcelUtils = new Class({
    initialize: function(){
        this.sheet2JsonOptions = {};
        this.pollyfill();
    },
    pollyfill: function(){
        if (!FileReader.prototype.readAsBinaryString) {
            FileReader.prototype.readAsBinaryString = function (fileData) {
                var binary = "";
                var pt = this;
                var reader = new FileReader();
                reader.onload = function (e) {
                    var bytes = new Uint8Array(reader.result);
                    var length = bytes.byteLength;
                    for (var i = 0; i < length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    //pt.result  - readonly so assign binary
                    pt.content = binary;
                    pt.onload();
                };
                reader.readAsArrayBuffer(fileData);
            }
        }
    },
    _loadResource : function( callback ){
        if( !window.XLSX || !window.xlsxUtils ){
            var uri = "../x_component_Template/framework/xlsx/xlsx.full.js";
            var uri2 = "../x_component_Template/framework/xlsx/xlsxUtils.js";
            COMMON.AjaxModule.load(uri, function(){
                COMMON.AjaxModule.load(uri2, function(){
                    callback();
                }.bind(this))
            }.bind(this))
        }else{
            callback();
        }
    },
    _openDownloadDialog: function(url, saveName){
        /**
         * 通用的打开下载对话框方法，没有测试过具体兼容性
         * @param url 下载地址，也可以是一个blob对象，必选
         * @param saveName 保存文件名，可选
         */
        if( Browser.name !== 'ie' ){
            if(typeof url == 'object' && url instanceof Blob){
                url = URL.createObjectURL(url); // 创建blob地址
            }
            var aLink = document.createElement('a');
            aLink.href = url;
            aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
            var event;
            if(window.MouseEvent && typeOf( window.MouseEvent ) == "function" ) event = new MouseEvent('click');
            else
            {
                event = document.createEvent('MouseEvents');
                event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            }
            aLink.dispatchEvent(event);
        }else{
            window.navigator.msSaveBlob( url, saveName);
        }
    },

    index2ColName : function( index ){
        if (index < 0) {
            return null;
        }
        var num = 65;// A的Unicode码
        var colName = "";
        do {
            if (colName.length > 0)index--;
            var remainder = index % 26;
            colName =  String.fromCharCode(remainder + num) + colName;
            index = (index - remainder) / 26;
        } while (index > 0);
        return colName;
    },

    upload : function ( dateColIndexArray, callback ) {
        var dateColArray = [];
        dateColIndexArray.each( function (idx) {
            dateColArray.push( this.index2ColName( idx ));
        }.bind(this))


        var uploadFileAreaNode = new Element("div");
        var html = "<input name=\"file\" type=\"file\" accept=\"csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel\" />";
        uploadFileAreaNode.set("html", html);

        var fileUploadNode = uploadFileAreaNode.getFirst();
        fileUploadNode.addEvent("change", function () {
            var files = fileNode.files;
            if (files.length) {
                var file = files.item(0);
                // if( file.name.indexOf(" ") > -1 ){
                // 	this.form.notice( MWF.xApplication.process.Xform.LP.uploadedFilesCannotHaveSpaces, "error");
                // 	return false;
                // }

                //第三个参数是日期的列
                this.importFromExcel( file, function(json){
                    //json为导入的结果
                    if(callback)callback(json);
                    uploadFileAreaNode.destroy();
                }.bind(this), dateColArray ); //["E","F"]

            }
        }.bind(this));
        var fileNode = uploadFileAreaNode.getFirst();
        fileNode.click();
    },
    exportToExcel : function(array, fileName, colWidthArr, dateIndexArray, numberIndexArray){
        debugger;
        // var array = [["姓名","性别","学历","专业","出生日期","毕业日期"]];
        // array.push([ "张三","男","大学本科","计算机","2001-1-2","2019-9-2" ]);
        // array.push([ "李四","男","大学专科","数学","1998-1-2","2018-9-2" ]);
        // this.exportToExcel(array, "导出数据"+(new Date).format("db"));
        this._loadResource( function(){
            var data = window.xlsxUtils.format2Sheet(array, 0, 0, null);//偏移3行按keyMap顺序转换
            var wb = window.xlsxUtils.format2WB(data, "sheet1", undefined);
            var wopts = { bookType: 'xlsx', bookSST: false, type: 'binary' };
            debugger;
            var dataInfo = wb.Sheets[wb.SheetNames[0]];

            var widthArray = [];
            array[0].each( function( v, i ){ //设置标题行样式

                if( !colWidthArr )widthArray.push( {wpx: 100} );

                // var at = String.fromCharCode(97 + i).toUpperCase();
                var at = this.index2ColName(i);
                var di = dataInfo[at+"1"];
                // di.v = v;
                // di.t = "s";
                di.s = {  //设置副标题样式
                    font: {
                        //name: '宋体',
                        sz: 12,
                        color: {rgb: "#FFFF0000"},
                        bold: true,
                        italic: false,
                        underline: false
                    },
                    alignment: {
                        horizontal: "center" ,
                        vertical: "center"
                    }
                };
            }.bind(this));

            if( dateIndexArray && dateIndexArray.length ){
                dateIndexArray.each( function( value, index ){
                    dateIndexArray[ index ] = this.index2ColName(value);
                }.bind(this))
            }

            if( numberIndexArray && numberIndexArray.length ){
                numberIndexArray.each( function( value, index ){
                    numberIndexArray[ index ] = this.index2ColName(value);
                }.bind(this))
            }

            var typeFlag = ( dateIndexArray && dateIndexArray.length ) || ( numberIndexArray && numberIndexArray.length );

            for( var key in dataInfo ){
                //设置所有样式，wrapText=true 后 /n会被换行
                if( key.substr(0, 1) !== "!" ){
                    var di = dataInfo[key];
                    if( !di.s )di.s = {};
                    if( !di.s.alignment )di.s.alignment = {};
                    di.s.alignment.wrapText = true;

                    if( typeFlag ){

                        var colName = key.replace(/\d+/g,''); //清除数字
                        var rowNum = key.replace( colName, '');

                        if( rowNum > 1 ){
                            if( dateIndexArray && dateIndexArray.length && dateIndexArray.contains( colName ) ){
                                //di.s.numFmt = "yyyy-mm-dd HH:MM:SS"; //日期列 两种方式都可以
                                di.z = 'yyyy-mm-dd HH:MM:SS'; //日期列
                            }
                            if( numberIndexArray && numberIndexArray.length && numberIndexArray.contains( colName ) ){
                                di.s.alignment.wrapText = false;
                                di.t = 'n'; //数字类型
                            }
                        }

                    }
                }

            }

            if( colWidthArr ){
                colWidthArr.each( function (w) {
                    widthArray.push( {wpx: w} );
                })
            }
            dataInfo['!cols'] = widthArray; //列宽度

            this._openDownloadDialog(window.xlsxUtils.format2Blob(wb), fileName +".xlsx");
        }.bind(this))
    },
    importFromExcel : function( file, callback, dateColArray ){
        debugger;
        var _self = this;
        this._loadResource( function(){
            var reader = new FileReader();
            var workbook, data;
            reader.onload = function (e) {
                //var data = data.content;
                if (!e) {
                    data = reader.content;
                }else {
                    data = e.target.result;
                }
                workbook = window.XLSX.read(data, {
                    type:'binary',
                    cellText:false,
                    cellDates:true,
                    dateNF:'yyyy-mm-dd HH:mm:ss'
                });
                //wb.SheetNames[0]是获取Sheets中第一个Sheet的名字
                //wb.Sheets[Sheet名]获取第一个Sheet的数据
                var sheet = workbook.SheetNames[0];
                if (workbook.Sheets.hasOwnProperty(sheet)) {
                    var worksheet = workbook.Sheets[sheet];

                    // if( dateColArray && typeOf(dateColArray) == "array" && dateColArray.length ){
                    //     var rowCount;
                    //     if( worksheet['!range'] ){
                    //         rowCount = worksheet['!range'].e.r;
                    //     }else{
                    //         var ref = worksheet['!ref'];
                    //         var arr = ref.split(":");
                    //         if(arr.length === 2){
                    //             rowCount = parseInt( arr[1].replace(/[^0-9]/ig,"") );
                    //         }
                    //     }
                    //     if( rowCount ){
                    //         for( var i=0; i<dateColArray.length; i++ ){
                    //             for( var j=1; j<=rowCount; j++ ){
                    //                 var cell = worksheet[ dateColArray[i]+j ];
                    //                 if( cell ){
                    //                     delete cell.w; // remove old formatted text
                    //                     cell.z = 'yyyy-mm-dd'; // set cell format
                    //                     window.XLSX.utils.format_cell(cell); // this refreshes the formatted text.
                    //                 }
                    //             }
                    //         }
                    //     }
                    // }

                    var opt = _self.sheet2JsonOptions;
                    opt.raw = false;
                    opt.dateNF = 'yyyy-mm-dd HH:mm:ss'; //'yyyy-mm-dd';

                    var json = window.XLSX.utils.sheet_to_json( worksheet, opt );
                    if(callback)callback(json);
                    // break; // 如果只取第一张表，就取消注释这行
                }
            };
            reader.readAsBinaryString(file);
        })
    }
});