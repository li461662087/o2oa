MWF.require("MWF.widget.UUID", null, false);
MWF.xDesktop.requireApp("Template", "MForm", null, false);
MWF.xDesktop.requireApp("Template", "MPopupForm", null, false);
MWF.xApplication.IMV2 = MWF.xApplication.IMV2 || {};
MWF.xApplication.IMV2.options.multitask = true; //多窗口
MWF.xApplication.IMV2.Main = new Class({
	Extends: MWF.xApplication.Common.Main,
	Implements: [Options, Events],

	options: {
		"style": "default",
		"name": "IMV2",
		"mvcStyle": "style.css",
		"icon": "icon.png",
		"width": "1024",
		"height": "768",
		"isResize": true,
		"isMax": true,
		"title": MWF.xApplication.IMV2.LP.title,
		"conversationId": "", // 传入的当前会话id
		"mode": "default" // 展现模式：default onlyChat 。 onlyChat的模式需要传入conversationId 会打开这个会话的聊天窗口并隐藏左边的会话列表
	},
	onQueryLoad: function () {
		this.lp = MWF.xApplication.IMV2.LP;
		this.app = this;
		this.conversationNodeItemList = [];
		this.messageList = [];
		this.emojiList = [];
		//添加87个表情
		for (var i = 1; i < 88; i++) {
			var emoji = {
				"key": i > 9 ? "[" + i + "]" : "[0" + i + "]",
				"path": i > 9 ? "/x_component_IMV2/$Main/emotions/im_emotion_" + i + ".png" : "/x_component_IMV2/$Main/emotions/im_emotion_0" + i + ".png",
			};
			this.emojiList.push(emoji);
		}
		
		if (!this.status) {
			this.conversationId = this.options.conversationId || "";
			this.mode = this.options.mode || "default";
		} else {
			this.conversationId = this.status.conversationId || "";
			this.mode = this.status.mode || "default";
		}

	},
	// 刷新的时候缓存数据
	recordStatus: function(){
		return {"conversationId": this.conversationId, "mode": this.mode};
	},
	onQueryClose: function () {
		this.closeListening();
	},
	// 获取组件名称
	loadComponentName: function () {
		o2.Actions.load("x_component_assemble_control").ComponentAction.get("IMV2", function (json) {
			var imComponent = json.data;
			if (imComponent && imComponent.title) {
				this.setTitle(imComponent.title);
			}
		}.bind(this), function (err) {
			console.log(err);
		})
	},
	// 加载应用
	loadApplication: function (callback) {
		// 判断xadmin 打开聊天功能
		if (layout.session.user && layout.session.user.name == "xadmin") {
			console.log("xadmin can not open IMV2");
			this.app.notice(this.lp.messageXadminNotSupport, "error");
			return;
		}
		// 先加载配置文件 放入imConfig对象
		MWF.xDesktop.loadConfig(function () {
			this.imConfig = layout.config.imConfig || {}
			var url = this.path + this.options.style + "/im.html";
			this.content.loadHtml(url, { "bind": { "lp": this.lp, "data": {} }, "module": this }, function () {
				//设置content
				this.app.content = this.o2ImMainNode;
				//启动监听
				this.startListening();
				// 处理窗口模式
				if (this.mode === "onlyChat" && this.conversationId != "") {
					this.o2ConversationListNode.setStyle("display", "none");
					this.chatNode.setStyle("margin-left", "2px");
				} else {
					this.o2ConversationListNode.setStyle("display", "flex");
					this.chatNode.setStyle("margin-left", "259px");
				}

				//获取会话列表
				this.conversationNodeItemList = [];
				o2.Actions.load("x_message_assemble_communicate").ImAction.myConversationList(function (json) {
					if (json.data && json.data instanceof Array) {
						this.loadConversationList(json.data);
					}
				}.bind(this));
				// 管理员可见设置按钮
				if (MWF.AC.isAdministrator()) {
					this.o2ImAdminSettingNode.setStyle("display", "block");
				} else {
					this.o2ImAdminSettingNode.setStyle("display", "none");
				}
			}.bind(this));
		}.bind(this));
		
		this.loadComponentName();
	},
	// 监听ws消息
	startListening: function () {
		if (layout.desktop && layout.desktop.message) {
			this.messageNumber = layout.desktop.message.items.length;
			//查询ws消息 如果增加
			if (this.listener) {
				clearInterval(this.listener);
			}
			this.listener = setInterval(function () {
				var newNumber = layout.desktop.message.items.length;
				//判断是否有新的ws消息
				if (newNumber > this.messageNumber) {
					this.reciveNewMessage();
					this.messageNumber = newNumber;
				}
			}.bind(this), 1000);
		}
	},
	// 关闭监听
	closeListening: function () {
		if (this.listener) {
			clearInterval(this.listener);
		}
	},
	// 接收新的消息 会话列表更新 或者 聊天窗口更新
	reciveNewMessage: function () {
		//查询会话数据
		this._checkConversationMessage();
		//查询聊天数据
		if (this.chatNodeBox) {
			this.chatNodeBox._checkNewMessage();
		}
		
	},
	//加载会话列表
	loadConversationList: function (list) {
		for (var i = 0; i < list.length; i++) {
			var chat = list[i];
			var itemNode = this._createConvItemNode(chat);
			this.conversationNodeItemList.push(itemNode);
			if (this.conversationId && this.conversationId == chat.id) {
				this.tapConv(chat);
			}
		}
	},
	
	// 点击设置按钮
	tapOpenSettings: function() {
		this.openSettingsDialog();
	},
	// 打开IM配置文件
	openSettingsDialog: function () {
		var settingNode = new Element("div", {"style":"padding:10px;background-color:#fff;"});

		var lineNode = new Element("div", {"style":"height:24px;line-height: 24px;", "text": this.lp.settingsClearMsg}).inject(settingNode);
		var isClearEnableNode = new Element("input", {"type":"checkbox", "checked": this.imConfig.enableClearMsg || false, "name": "clearEnable"}).inject(lineNode);

		var line2Node = new Element("div", {"style":"height:24px;line-height: 24px;", "text": this.lp.settingsRevokeMsg}).inject(settingNode);
		var isRevokeEnableNode = new Element("input", {"type":"checkbox", "checked": this.imConfig.enableRevokeMsg || false, "name": "revokeEnable"}).inject(line2Node);

		var dlg = o2.DL.open({
				"title": this.lp.setting,
				"mask": true,
				"height": "200",
				"content": settingNode,
				"onQueryClose": function () {
					settingNode.destroy();
				}.bind(this),
				"buttonList": [
					{
						"type": "ok",
						"text": this.lp.ok,
						"action": function () { 
							this.imConfig.enableClearMsg = isClearEnableNode.get("checked");
							this.imConfig.enableRevokeMsg = isRevokeEnableNode.get("checked");
							this.postIMConfig(this.imConfig);
							// 保存配置文件
							dlg.close(); 
						}.bind(this)
					},
					{
							"type": "cancel",
							"text": this.lp.close,
							"action": function () { dlg.close(); }
					}
				],
				"onPostShow": function () {
						dlg.reCenter();
				}.bind(this),
				"onPostClose": function(){
					dlg = null;
				}.bind(this)
		});
	},
	// 保存IM配置文件
	postIMConfig: function (imConfig) {
		o2.Actions.load("x_message_assemble_communicate").ImAction.config(imConfig, function (json) {
			this.refresh();//重新加载整个IM应用
		}.bind(this), function (error) {
			console.log(error);
			this.app.notice(error, "error", this.app.content);
		}.bind(this));
	},
	//点击会话
	tapConv: function (conv) {
		this._setCheckNode(conv);
		this.conversationId = conv.id;
		// new ChatNodeBox
		this.chatNodeBox = new MWF.xApplication.IMV2.ChatNodeBox(conv, this);
	},
	
	//点击创建单聊按钮
	tapCreateSingleConv: function () {
		// var form = new MWF.xApplication.IMV2.SingleForm(this, {}, {}, { app: this.app });
		// form.create()
		var form = new MWF.xApplication.IMV2.CreateConversationForm(this, {}, { "title": this.lp.createSingle, "personCount": 1 }, { app: this.app });
		form.create()
	},
	//点击创建群聊按钮
	tapCreateGroupConv: function () {
		var form = new MWF.xApplication.IMV2.CreateConversationForm(this, {}, { "title": this.lp.createGroup, "personCount": 0, "personSelected": [] }, { app: this.app });
		form.create()
	},
	//更新群名
	updateConversationTitle: function (title, convId) {
		var conv = {
			id: convId,
			title: title,
		};
		var _self = this;
		o2.Actions.load("x_message_assemble_communicate").ImAction.update(conv, function (json) {
			var newConv = json.data;
			//点击会话 刷新聊天界面
			// _self.tapConv(newConv);
			// //刷新会话列表的title
			// for (var i = 0; i < this.conversationNodeItemList.length; i++) {
			// 	var cv = this.conversationNodeItemList[i];
			// 	if (cv.data.id == convId) {
			// 		//刷新
			// 		cv.refreshConvTitle(title);
			// 	}
			// }
			// 列表上的数据也要刷新
			_self.reciveNewMessage();

		}.bind(this), function (error) {
			console.log(error);
		}.bind(this))
	},
	//更新群成员
	updateConversationMembers: function (members, convId) {
		var conv = {
			id: convId,
			personList: members,
		};
		var _self = this;
		o2.Actions.load("x_message_assemble_communicate").ImAction.update(conv, function (json) {
			var newConv = json.data;
			//_self.tapConv(newConv);
			// 列表上的数据也要刷新
			_self.reciveNewMessage();
		}.bind(this), function (error) {
			console.log(error);
		}.bind(this))
	},
	/**
	 * 	创建会话
	 * @param {*} persons 人员列表
	 * @param {*} cType 会话类型 "single" "group"
	 */
	newConversation: function (persons, cType) {
		var conv = {
			type: cType,
			personList: persons,
		};
		var _self = this;
		o2.Actions.load("x_message_assemble_communicate").ImAction.create(conv, function (json) {
			var newConv = json.data;
			var isOld = false;
			for (var i = 0; i < _self.conversationNodeItemList.length; i++) {
				var c = _self.conversationNodeItemList[i];
				if (newConv.id == c.data.id) {
					isOld = true;
					_self.tapConv(c);
				}
			}
			if (!isOld) {
				var itemNode = _self._createConvItemNode(newConv);
				_self.conversationNodeItemList.push(itemNode);
				_self.tapConv(newConv);
			}
		}.bind(this), function (error) {
			console.log(error);
		}.bind(this))
	},
	//创建会话ItemNode
	_createConvItemNode: function (conv) {
		return new MWF.xApplication.IMV2.ConversationItem(conv, this);
	},
	//会话ItemNode 点击背景色
	_setCheckNode: function (conv) {
		for (var i = 0; i < this.conversationNodeItemList.length; i++) {
			var item = this.conversationNodeItemList[i];
			if (item.data.id == conv.id) {
				item.addCheckClass();
			} else {
				item.removeCheckClass();
			}
		}
	},
	
	//刷新会话Item里面的最后消息内容
	_refreshConvMessage: function (msg) {
		for (var i = 0; i < this.conversationNodeItemList.length; i++) {
			var node = this.conversationNodeItemList[i];
			if (node.data.id == this.conversationId) {
				node.refreshLastMsg(msg);
			}
		}
	},
	//检查会话列表是否有更新
	_checkConversationMessage: function () {
		o2.Actions.load("x_message_assemble_communicate").ImAction.myConversationList(function (json) {
			if (json.data && json.data instanceof Array) {
				var newConList = json.data;
				for (var j = 0; j < newConList.length; j++) {
					var nCv = newConList[j];
					var isNew = true;
					for (var i = 0; i < this.conversationNodeItemList.length; i++) {
						var cv = this.conversationNodeItemList[i];
						if (cv.data.id == nCv.id) {
							isNew = false;
							//刷新
							cv.refreshLastMsg(nCv.lastMessage);
							cv.refreshData(nCv);
							if (this.conversationId === nCv.id) {
								this.tapConv(nCv);
							}
						}
					}
					//新会话 创建
					if (isNew) {
						var itemNode = this._createConvItemNode(nCv);
						this.conversationNodeItemList.push(itemNode);
					}
				}
				//this.loadConversationList(json.data);
			}
		}.bind(this));
	},

	//用户头像
	_getIcon: function (id) {
		var orgAction = MWF.Actions.get("x_organization_assemble_control")
		var url = (id) ? orgAction.getPersonIcon(id) : "../x_component_IMV2/$Main/default/icons/group.png";
		return url + "?" + (new Date().getTime());
	},
	
	//输出特殊的时间格式
	_friendlyTime: function (date) {
		var day = date.getDate();
		var monthIndex = date.getMonth();
		var year = date.getFullYear();
		var time = date.getTime();
		var today = new Date();
		var todayDay = today.getDate();
		var todayMonthIndex = today.getMonth();
		var todayYear = today.getFullYear();
		var todayTime = today.getTime();

		var retTime = "";
		//同一天
		if (day === todayDay && monthIndex === todayMonthIndex && year === todayYear) {
			var hour = 0;
			if (todayTime > time) {
				hour = parseInt((todayTime - time) / 3600000);
				if (hour == 0) {
					retTime = Math.max(parseInt((todayTime - time) / 60000), 1) + this.lp.minutesBefore
				} else {
					retTime = hour + this.lp.hoursBefore
				}

			}
			return retTime;
		}
		var dates = parseInt(time / 86400000);
		var todaydates = parseInt(todayTime / 86400000);
		if (todaydates > dates) {
			var days = (todaydates - dates);
			if (days == 1) {
				retTime = this.lp.yesterday;
			} else if (days == 2) {
				retTime = this.lp.beforeYesterday;
			} else if (days > 2 && days < 31) {
				retTime = days + this.lp.daysBefore;
			} else if (days >= 31 && days <= 2 * 31) {
				retTime = this.lp.monthAgo;
			} else if (days > 2 * 31 && days <= 3 * 31) {
				retTime = this.lp.towMonthAgo;
			} else if (days > 3 * 31 && days <= 4 * 31) {
				retTime = this.lp.threeMonthAgo;
			} else {
				retTime = this._formatDate(date);
			}
		}

		return retTime;

	},


	//yyyy-MM-dd
	_formatDate: function (date) {
		var month = date.getMonth() + 1;
		var day = date.getDate();
		month = (month.toString().length == 1) ? ("0" + month) : month;
		day = (day.toString().length == 1) ? ("0" + day) : day;
		return date.getFullYear() + '-' + month + '-' + day;
	}

});

// 聊天窗口
MWF.xApplication.IMV2.ChatNodeBox = new Class({
	initialize: function (data, main) {
		this.data = data;
		this.main = main;
		this.container = this.main.chatNode;
		this.lp = this.main.lp;
		this.path = this.main.path;
		this.options = this.main.options;
		this.pageSize = 20;
		this.page = 1;
		this.isLoading = false; // 正在加载
		this.hasMoreMsgData = false; // 是否还有更多的消息 翻页
		this.load();
	},
	// 创建聊天窗口
	load: function() {
			var url = this.path + this.options.style + "/chat.html";
			this.conversationId = this.data.id;
			this.container.empty();
			if (this.emojiBoxNode) {
				this.emojiBoxNode.destroy();
				this.emojiBoxNode = null;
			}
			this.container.loadHtml(url, { "bind": { "convName": this.data.title, "lp": this.lp }, "module": this }, function () {
				var me = layout.session.user.distinguishedName;
				if (this.data.type === "group" && me === this.data.adminPerson) {
					this.chatTitleMoreBtnNode.setStyle("display", "block");
					this.chatTitleMoreBtnNode.addEvents({
						"click": function (e) {
							var display = this.chatTitleMoreMenuNode.getStyle("display");
							if (display === "none") {
								this.chatTitleMoreMenuNode.setStyle("display", "block");
								this.chatTitleMoreMenuItem1Node.setStyle("display", "block");
								this.chatTitleMoreMenuItem2Node.setStyle("display", "block");
								if (this.main.imConfig.enableClearMsg) {
									this.chatTitleMoreMenuItem3Node.setStyle("display", "block");
								} else {
									this.chatTitleMoreMenuItem3Node.setStyle("display", "none");
								}
							} else {
								this.chatTitleMoreMenuNode.setStyle("display", "none");
							}
						}.bind(this)
					});
				} else if (this.data.type !== "group") {
					if (this.main.imConfig.enableClearMsg) {
						this.chatTitleMoreBtnNode.setStyle("display", "block");
						this.chatTitleMoreBtnNode.addEvents({
							"click": function (e) {
								var display = this.chatTitleMoreMenuNode.getStyle("display");
								if (display === "none") {
									this.chatTitleMoreMenuNode.setStyle("display", "block");
									this.chatTitleMoreMenuItem1Node.setStyle("display", "none");
									this.chatTitleMoreMenuItem2Node.setStyle("display", "none");
									this.chatTitleMoreMenuItem3Node.setStyle("display", "block");
								} else {
									this.chatTitleMoreMenuNode.setStyle("display", "none");
								}
							}.bind(this)
						});
					} else {
						this.chatTitleMoreBtnNode.setStyle("display", "none");
					}
				}
				//获取聊天信息
				this.page = 1;
				this.loadMsgListByPage();
				var scrollFx = new Fx.Scroll(this.chatContentNode);
				scrollFx.toBottom();
				// 绑定事件
				this.chatBottomAreaTextareaNode.addEvents({
					"keyup": function (e) {
						// debugger;
						if (e.code === 13) {
							if (e.control === true) {
								var text = this.chatBottomAreaTextareaNode.value;
								this.chatBottomAreaTextareaNode.value = text + "\n";
							} else {
								this.sendMsg();
							}
							e.stopPropagation();
						}
					}.bind(this)
				});
				// 绑定时间
				this.chatContentNode.addEvents({
					"scroll": function(e) {
							//滑到顶部时触发下次数据加载
						if (this.chatContentNode.scrollTop == 0) {
							if (this.hasMoreMsgData) { // 有更多数据
								// 间隔1秒 防止频繁
								setTimeout(() => {
											//将scrollTop置为10以便下次滑到顶部
											this.chatContentNode.scrollTop = 10;
											//加载数据
											this.loadMoreMsgList();
								}, 1000);
							}
						}
					}.bind(this)
				});
				// 显示业务图标
				this.loadBusinessIcon();
			}.bind(this));

	},
	// 如果有业务数据 头部展现应用图标 可以点击打开
	loadBusinessIcon: function() {
		if (this.data.businessId && this.data.businessBody) {
			if (this.data.businessType && this.data.businessType === "process") {
				var work = JSON.parse(this.data.businessBody);
				var applicationId = work.application;
				this.chatTitleBusinessBtnNode.setStyles({"background-image": "url(../x_component_process_ApplicationExplorer/$Main/default/icon/application.png)", "display":"block"});
				this.chatTitleBusinessBtnNode.store("work", work);
				this.chatTitleBusinessBtnNode.addEvent("click", function(e) {
					this.loadProcessWork(e.target.retrieve("work"));
					e.preventDefault();
				}.bind(this));
				o2.Actions.load("x_processplatform_assemble_surface").ApplicationAction.getIcon(applicationId, function(json) {
					if (json.data && json.data.icon) {
						this.chatTitleBusinessBtnNode.setStyles({"background-image": "url(data:image/png;base64," + json.data.icon + ")", "display":"block"});
					}
				}.bind(this));
			}
		}
	},
	// 获取工作对象
	loadProcessWork(work) {
		if (work && work.job) {
			o2.Actions.load("x_processplatform_assemble_surface").JobAction.findWorkWorkCompleted(work.job, function(json){
				if (json.data ) {
					var workList = [];
					if (json.data.workList && json.data.workList.length > 0) {
						workList = json.data.workList
					}
					var workCompletedList = [];
					if (json.data.workCompletedList && json.data.workCompletedList.length > 0) {
						workCompletedList = json.data.workCompletedList
					}
					this.showProcessWorkDialog(workList, workCompletedList);
				}
			}.bind(this), function(error){
				console.log(error);
			}.bind(this));
		}
	},
	// 打开关联工作
	showProcessWorkDialog: function(workList, workCompletedList) {
		if (workList.length > 0 || workCompletedList.length > 0) {
			var url = this.path + this.options.style + "/chooseBusinessWork.html";
			this.container.loadHtml(url, { "bind": { "lp": this.lp }, "module": this }, function(){
				// 工作展现
				if (workList.length > 0) {
					for (let index = 0; index < workList.length; index++) {
						const work = workList[index];
						var workItemNode = new Element("div", {"class":"business-work-item"}).inject(this.businessWorkListNode);
						var workProcessNameNode = new Element("div", {"style":"flex: 1;"}).inject(workItemNode);
						var title = work.title
						if (title === "") {
							title = this.lp.noTitle
						}
						workProcessNameNode.set("text", "【"+work.processName+"】" + title);
						var openBtnNode = new Element("div", {"class":"business-work-item-btn"}).inject(workItemNode);
						openBtnNode.store("work", work);
						openBtnNode.set("text", this.lp.open);
						openBtnNode.addEvents({
							"click": function(e) {
								var thisWork = e.target.retrieve("work");
								if (thisWork) {
									var opotions = {
										"workId": thisWork.id,
									}
									layout.openApplication(null, "process.Work", opotions);
								}
								this.closeProcessWorkDialog();
								e.preventDefault();
							}.bind(this)
						})
					}
				}
				if (workCompletedList.length > 0) {
					for (let index = 0; index < workCompletedList.length; index++) {
						const workCompleted = workCompletedList[index];
						var workItemNode = new Element("div", {"class":"business-work-item"}).inject(this.businessWorkListNode);
						var workProcessNameNode = new Element("div", {"style":"flex: 1;"}).inject(workItemNode);
						var title = workCompleted.title
						if (title === "") {
							title = this.lp.noTitle
						}
						workProcessNameNode.set("text", "【"+workCompleted.processName+"】" + title);
						var openBtnNode = new Element("div", {"class":"business-work-item-btn"}).inject(workItemNode);
						openBtnNode.store("work", workCompleted);
						openBtnNode.set("text", this.lp.open);
						openBtnNode.addEvents({
							"click": function(e) {
								var thisWork = e.target.retrieve("work");
								if (thisWork) {
									var opotions = {
										"workCompletedId": thisWork.id,
									}
									layout.openApplication(null, "process.Work", opotions);
								}
								this.closeProcessWorkDialog();
								e.preventDefault();
							}.bind(this)
						})
					}
				}
			

				// 关闭
				this.businessWorkChooseCloseBtnNode.addEvents({
					"click": function(e) {
						this.closeProcessWorkDialog();
						e.preventDefault();
					}.bind(this)
				})
			}.bind(this));
		}
	},
	// 
	closeProcessWorkDialog: function() {
		if (this.businessWorkChooseDialogNode) {
			this.businessWorkChooseDialogNode.destroy();
			this.businessWorkChooseDialogNode = null;
		}
	},

	//检查是否有新消息
	_checkNewMessage: function () {
		if (this.conversationId && this.conversationId != "") {//是否有会话窗口
			var data = { "conversationId": this.conversationId };
			o2.Actions.load("x_message_assemble_communicate").ImAction.msgListByPaging(1, 10, data, function (json) {
				var list = json.data;
				if (list && list.length > 0) {
					var msg = list[0];
					//检查聊天框是否有变化
					if (this.conversationId == msg.conversationId) {
						for (var i = 0; i < list.length; i++) {
							var isnew = true;
							var m = list[i];
							for (var j = 0; j < this.messageList.length; j++) {
								if (this.messageList[j].id == m.id) {
									isnew = false;
								}
							}
							if (isnew) {
								this.messageList.push(m);
								this._buildMsgNode(m, false);
								// this._refreshConvMessage(m);
							}
						}
					}
				}

			}.bind(this), function (error) {
				console.log(error);
			}.bind(this), false);
		}
	},

	// 加载更多
	loadMoreMsgList: function() {
		this.page += 1;
		this.loadMsgListByPage();
	},

	//分页获取会话的消息列表数据
	loadMsgListByPage: function () {
		if (this.isLoading) {
			console.log("正在加载中。。。。。。");
			return ;
		}
		var data = { "conversationId": this.conversationId };
		this.isLoading = true;
		if (this.page === 1) {
			this.messageList = [];
		}
		o2.Actions.load("x_message_assemble_communicate").ImAction.msgListByPaging(this.page, this.pageSize, data, function (json) {
			var list = json.data;
			var size = 0;
			if (list && list.length > 0) {
				size = list.length;
					for (var i = 0; i < list.length; i++) {
						if (this.page == 1) {
							this.messageList.push(list[i]);
						} else {
							this.messageList.unshift(list[i]);
						}
						this._buildMsgNode(list[i], true);
					} 
			}
			this.isLoading = false;
			if (size < this.pageSize) { // 没有更多数据了
				this.noMoreDataNode = new Element("div", {"class": "chat-no-more-data"}).inject(this.chatContentNode, "top");
				this.noMoreDataNode.set("text", this.lp.msgLoadNoMoreData);
				this.hasMoreMsgData = false;
			} else {
				if (this.noMoreDataNode) {
					this.noMoreDataNode.destroy();
					this.noMoreDataNode = null;
				}
				this.hasMoreMsgData = true;
			}
		}.bind(this), function (error) {
			console.log(error);
			this.isLoading = false;
		}.bind(this), false);
	},


	//修改群名
	tapUpdateConvTitle: function () {
		this.chatTitleMoreMenuNode.setStyle("display", "none");
		var title = "";
		for (var i = 0; i < this.main.conversationNodeItemList.length; i++) {
			var c = this.main.conversationNodeItemList[i];
			if (this.conversationId == c.data.id) {
				title = c.data.title;
			}
		}
		var form = new MWF.xApplication.IMV2.UpdateConvTitleForm(this.main, {}, {"defaultValue": title}, { app: this.main.app });
		form.create();
	},
	//修改群成员
	tapUpdateConvMembers: function () {
		this.chatTitleMoreMenuNode.setStyle("display", "none");
		var members = [];
		for (var i = 0; i < this.main.conversationNodeItemList.length; i++) {
			var c = this.main.conversationNodeItemList[i];
			if (this.conversationId == c.data.id) {
				members = c.data.personList;
			}
		}
		var form = new MWF.xApplication.IMV2.CreateConversationForm(this.main, {}, { "title": this.lp.modifyMember, "personCount": 0, "personSelected": members, "isUpdateMember": true }, { app: this.main.app });
		form.create()
	},
	// 点击菜单 清空聊天记录
	tapClearMsg: function(e) {
		var _self = this;
		MWF.xDesktop.confirm("info", this.chatTitleNode, this.lp.alert, this.lp.messageClearAllMsgAlert, 400, 150, function() {
			o2.Actions.load("x_message_assemble_communicate").ImAction.clearConversationMsg(_self.conversationId, function (json) {
				_self._reclickConv();
			}, function (error) {
				console.log(error);
				_self.app.notice(error, "error", _self.app.content);
			});
			this.close();
		}, function(){
			this.close();
		}, null, null, "o2");
	},

		//点击表情按钮
		showEmojiBox: function () {
			if (!this.emojiBoxNode) {
				this.emojiBoxNode = new Element("div", { "class": "chat-emoji-box" }).inject(this.container);
				var _self = this;
				for (var i = 0; i < this.main.emojiList.length; i++) {
					var emoji = this.main.emojiList[i];
					var emojiNode = new Element("img", { "src": emoji.path, "class": "chat-emoji-img" }).inject(this.emojiBoxNode);
					emojiNode.addEvents({
						"mousedown": function (ev) {
							_self.sendEmojiMsg(this.emoji);
							_self.hideEmojiBox();
						}.bind({ emoji: emoji })
					});
				}
			}
			this.emojiBoxNode.setStyle("display", "block");
			this.hideFun = this.hideEmojiBox.bind(this);
			document.body.addEvent("mousedown", this.hideFun);
		},

	_reclickConv: function() {
		for (var i = 0; i < this.main.conversationNodeItemList.length; i++) {
			var c = this.main.conversationNodeItemList[i];
			if (this.conversationId == c.data.id) {
				this.main.tapConv(c.data);
			}
		}
	},

	//创建图片或文件消息
	_newImageOrFileMsgAndSend: function (type, fileId, fileName, fileExt) {
		var distinguishedName = layout.session.user.distinguishedName;
		var time = this._currentTime();
		var body = {
			"body": this.lp.file,
			"type": type,
			"fileId": fileId,
			"fileExtension": fileExt,
			"fileName": fileName
		};
		var bodyJson = JSON.stringify(body);
		var uuid = (new MWF.widget.UUID).toString();
		var message = {
			"id": uuid,
			"conversationId": this.conversationId,
			"body": bodyJson,
			"createPerson": distinguishedName,
			"createTime": time,
			"sendStatus": 1
		};
		o2.Actions.load("x_message_assemble_communicate").ImAction.msgCreate(message,
			function (json) {
				console.log(this.lp.sendSuccess);
			}.bind(this),
			function (error) {
				console.log(error);
			}.bind(this));
		this.messageList.push(message);
		this._buildReceiver(body, distinguishedName, false, message);
		this.main._refreshConvMessage(message);
	},
	//创建文本消息 并发送
	_newAndSendTextMsg: function (text, type) {
		var distinguishedName = layout.session.user.distinguishedName;
		var time = this._currentTime();
		var body = { "body": text, "type": type };
		var bodyJson = JSON.stringify(body);
		var uuid = (new MWF.widget.UUID).toString();
		var textMessage = {
			"id": uuid,
			"conversationId": this.conversationId,
			"body": bodyJson,
			"createPerson": distinguishedName,
			"createTime": time,
			"sendStatus": 1
		};
		o2.Actions.load("x_message_assemble_communicate").ImAction.msgCreate(textMessage,
			function (json) {
				//data = json.data;
				console.log(this.lp.sendSuccess);
			}.bind(this),
			function (error) {
				console.log(error);
			}.bind(this));
		this.messageList.push(textMessage);
		this._buildReceiver(body, distinguishedName, false, textMessage);
		this.main._refreshConvMessage(textMessage);
	},
	//点击发送消息
	sendMsg: function () {
		var text = this.chatBottomAreaTextareaNode.value;
		if (text) {
			this.chatBottomAreaTextareaNode.value = "";
			this._newAndSendTextMsg(text, "text");
		} else {
			console.log(this.lp.noMessage);
			this.app.notice(this.lp.noMessage, "error", this.app.content);
		}
	},

	// 点击发送文件消息
	showChooseFile: function () {
		if (!this.uploadFileAreaNode) {
			this.createUploadFileNode();
		}
		this.fileUploadNode.click();
	},
	//创建文件选择框
	createUploadFileNode: function () {
		this.uploadFileAreaNode = new Element("div");
		var html = "<input name=\"file\" type=\"file\" multiple/>";
		this.uploadFileAreaNode.set("html", html);
		this.fileUploadNode = this.uploadFileAreaNode.getFirst();
		this.fileUploadNode.addEvent("change", function () {
			var files = this.fileUploadNode.files;
			if (files.length) {
				var file = files.item(0);
				var formData = new FormData();
				formData.append('file', file);
				formData.append('fileName', file.name);
				var fileExt = file.name.substring(file.name.lastIndexOf("."));
				// 图片消息
				var type = "file"
				if (fileExt.toLowerCase() == ".bmp" || fileExt.toLowerCase() == ".jpeg"
					|| fileExt.toLowerCase() == ".png" || fileExt.toLowerCase() == ".jpg") {
					type = "image"
				} else { // 文件消息
					type = "file"
				}
				//上传文件
				o2.Actions.load("x_message_assemble_communicate").ImAction.uploadFile(this.conversationId, type, formData, "{}", function (json) {
					if (json.data) {
						var fileId = json.data.id
						var fileExtension = json.data.fileExtension
						var fileName = json.data.fileName
						this._newImageOrFileMsgAndSend(type, fileId, fileName, fileExtension)
					}
				}.bind(this), function (error) {
					console.log(error);
				}.bind(this))
			}
		}.bind(this));
	},
	hideEmojiBox: function () {
		//关闭emojiBoxNode
		this.emojiBoxNode.setStyle("display", "none");
		document.body.removeEvent("mousedown", this.hideFun);
	},
	//发送表情消息
	sendEmojiMsg: function (emoji) {
		this._newAndSendTextMsg(emoji.key, "emoji");
	},

	//创建消息html节点
	_buildMsgNode: function (msg, isTop) {
		var createPerson = msg.createPerson;
		var jsonbody = msg.body;
		var body = JSON.parse(jsonbody);
		var distinguishedName = layout.session.user.distinguishedName;
		if (createPerson != distinguishedName) {
			this._buildSender(body, createPerson, isTop, msg);
		} else {
			this._buildReceiver(body, createPerson, isTop, msg);
		}
	},
	/**
	 * 消息接收对象  
	 * 这里的方法名错了两者互换了无需理会
	 * @param  msgBody 消息体
	 * @param createPerson 消息人员
	 * @param isTop 是否放在顶部
	 * @param msg 消息对象
	 */
	 _buildSender: function (msgBody, createPerson, isTop, msg) {
		if (!isTop) { 
			// 添加消息时间
			this._buildMsgTime(isTop, msg);
		}
		var receiverBodyNode = new Element("div", { "class": "chat-sender", "id": msg.id}).inject(this.chatContentNode, isTop ? "top" : "bottom");
		this._addContextMenuEvent(receiverBodyNode, msg);
		var avatarNode = new Element("div").inject(receiverBodyNode);
		var avatarUrl = this.main._getIcon(createPerson);
		var name = createPerson;
		if (createPerson.indexOf("@") != -1) {
			name = name.substring(0, createPerson.indexOf("@"));
		}
		var avatarImg = new Element("img", { "src": avatarUrl }).inject(avatarNode);
		var nameNode = new Element("div", { "text": name }).inject(receiverBodyNode);
		var lastNode = new Element("div").inject(receiverBodyNode);
		var lastFirstNode = new Element("div", { "class": "chat-left_triangle" }).inject(lastNode);
		//text
		if (msgBody.type == "emoji") { // 表情
			var img = "";
			for (var i = 0; i < this.main.emojiList.length; i++) {
				if (msgBody.body == this.main.emojiList[i].key) {
					img = this.main.emojiList[i].path;
				}
			}
			new Element("img", { "src": img, "class": "chat-content-emoji" }).inject(lastNode);
		} else if (msgBody.type == "image") {//image
			var imgBox = new Element("div", { "class": "img-chat" }).inject(lastNode);
			var url = this._getFileUrlWithWH(msgBody.fileId, 144, 192);
			new Element("img", { "src": url }).inject(imgBox);
			imgBox.addEvents({
				"click": function (e) {
					var downloadUrl = this._getFileDownloadUrl(msgBody.fileId);
					window.open(downloadUrl);
				}.bind(this)
			});
		} else if (msgBody.type == "audio") {
			var url = this._getFileDownloadUrl(msgBody.fileId);
			new Element("audio", { "src": url, "controls": "controls", "preload": "preload" }).inject(lastNode);
		} else if (msgBody.type == "location") {
			var mapBox = new Element("span").inject(lastNode);
			new Element("img", { "src": "../x_component_IMV2/$Main/default/icons/location.png", "width": 24, "height": 24 }).inject(mapBox);
			var url = this._getBaiduMapUrl(msgBody.latitude, msgBody.longitude, msgBody.address, msgBody.addressDetail);
			new Element("a", { "href": url, "target": "_blank", "text": msgBody.address }).inject(mapBox);
		} else if (msgBody.type == "file") { //文件
			var mapBox = new Element("span").inject(lastNode);
			var fileIcon = this._getFileIcon(msgBody.fileExtension);
			new Element("img", { "src": "../x_component_IMV2/$Main/file_icons/" + fileIcon, "width": 48, "height": 48 }).inject(mapBox);
			var downloadUrl = this._getFileDownloadUrl(msgBody.fileId);
			new Element("a", { "href": downloadUrl, "target": "_blank", "text": msgBody.fileName }).inject(mapBox);
		} else {//text
			new Element("span", { "text": msgBody.body }).inject(lastNode);
		}
		if (isTop) {
			// 添加消息时间
			this._buildMsgTime(isTop, msg);
		}
		if (!isTop) {
			var scrollFx = new Fx.Scroll(this.chatContentNode);
			scrollFx.toBottom();
		}
	},
	/**
	 * 消息发送对象
	 * 这里的方法名错了两者互换了无需理会
	 * @param  msgBody 
	 * @param createPerson 消息人员
	 * @param isTop 是否放在顶部
	 * @param msg 消息对象
	 */
	_buildReceiver: function (msgBody, createPerson, isTop, msg) {
		if (!isTop) { 
			// 添加消息时间
			this._buildMsgTime(isTop, msg);
		}
		var receiverBodyNode = new Element("div", { "class": "chat-receiver", "id": msg.id}).inject(this.chatContentNode, isTop ? "top" : "bottom");
		this._addContextMenuEvent(receiverBodyNode, msg);
	
		var avatarNode = new Element("div").inject(receiverBodyNode);
		var avatarUrl = this.main._getIcon(createPerson);
		var name = createPerson;
		if (createPerson.indexOf("@") != -1) {
			name = name.substring(0, createPerson.indexOf("@"));
		}
		var avatarImg = new Element("img", { "src": avatarUrl }).inject(avatarNode);
		var nameNode = new Element("div", { "text": name }).inject(receiverBodyNode);
		var lastNode = new Element("div").inject(receiverBodyNode);
		var lastFirstNode = new Element("div", { "class": "chat-right_triangle" }).inject(lastNode);

		if (msgBody.type == "emoji") { // 表情
			var img = "";
			for (var i = 0; i < this.main.emojiList.length; i++) {
				if (msgBody.body == this.main.emojiList[i].key) {
					img = this.main.emojiList[i].path;
				}
			}
			new Element("img", { "src": img, "class": "chat-content-emoji" }).inject(lastNode);
		} else if (msgBody.type == "image") {//image
			var imgBox = new Element("div", { "class": "img-chat" }).inject(lastNode);
			var url = this._getFileUrlWithWH(msgBody.fileId, 144, 192);
			new Element("img", { "src": url }).inject(imgBox);
			imgBox.addEvents({
				"click": function (e) {
					var downloadUrl = this._getFileDownloadUrl(msgBody.fileId);
					window.open(downloadUrl);
				}.bind(this)
			});
		} else if (msgBody.type == "audio") {
			var url = this._getFileDownloadUrl(msgBody.fileId);
			new Element("audio", { "src": url, "controls": "controls", "preload": "preload" }).inject(lastNode);
		} else if (msgBody.type == "location") {
			var mapBox = new Element("span").inject(lastNode);
			new Element("img", { "src": "../x_component_IMV2/$Main/default/icons/location.png", "width": 24, "height": 24 }).inject(mapBox);
			var url = this._getBaiduMapUrl(msgBody.latitude, msgBody.longitude, msgBody.address, msgBody.addressDetail);
			new Element("a", { "href": url, "target": "_blank", "text": msgBody.address }).inject(mapBox);
		} else if (msgBody.type == "file") { //文件
			var mapBox = new Element("span").inject(lastNode);
			var fileIcon = this._getFileIcon(msgBody.fileExtension);
			new Element("img", { "src": "../x_component_IMV2/$Main/file_icons/" + fileIcon, "width": 48, "height": 48 }).inject(mapBox);
			var downloadUrl = this._getFileDownloadUrl(msgBody.fileId);
			new Element("a", { "href": downloadUrl, "target": "_blank", "text": msgBody.fileName }).inject(mapBox);
		} else {//text
			new Element("span", { "text": msgBody.body }).inject(lastNode);
		}
		if (isTop) {
			// 添加消息时间
			this._buildMsgTime(isTop, msg);
		}
		if (!isTop) {
			var scrollFx = new Fx.Scroll(this.chatContentNode);
			scrollFx.toBottom();
		}
	},

	// 消息体上是否显示消息时间
	_buildMsgTime: function(isTop, msg) {
		// var flag = false;
		// for (let index = 0; index < this.messageList.length; index++) {
		// 	const element = this.messageList[index];
		// 	if (element.id && element.id === msg.id) {
		// 		if (index > 0) {
		// 			const before = this.messageList[index-1];
		// 			var thisTime = o2.common.toDate(msg.createTime);
		// 			var beforeTime = o2.common.toDate(before.createTime);
		// 			var minu = ( beforeTime.getTime() - thisTime.getTime() ) / 1000 / 60 ;
		// 			if (minu > 1) { // 超过1分钟
		// 				flag = true;
		// 			}
		// 		} else {
		// 			flag = true;
		// 		}
		// 		break
		// 	}
		// }
		// if (flag ){
		// 	var timeNode = new Element("div", { "class": "chat-msg-time"}).inject(this.chatContentNode, isTop ? "top" : "bottom");
		// 	timeNode.set("text", this._msgShowTime(o2.common.toDate(msg.createTime)))
		// }
		
		var timeNode = new Element("div", { "class": "chat-msg-time"}).inject(this.chatContentNode, isTop ? "top" : "bottom");
		timeNode.set("text", this._msgShowTime(o2.common.toDate(msg.createTime)))
	},

	// 消息时间
	_msgShowTime: function (date) {
		var day = date.getDate();
		var monthIndex = date.getMonth();
		var year = date.getFullYear();
		var time = date.getTime();
		var today = new Date();
		var todayDay = today.getDate();
		var todayMonthIndex = today.getMonth();
		var todayYear = today.getFullYear();
		var todayTime = today.getTime();

		var retTime = "";
		//同一天
		if (day === todayDay && monthIndex === todayMonthIndex && year === todayYear) {
			var hour =  date.getHours() > 9 ? ""+date.getHours() : "0" + date.getHours();
			var minute =  date.getMinutes() > 9 ? ""+date.getMinutes() : "0" + date.getMinutes();
			retTime = hour + ":" +minute;
			return retTime;
		}
		var dates = parseInt(time / 86400000);
		var todaydates = parseInt(todayTime / 86400000);
		if (todaydates > dates) {
			var days = (todaydates - dates);
			if (days == 1) {
				var hour =  date.getHours() > 9 ? ""+date.getHours() : "0" + date.getHours();
				var minute =  date.getMinutes() > 9 ? ""+date.getMinutes() : "0" + date.getMinutes();
				retTime = this.lp.yesterday + " " +  hour + ":" +minute;
			} else if (days == 2) {
				var hour =  date.getHours() > 9 ? ""+date.getHours() : "0" + date.getHours();
				var minute =  date.getMinutes() > 9 ? ""+date.getMinutes() : "0" + date.getMinutes();
				retTime = this.lp.beforeYesterday + " " +  hour + ":" +minute;
			}else {
				var month = date.getMonth() + 1;
				var day = date.getDate();
				month = (month.toString().length == 1) ? ("0" + month) : month;
				day = (day.toString().length == 1) ? ("0" + day) : day;
				var hour =  date.getHours() > 9 ? ""+date.getHours() : "0" + date.getHours();
				var minute =  date.getMinutes() > 9 ? ""+date.getMinutes() : "0" + date.getMinutes();
				retTime = month + '-' + day + " " +  hour + ":" +minute;
			}
		}

		return retTime;

	},
	// 绑定右键事件
	_addContextMenuEvent: function(receiverBodyNode, msg) {
		receiverBodyNode.store("msg", msg);
		receiverBodyNode.addEvents({
			"contextmenu": function(e) {
				//取消默认的浏览器自带右键 很重要！！
				e.preventDefault();
				var menuleft=e.client.x+'px';
    		var menutop=e.client.y+'px';
				var m = receiverBodyNode.retrieve("msg");
				this._createMsgContextMenu(m, menuleft, menutop);
			}.bind(this)
		});
	},
	// 打开 消息体上 右键菜单
	_createMsgContextMenu: function(msg, menuleft, menutop) {
		var createPerson = msg.createPerson;
		var distinguishedName = layout.session.user.distinguishedName;
		var list = []; // 菜单列表
		
		if (this.main.imConfig.enableRevokeMsg) { // 是否启用撤回消息
			if (createPerson != distinguishedName) {
				// 判断是否群主
				var isGroupAdmin = false;
				for (var i = 0; i < this.main.conversationNodeItemList.length; i++) {
					var c = this.main.conversationNodeItemList[i];
					if (this.conversationId == c.data.id) {
						if (c.data.type === "group" && distinguishedName === c.data.adminPerson) {
							isGroupAdmin = true;
						}
					}
				}
				if (isGroupAdmin) {
					list.push({"id":"revokeMemberMsg", "text": this.lp.msgMenuItemRevokeMemberMsg});
				}
			} else {
				list.push({"id":"revokeMsg", "text": this.lp.msgMenuItemRevokeMsg});
			}
		}
		if (this.menuNode) {
			this.menuNode.destroy();
			this.menuNode = null;
		}
		if (list.length > 0) {
			// 生成菜单
			this.menuNode = new Element("ul", {"class": "chat-menulist", "styles": { "position": "fixed", "z-index": "9999", "top": menutop, "left": menuleft } }).inject(this.container);
			for (let index = 0; index < list.length; index++) {
				const element = list[index];
				var menuItemNode = new Element("li", {"text": element.text}).inject(this.menuNode);
				menuItemNode.store('menuItemData', element);
				menuItemNode.store('menuItemMsgData', msg);
				menuItemNode.addEvents({
					"click": function(e) {
						var menuItemData = menuItemNode.retrieve('menuItemData'); // 菜单项数据
						var menuItemMsgData = menuItemNode.retrieve('menuItemMsgData'); // 消息数据
						this._clickMsgContextMenuItem(menuItemData, menuItemMsgData);
						e.preventDefault();
					}.bind(this)
				});
			}
			// 添加关闭菜单事件
			this.closeMsgContextMenuFun = function(e) {
				if (this.menuNode) {
					this.menuNode.destroy();
					this.menuNode = null;
				}
				e.preventDefault();
				if( this.closeMsgContextMenuFun )this.main.app.content.removeEvent( "click", this.closeMsgContextMenuFun );
			}.bind(this);
	
			this.main.app.content.addEvents({
				"click": this.closeMsgContextMenuFun
			});
		}
	},
	// 点击 右键菜单项
	_clickMsgContextMenuItem: function(menuItemData, menuItemMsgData) {
		// 关闭菜单
		if (this.menuNode) {
			this.menuNode.destroy();
			this.menuNode = null;
		}
		// 根据菜单不同处理不同内容
		// 撤回
		if (menuItemData.id === "revokeMemberMsg" || menuItemData.id === "revokeMsg") {
			this._revokeMsg(menuItemMsgData);
		}
	},
	// 撤回消息
	_revokeMsg: function(msg) {
		o2.Actions.load("x_message_assemble_communicate").ImAction.msgRevoke(msg.id, function(json) {
			console.log("撤回消息：", json);
			// 删除消息
			$(msg.id).destroy();
		}.bind(this));
	},
	//图片 根据大小 url
	_getFileUrlWithWH: function (id, width, height) {
		var action = MWF.Actions.get("x_message_assemble_communicate").action;
		var url = action.getAddress() + action.actions.imgFileDownloadWithWH.uri;
		url = url.replace("{id}", encodeURIComponent(id));
		url = url.replace("{width}", encodeURIComponent(width));
		url = url.replace("{height}", encodeURIComponent(height));
		return url;
	},
	//file 下载的url
	_getFileDownloadUrl: function (id) {
		var action = MWF.Actions.get("x_message_assemble_communicate").action;
		var url = action.getAddress() + action.actions.imgFileDownload.uri;
		url = url.replace("{id}", encodeURIComponent(id));
		return url;
	},
	//百度地图打开地址
	_getBaiduMapUrl: function (lat, longt, address, content) {
		var url = "https://api.map.baidu.com/marker?location=" + lat + "," + longt + "&title=" + address + "&content=" + content + "&output=html&src=net.o2oa.map";
		return url;
	},
	// 文件类型icon图
	_getFileIcon: function (ext) {
		if (ext) {
			if (ext === "jpg" || ext === "jpeg") {
				return "icon_file_jpeg.png";
			} else if (ext === "gif") {
				return "icon_file_gif.png";
			} else if (ext === "png") {
				return "icon_file_png.png";
			} else if (ext === "tiff") {
				return "icon_file_tiff.png";
			} else if (ext === "bmp" || ext === "webp") {
				return "icon_file_img.png";
			} else if (ext === "ogg" || ext === "mp3" || ext === "wav" || ext === "wma") {
				return "icon_file_mp3.png";
			} else if (ext === "mp4") {
				return "icon_file_mp4.png";
			} else if (ext === "avi") {
				return "icon_file_avi.png";
			} else if (ext === "mov" || ext === "rm" || ext === "mkv") {
				return "icon_file_rm.png";
			} else if (ext === "doc" || ext === "docx") {
				return "icon_file_word.png";
			} else if (ext === "xls" || ext === "xlsx") {
				return "icon_file_excel.png";
			} else if (ext === "ppt" || ext === "pptx") {
				return "icon_file_ppt.png";
			} else if (ext === "html") {
				return "icon_file_html.png";
			} else if (ext === "pdf") {
				return "icon_file_pdf.png";
			} else if (ext === "txt" || ext === "json") {
				return "icon_file_txt.png";
			} else if (ext === "zip") {
				return "icon_file_zip.png";
			} else if (ext === "rar") {
				return "icon_file_rar.png";
			} else if (ext === "7z") {
				return "icon_file_arch.png";
			} else if (ext === "ai") {
				return "icon_file_ai.png";
			} else if (ext === "att") {
				return "icon_file_att.png";
			} else if (ext === "au") {
				return "icon_file_au.png";
			} else if (ext === "cad") {
				return "icon_file_cad.png";
			} else if (ext === "cdr") {
				return "icon_file_cdr.png";
			} else if (ext === "eps") {
				return "icon_file_eps.png";
			} else if (ext === "exe") {
				return "icon_file_exe.png";
			} else if (ext === "iso") {
				return "icon_file_iso.png";
			} else if (ext === "link") {
				return "icon_file_link.png";
			} else if (ext === "swf") {
				return "icon_file_flash.png";
			} else if (ext === "psd") {
				return "icon_file_psd.png";
			} else if (ext === "tmp") {
				return "icon_file_tmp.png";
			} else {
				return "icon_file_unkown.png";
			}
		} else {
			return "icon_file_unkown.png";
		}
	},
	//当前时间 yyyy-MM-dd HH:mm:ss
	_currentTime: function () {
		var today = new Date();
		var year = today.getFullYear(); //得到年份
		var month = today.getMonth();//得到月份
		var date = today.getDate();//得到日期
		var hour = today.getHours();//得到小时
		var minu = today.getMinutes();//得到分钟
		var sec = today.getSeconds();//得到秒
		month = month + 1;
		if (month < 10) month = "0" + month;
		if (date < 10) date = "0" + date;
		if (hour < 10) hour = "0" + hour;
		if (minu < 10) minu = "0" + minu;
		if (sec < 10) sec = "0" + sec;
		return year + "-" + month + "-" + date + " " + hour + ":" + minu + ":" + sec;
	}

});

// 会话对象
MWF.xApplication.IMV2.ConversationItem = new Class({
	initialize: function (data, main) {
		this.data = data;
		this.main = main;
		this.container = this.main.chatItemListNode;

		this.load();
	},
	load: function () {
		var avatarDefault = this.main._getIcon();
		var convData = {
			"id": this.data.id,
			"avatarUrl": avatarDefault,
			"title": this.data.title,
			"time": "",
			"lastMessage": "",
			"lastMessageType": "text"
		};
		var distinguishedName = layout.session.user.distinguishedName;
		if (this.data.type && this.data.type === "single") {
			var chatPerson = "";
			if (this.data.personList && this.data.personList instanceof Array) {
				for (var j = 0; j < this.data.personList.length; j++) {
					var person = this.data.personList[j];
					if (person !== distinguishedName) {
						chatPerson = person;
					}
				}
			}
			convData.avatarUrl = this.main._getIcon(chatPerson);
			var name = chatPerson;
			if (chatPerson.indexOf("@") != -1) {
				name = name.substring(0, chatPerson.indexOf("@"));
			}
			convData.title = name;
		}
		if (this.data.lastMessage) {
			//todo 其它消息类型
			var mBody = JSON.parse(this.data.lastMessage.body);
			convData.lastMessage = mBody.body;
			if (this.data.lastMessage.createTime) {
				var time = this.main._friendlyTime(o2.common.toDate(this.data.lastMessage.createTime));
				convData.time = time;
			}
			if (mBody.type) {
				convData.lastMessageType = mBody.type;
			}
		}
		this.node = new Element("div", { "class": "item" }).inject(this.container);
		this.nodeBaseItem = new Element("div", { "class": "base" }).inject(this.node);
		var avatarNode = new Element("div", { "class": "avatar" }).inject(this.nodeBaseItem);
		new Element("img", { "src": convData.avatarUrl, "class": "img" }).inject(avatarNode);
		var bodyNode = new Element("div", { "class": "body" }).inject(this.nodeBaseItem);
		var bodyUpNode = new Element("div", { "class": "body_up" }).inject(bodyNode);
		this.titleNode = new Element("div", { "class": "body_title", "text": convData.title }).inject(bodyUpNode);
		this.messageTimeNode = new Element("div", { "class": "body_time", "text": convData.time }).inject(bodyUpNode);
		if (convData.lastMessageType == "emoji") {
			this.lastMessageNode = new Element("div", { "class": "body_down" }).inject(bodyNode);
			var imgPath = "";
			for (var i = 0; i < this.main.emojiList.length; i++) {
				var emoji = this.main.emojiList[i];
				if (emoji.key == convData.lastMessage) {
					imgPath = emoji.path;
				}
			}
			new Element("img", { "src": imgPath, "style": "width: 16px;height: 16px;" }).inject(this.lastMessageNode);
		} else {
			this.lastMessageNode = new Element("div", { "class": "body_down", "text": convData.lastMessage }).inject(bodyNode);
		}

		var _self = this;
		this.node.addEvents({
			"click": function () {
				_self.main.tapConv(_self.data);
			}
		});
	},
	/**
	 *
	 * 刷新会话列表的最后消息内容 
	 * @param {*} lastMessage 
	 */
	refreshLastMsg: function (lastMessage) {
		if (lastMessage) {
			//目前是text 类型的消息
			var jsonbody = lastMessage.body;
			var body = JSON.parse(jsonbody);

			if (this.lastMessageNode) {
				if (body.type == "emoji") { //表情 消息
					var imgPath = "";
					for (var i = 0; i < this.main.emojiList.length; i++) {
						var emoji = this.main.emojiList[i];
						if (emoji.key == body.body) {
							imgPath = emoji.path;
						}
					}
					this.lastMessageNode.empty();
					new Element("img", { "src": imgPath, "style": "width: 16px;height: 16px;" }).inject(this.lastMessageNode);
				} else { //文本消息
					this.lastMessageNode.empty();
					this.lastMessageNode.set('text', body.body);
				}
			}
			var time = this.main._friendlyTime(o2.common.toDate(lastMessage.createTime));
			if (this.messageTimeNode) {
				this.messageTimeNode.set("text", time);
			}
		}
	},
	// 更新聊天窗口上的标题 修改标题的时候使用 @Disuse 使用refreshData
	refreshConvTitle: function (title) {
		this.titleNode.set("text", title);
	},
	// 更新会话数据
	refreshData: function (data) {
		this.data = data;
		// 更新聊天窗口上的标题 修改标题的时候使用
		this.titleNode.set("text", data.title);
	},
	addCheckClass: function () {
		if (this.nodeBaseItem) {
			if (!this.nodeBaseItem.hasClass("check")) {
				this.nodeBaseItem.addClass("check");
			}
		}
	},
	removeCheckClass: function () {
		if (this.nodeBaseItem) {
			if (this.nodeBaseItem.hasClass("check")) {
				this.nodeBaseItem.removeClass("check");
			}
		}
	}

});

//弹出窗 表单 单聊创建的form
MWF.xApplication.IMV2.SingleForm = new Class({
	Extends: MPopupForm,
	Implements: [Options, Events],
	options: {
		"style": "minder",
		"width": 700,
		//"height": 300,
		"height": "200",
		"hasTop": true,
		"hasIcon": false,
		"draggable": true,
		"title": MWF.xApplication.IMV2.LP.createSingle
	},
	_createTableContent: function () {
		var html = "<table width='100%' bordr='0' cellpadding='7' cellspacing='0' styles='formTable' style='margin-top: 20px; '>" +
			"<tr><td styles='formTableTitle' lable='person' width='25%'></td>" +
			"    <td styles='formTableValue14' item='person' colspan='3'></td></tr>" +
			"</table>";
		this.formTableArea.set("html", html);
		var me = layout.session.user.distinguishedName;
		var exclude = [];
		if (me) {
			exclude = [me];
		}
		this.form = new MForm(this.formTableArea, this.data || {}, {
			isEdited: true,
			style: "minder",
			hasColon: true,
			itemTemplate: {
				person: { text: MWF.xApplication.IMV2.LP.selectPerson, type: "org", orgType: "person", count: 0, notEmpty: true, exclude: exclude },
			}
		}, this.app);
		this.form.load();

	},
	_createBottomContent: function () {
		if (this.isNew || this.isEdited) {
			this.okActionNode = new Element("button.inputOkButton", {
				"styles": this.css.inputOkButton,
				"text": MWF.xApplication.IMV2.LP.ok
			}).inject(this.formBottomNode);
			this.okActionNode.addEvent("click", function (e) {
				this.save(e);
			}.bind(this));
		}
		this.cancelActionNode = new Element("button.inputCancelButton", {
			"styles": (this.isEdited || this.isNew || this.getEditPermission()) ? this.css.inputCancelButton : this.css.inputCancelButton_long,
			"text": MWF.xApplication.IMV2.LP.close
		}).inject(this.formBottomNode);
		this.cancelActionNode.addEvent("click", function (e) {
			this.close(e);
		}.bind(this));

	},
	save: function () {
		var data = this.form.getResult(true, null, true, false, true);
		if (data) {
			this.app.newConversation(data.person, "single");
			this.close();
		}
	}
});


//创建聊天 弹出窗表单
MWF.xApplication.IMV2.CreateConversationForm = new Class({
	Extends: MPopupForm,
	Implements: [Options, Events],
	options: {
		"style": "minder",
		"width": 700,
		"height": "200",
		"hasTop": true,
		"hasIcon": false,
		"draggable": true,
		"title": MWF.xApplication.IMV2.LP.createSingle,
		"personCount": 1, //1 是单选  0 是多选,
		"personSelected": [],
		"isUpdateMember": false
	},
	_createTableContent: function () {
		var html = "<table width='100%' bordr='0' cellpadding='7' cellspacing='0' styles='formTable' style='margin-top: 20px; '>" +
			"<tr><td styles='formTableTitle' lable='person' width='25%'></td>" +
			"    <td styles='formTableValue14' item='person' colspan='3'></td></tr>" +
			"</table>";
		this.formTableArea.set("html", html);
		var me = layout.session.user.distinguishedName;
		var exclude = [];
		if (me) {
			exclude = [me];
		}
		this.form = new MForm(this.formTableArea, this.data || {}, {
			isEdited: true,
			style: "minder",
			hasColon: true,
			itemTemplate: {
				person: { text: MWF.xApplication.IMV2.LP.selectPerson, type: "org", orgType: "person", count: this.options["personCount"], notEmpty: true, exclude: exclude, value: this.options["personSelected"] },
			}
		}, this.app);
		this.form.load();

	},
	_createBottomContent: function () {
		if (this.isNew || this.isEdited) {
			this.okActionNode = new Element("button.inputOkButton", {
				"styles": this.css.inputOkButton,
				"text": MWF.xApplication.IMV2.LP.ok
			}).inject(this.formBottomNode);
			this.okActionNode.addEvent("click", function (e) {
				this.save(e);
			}.bind(this));
		}
		this.cancelActionNode = new Element("button.inputCancelButton", {
			"styles": (this.isEdited || this.isNew || this.getEditPermission()) ? this.css.inputCancelButton : this.css.inputCancelButton_long,
			"text": MWF.xApplication.IMV2.LP.close
		}).inject(this.formBottomNode);
		this.cancelActionNode.addEvent("click", function (e) {
			this.close(e);
		}.bind(this));

	},
	save: function () {
		var data = this.form.getResult(true, null, true, false, true);
		if (data) {
			if (this.options["isUpdateMember"] === true) {
				this.app.updateConversationMembers(data.person, this.app.conversationId);
			} else {
				this.app.newConversation(data.person, this.options["personCount"] === 1 ? "single" : "group");
			}

			this.close();
		}
	}
});



//修改群名
MWF.xApplication.IMV2.UpdateConvTitleForm = new Class({
	Extends: MPopupForm,
	Implements: [Options, Events],
	options: {
		"style": "minder",
		"width": 500,
		"height": "200",
		"hasTop": true,
		"hasIcon": false,
		"draggable": true,
		"defaultValue": "", // 默认值
		"title": MWF.xApplication.IMV2.LP.modifyGroupName
	},
	_createTableContent: function () {
		var html = "<table width='100%' bordr='0' cellpadding='7' cellspacing='0' styles='formTable' style='margin-top: 20px; '>" +
			"<tr><td styles='formTableTitle' lable='title' width='25%'></td>" +
			"    <td styles='formTableValue14' item='title' colspan='3'></td></tr>" +
			"</table>";
		this.formTableArea.set("html", html);

		this.form = new MForm(this.formTableArea, this.data || {}, {
			isEdited: true,
			style: "minder",
			hasColon: true,
			itemTemplate: {
				title: { text: MWF.xApplication.IMV2.LP.groupName, type: "text", notEmpty: true, value:  this.options["defaultValue"] },
			}
		}, this.app);
		this.form.load();

	},
	_createBottomContent: function () {
		if (this.isNew || this.isEdited) {
			this.okActionNode = new Element("button.inputOkButton", {
				"styles": this.css.inputOkButton,
				"text": MWF.xApplication.IMV2.LP.ok
			}).inject(this.formBottomNode);
			this.okActionNode.addEvent("click", function (e) {
				this.save(e);
			}.bind(this));
		}
		this.cancelActionNode = new Element("button.inputCancelButton", {
			"styles": (this.isEdited || this.isNew || this.getEditPermission()) ? this.css.inputCancelButton : this.css.inputCancelButton_long,
			"text": MWF.xApplication.IMV2.LP.close
		}).inject(this.formBottomNode);
		this.cancelActionNode.addEvent("click", function (e) {
			this.close(e);
		}.bind(this));
	},
	save: function () {
		var data = this.form.getResult(true, null, true, false, true);
		if (data) {
			this.app.updateConversationTitle(data.title, this.app.conversationId);
			this.close();
		}
	}
});
