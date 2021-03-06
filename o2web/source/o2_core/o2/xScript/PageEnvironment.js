if (!MWF.xScript || !MWF.xScript.PageEnvironment) {
    MWF.xScript = MWF.xScript || {};
    MWF.xScript.PageEnvironment = function (ev) {
        var _data = ev.data;
        var _form = ev.form;
        var _forms = ev.forms;

        this.library = COMMON;
        //this.library.version = "4.0";

        //data
        var getJSONData = function (jData) {
            return new MWF.xScript.JSONData(jData, function (data, key, _self) {
                var p = {
                    "getKey": function () {
                        return key;
                    }, "getParent": function () {
                        return _self;
                    }
                };
                while (p && !_forms[p.getKey()]) p = p.getParent();
                var k = (p) ? p.getKey() : "";
                if (k) if (_forms[k]) if (_forms[k].resetData) _forms[k].resetData();
                //if (p) if (p.getKey()) if (_forms[p.getKey()]) _forms[p.getKey()].resetData();
            });
        };
        this.setData = function (data) {
            this.data = getJSONData(data);
            this.data.save = function (callback) {
                var formData = {
                    "data": data,
                    "sectionList": _form.getSectionList()
                };
                form.workAction.saveData(function (json) {
                    if (callback) callback();
                }.bind(this), null, work.id, jData);
            }
        };
        this.setData(_data);

        //workContext
        this.workContext = {
            "getTask": function () {
                return ev.task;
            },
            "getWork": function () {
                return ev.work || ev.workCompleted;
            },
            "getActivity": function () {
                return ev.activity;
            },
            "getTaskList": function () {
                return ev.taskList;
            },
            "getControl": function () {
                return ev.control;
            },
            "getWorkLogList": function () {
                return ev.workLogList;
            },
            "getAttachmentList": function () {
                return ev.attachmentList;
            },
            "getRouteList": function () {
                return (ev.task) ? ev.task.routeNameList : null;
            },
            "getInquiredRouteList": function () {
                return null;
            },
            "setTitle": function (title) {
                //if (!this.workAction){
                //    MWF.require("MWF.xScript.Actions.WorkActions", null, false);
                //    this.workAction = new MWF.xScript.Actions.WorkActions();
                //}
                //this.workAction.setTitle(ev.work.id, {"title": title});
            }
        };
        var _redefineWorkProperties = function (work) {
            if (work) {
                work.creatorPersonDn = work.creatorPerson;
                work.creatorUnitDn = work.creatorUnit;
                work.creatorUnitDnList = work.creatorUnitList;
                work.creatorIdentityDn = work.creatorIdentity;
                var o = {
                    "creatorPerson": {
                        "get": function () {
                            return this.creatorPersonDn.substring(0, this.creatorPersonDn.indexOf("@"));
                        }
                    },
                    "creatorUnit": {
                        "get": function () {
                            return this.creatorUnitDn.substring(0, this.creatorUnitDn.indexOf("@"));
                        }
                    },
                    "creatorDepartment": {
                        "get": function () {
                            return this.creatorUnitDn.substring(0, this.creatorUnitDn.indexOf("@"));
                        }
                    },
                    "creatorIdentity": {
                        "get": function () {
                            return this.creatorIdentityDn.substring(0, this.creatorIdentityDn.indexOf("@"));
                        }
                    },
                    "creatorUnitList": {
                        "get": function () {
                            var v = [];
                            this.creatorUnitDnList.each(function (dn) {
                                v.push(dn.substring(0, dn.indexOf("@")))
                            });
                            return v;
                        }
                    },
                    "creatorCompany": {
                        "get": function () {
                            return this.creatorUnitList[0]
                        }
                    }
                };
                MWF.defineProperties(work, o);
            }
            return work;
        };
        var _redefineTaskProperties = function (task) {
            if (task) {
                task.personDn = task.person;
                task.unitDn = task.unit;
                task.unitDnList = task.unitList;
                task.identityDn = task.identity;
                var o = {
                    "person": {
                        "get": function () {
                            return this.personDn.substring(0, this.personDn.indexOf("@"));
                        }
                    },
                    "unit": {
                        "get": function () {
                            return this.unitDn.substring(0, this.unitDn.indexOf("@"));
                        }
                    },
                    "department": {
                        "get": function () {
                            return this.unitDn.substring(0, this.unitDn.indexOf("@"));
                        }
                    },
                    "identity": {
                        "get": function () {
                            return this.identityDn.substring(0, this.identityDn.indexOf("@"));
                        }
                    },
                    "unitList": {
                        "get": function () {
                            var v = [];
                            this.unitDnList.each(function (dn) {
                                v.push(dn.substring(0, dn.indexOf("@")))
                            });
                            return v;
                        }
                    },
                    "company": {
                        "get": function () {
                            return this.unitList[0];
                        }
                    }
                };
                MWF.defineProperties(task, o);
            }
            return task;
        };
        _redefineWorkProperties(this.workContext.getWork());
        _redefineTaskProperties(_redefineWorkProperties(this.workContext.getTask()));

        //dict
        this.Dict = MWF.xScript.createDict(_form.json.application);
        //org
        var orgActions = null;
        var getOrgActions = function () {
            if (!orgActions) {
                MWF.require("MWF.xScript.Actions.UnitActions", null, false);
                orgActions = new MWF.xScript.Actions.UnitActions();
            }
        };
        var getNameFlag = function (name) {
            var t = typeOf(name);
            if (t === "array") {
                var v = [];
                name.each(function (id) {
                    v.push((typeOf(id) === "object") ? (id.distinguishedName || id.id || id.unique || id.name) : id);
                });
                return v;
            } else {
                return [(t === "object") ? (name.distinguishedName || name.id || name.unique || name.name) : name];
            }
        };
        this.org = {
            //??????***************
            //????????????--???????????????????????????
            getGroup: function (name, async) {
                getOrgActions();
                var data = {"groupList": getNameFlag(name)};

                var v = null;

                var cb = function (json) {
                    v = json.data;
                    v = (v && v.length === 1) ? v[0] : v
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listGroup(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var v = null;
                // orgActions.listGroup(data, function(json){v = json.data;}, null, false);
                // return (v && v.length===1) ? v[0] : v;
            },
            //??????????????????--???????????????????????????
            //nested  ??????  true???????????????false?????????????????????false???
            listSubGroup: function (name, nested, async) {
                getOrgActions();
                var data = {"groupList": getNameFlag(name)};

                var v = null;
                // var cb = ((async && o2.typeOf(async)=="function") ? (async.isAG ? async : async.ag()) : null) || function(json){
                //     v = json.data;
                //     return v;
                // }.ag().catch(function(json){ return json; });
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise;
                if (nested) {
                    promise = orgActions.listSubGroupNested(data, cb, null, !!async);
                } else {
                    promise = orgActions.listSubGroupDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;

                // var v = null;
                // if (nested){
                //     orgActions.listSubGroupNested(data, function(json){v = json.data;}, null, false);
                // }else{
                //     orgActions.listSubGroupDirect(data, function(json){v = json.data;}, null, false);
                // }
                // return v;
            },
            //??????????????????--???????????????????????????
            //nested  ??????  true???????????????false?????????????????????false???
            listSupGroup: function (name, nested, async) {
                getOrgActions();
                var data = {"groupList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise
                if (nested) {
                    var promise = orgActions.listSupGroupNested(data, cb, null, !!async);
                } else {
                    var promise = orgActions.listSupGroupDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;
                // var v = null;
                // if (nested){
                //     orgActions.listSupGroupNested(data, function(json){v = json.data;}, null, false);
                // }else{
                //     orgActions.listSupGroupDirect(data, function(json){v = json.data;}, null, false);
                // }
                // return v;
            },
            //??????????????????????????????--???????????????????????????
            listGroupWithPerson: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listGroupWithPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;
                // var v = null;
                // orgActions.listGroupWithPerson(data, function(json){v = json.data;}, null, false);
                // return v;
            },
            //??????????????????????????????--???????????????????????????
            listGroupWithIdentity:function(identity, async){
                getOrgActions();
                var data = {"identityList": getNameFlag(identity)};

                var v = null;
                var cb = function(json){
                    v = json.data;
                    if (async && o2.typeOf(async)=="function") return async(v);
                    return v;
                };

                var promise = orgActions.listGroupWithIdentity(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //????????????????????????--??????true, false
            groupHasRole: function (name, role, async) {
                getOrgActions();
                nameFlag = (typeOf(name) === "object") ? (name.distinguishedName || name.id || name.unique || name.name) : name;
                var data = {"group": nameFlag, "roleList": getNameFlag(role)};

                var v = false;
                var cb = function (json) {
                    v = json.data.value;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.groupHasRole(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var v = false;
                // orgActions.groupHasRole(data, function(json){v = json.data.value;}, null, false);
                // return v;
            },

            //??????***************
            //????????????--???????????????????????????
            getRole: function (name, async) {
                getOrgActions();
                var data = {"roleList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    v = (v && v.length === 1) ? v[0] : v;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listRole(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var v = null;
                // orgActions.listRole(data, function(json){v = json.data;}, null, false);
                // return (v && v.length===1) ? v[0] : v;
            },
            //??????????????????????????????--???????????????????????????
            listRoleWithPerson: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listRoleWithPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;
                // var v = null;
                // orgActions.listRoleWithPerson(data, function(json){v = json.data;}, null, false);
                // return v;
            },

            //??????***************
            //????????????????????????--??????true, false
            personHasRole: function (name, role, async) {
                getOrgActions();
                nameFlag = (typeOf(name) === "object") ? (name.distinguishedName || name.id || name.unique || name.name) : name;
                var data = {"person": nameFlag, "roleList": getNameFlag(role)};

                var v = false;
                var cb = function (json) {
                    v = json.data.value;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listRoleWithPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var v = false;
                // orgActions.personHasRole(data, function(json){v = json.data.value;}, null, false);
                // return v;
            },
            //????????????--???????????????????????????
            getPerson: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    v = (v && v.length === 1) ? v[0] : v;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;
                // var v = null;
                // orgActions.listPerson(data, function(json){v = json.data;}, null, false);
                // return (v && v.length===1) ? v[0] : v;
            },
            //??????????????????--???????????????????????????
            //nested  ??????  true???????????????false?????????????????????false???
            listSubPerson: function (name, nested, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise;
                if (nested) {
                    promise = orgActions.listPersonSubNested(data, cb, null, !!async);
                } else {
                    promise = orgActions.listPersonSubDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;
            },
            //??????????????????--???????????????????????????
            //nested  ??????  true???????????????false?????????????????????false???
            listSupPerson: function (name, nested, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise;
                if (nested) {
                    promise = orgActions.listPersonSupNested(data, cb, null, !!async);
                } else {
                    promise = orgActions.listPersonSupDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;
            },
            //???????????????????????????--???????????????????????????
            listPersonWithGroup: function (name, async) {
                getOrgActions();
                var data = {"groupList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonWithGroup(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????--???????????????????????????
            listPersonWithRole: function (name, async) {
                getOrgActions();
                var data = {"roleList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise
                promise = orgActions.listPersonWithRole(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????--???????????????????????????
            listPersonWithIdentity: function (name, async) {
                getOrgActions();
                var data = {"identityList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonWithIdentity(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????--??????????????????????????????????????????
            getPersonWithIdentity: function (name, async) {
                getOrgActions();
                var data = {"identityList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    v = (v && v.length === 1) ? v[0] : v;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonWithIdentity(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????--???????????????????????????
            //nested  ??????  true????????????????????????false?????????????????????false???
            listPersonWithUnit: function (name, nested, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise;
                if (nested) {
                    promise = orgActions.listPersonWithUnitNested(data, cb, null, !!async);
                } else {
                    promise = orgActions.listPersonWithUnitDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;
            },
            //????????????????????????--???????????????????????????
            //name  string ?????????
            //value  string ?????????
            listPersonWithAttribute: function (name, value, async) {
                getOrgActions();
                var data = {"name": name, "attribute": value};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonWithAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //????????????????????????--???????????????????????????
            //name  string ?????????
            //value  string ?????????
            listPersonNameWithAttribute: function (name, value, async) {
                getOrgActions();
                var data = {"name": name, "attribute": value};
                var v = null;
                var cb = function (json) {
                    v = json.data.personList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonWithAttributeValue(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },

            //????????????************
            //?????????????????????(??????????????????values?????????????????????????????????????????????)
            appendPersonAttribute: function (person, attr, values, success, failure, async) {
                getOrgActions();
                var personFlag = (typeOf(person) === "object") ? (person.distinguishedName || person.id || person.unique || person.name) : person;
                var data = {"attributeList": values, "name": attr, "person": personFlag};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };
                var promise = orgActions.appendPersonAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var cb = function(json){
                //     if (success) return success(json);
                // }.ag().catch(function(xhr, text, error){
                //     if (failure) return failure(xhr, text, error);
                // });
                //
                // orgActions.appendPersonAttribute(data, cb, null, !!async);
            },
            //?????????????????????(?????????????????????values??????????????????????????????????????????)
            setPersonAttribute: function (person, attr, values, success, failure, async) {
                getOrgActions();
                var personFlag = (typeOf(person) === "object") ? (person.distinguishedName || person.id || person.unique || person.name) : person;
                var data = {"attributeList": values, "name": attr, "person": personFlag};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };
                var promise = orgActions.setPersonAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var cb = function(json){
                //     if (success) return success(json);
                // }.ag().catch(function(xhr, text, error){
                //     if (failure) return failure(xhr, text, error);
                // });
                //
                // orgActions.setPersonAttribute(data, cb, null, !!async);
            },
            //?????????????????????
            getPersonAttribute: function (person, attr, async) {
                getOrgActions();
                var personFlag = (typeOf(person) === "object") ? (person.distinguishedName || person.id || person.unique || person.name) : person;
                var data = {"name": attr, "person": personFlag};
                var v = null;
                var cb = function (json) {
                    v = json.data.attributeList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.getPersonAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????
            listPersonAttributeName: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data.nameList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonAttributeName(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????
            listPersonAllAttribute: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listPersonAllAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },

            //??????**********
            //????????????
            getIdentity: function (name, async) {
                getOrgActions();
                var data = {"identityList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    v = (v && v.length === 1) ? v[0] : v;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listIdentity(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????
            listIdentityWithPerson: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listIdentityWithPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //????????????????????????--???????????????????????????
            //nested  ??????  true????????????????????????false?????????????????????false???
            listIdentityWithUnit: function (name, nested, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;

                // var cb = function(json){
                //     v = json.data;
                //     if (async && o2.typeOf(async)=="function") return async(v);
                //     return v;
                // }.ag().catch(function(json){ return json; });

                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var method = (nested) ? "listIdentityWithUnitNested" : "listIdentityWithUnitDirect";
                var promise = orgActions[method](data, cb, null, !!async);
                promise.name = "org";

                //
                // if (nested){
                //     orgActions.listIdentityWithUnitNested(data, cb, null, !!async);
                // }else{
                //     orgActions.listIdentityWithUnitDirect(data, cb, null, !!async);
                // }
                return (!!async) ? promise : v;
            },

            //??????**********
            //????????????
            getUnit: function (name, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    v = (v && v.length === 1) ? v[0] : v;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnit(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????--???????????????????????????
            //nested  ??????  true???????????????false?????????????????????false???
            listSubUnit: function (name, nested, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise;
                if (nested) {
                    promise = orgActions.listUnitSubNested(data, cb, null, !!async);
                } else {
                    promise = orgActions.listUnitSubDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;
            },
            //?????????????????????--???????????????????????????
            //nested  ??????  true???????????????false?????????????????????false???
            //async ?????? true????????????
            listSupUnit: function (name, nested, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise;
                if (nested) {
                    promise = orgActions.listUnitSupNested(data, cb, null, !!async);
                } else {
                    promise = orgActions.listUnitSupDirect(data, cb, null, !!async);
                }
                return (!!async) ? promise : v;

                // if (callback){
                //     if (nested){
                //         orgActions.listUnitSupNested(data, function(json){v = json.data; o2.runCallback(callback, "success", [v], this);});
                //     }else{
                //         orgActions.listUnitSupDirect(data, function(json){v = json.data; o2.runCallback(callback, "success", [v], this);});
                //     }
                // }else{
                //     var v = null;
                //     if (nested){
                //         orgActions.listUnitSupNested(data, function(json){v = json.data;}, null, false);
                //     }else{
                //         orgActions.listUnitSupDirect(data, function(json){v = json.data;}, null, false);
                //     }
                //     return v;
                // }
            },
            //??????????????????????????????
            //flag ??????    ??????????????????????????????
            //     ?????????  ?????????????????????????????????
            //     ???     ?????????????????????????????????
            getUnitByIdentity: function (name, flag, async) {
                getOrgActions();
                var getUnitMethod = "current";
                var v;
                if (flag) {
                    if (typeOf(flag) === "string") getUnitMethod = "type";
                    if (typeOf(flag) === "number") getUnitMethod = "level";
                }

                var cb;
                var promise;
                switch (getUnitMethod) {
                    case "current":
                        var data = {"identityList": getNameFlag(name)};

                        // var cb = ((async && o2.typeOf(async)=="function") ? (async.isAG ? async : async.ag()) : null) || function(json){
                        //     v = json.data;  v=(v&&v.length===1) ? v[0] : v; return v;
                        // }.ag().catch(function(json){ return json; });


                        cb = function (json) {
                            v = json.data;
                            v = (v && v.length === 1) ? v[0] : v;
                            if (async && o2.typeOf(async) == "function") return async(v);
                            return v;
                        };


                        promise = orgActions.listUnitWithIdentity(data, cb, null, !!async);
                        break;
                    case "type":
                        var data = {
                            "identity": (typeOf(name) === "object") ? (name.distinguishedName || name.id || name.unique || name.name) : name,
                            "type": flag
                        };

                        cb = function (json) {
                            v = json.data;
                            if (async && o2.typeOf(async) == "function") return async(v);
                            return v;
                        };

                        // var cb = ((async && o2.typeOf(async)=="function") ? (async.isAG ? async : async.ag()) : null) || function(json){
                        //     v = json.data;  return v;
                        // }.ag().catch(function(json){ return json; });

                        promise = orgActions.getUnitWithIdentityAndType(data, cb, null, !!async);
                        break;
                    case "level":
                        var data = {
                            "identity": (typeOf(name) === "object") ? (name.distinguishedName || name.id || name.unique || name.name) : name,
                            "level": flag
                        };

                        cb = function (json) {
                            v = json.data;
                            v = (v && v.length === 1) ? v[0] : v;
                            if (async && o2.typeOf(async) == "function") return async(v);
                            return v;
                        };

                        // var cb = ((async && o2.typeOf(async)=="function") ? (async.isAG ? async : async.ag()) : null) || function(json){
                        //     v = json.data;  return v;
                        // }.ag().catch(function(json){ return json; });

                        promise = orgActions.getUnitWithIdentityAndLevel(data, cb, null, !!async);
                        break;
                }
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????????????????
            listAllSupUnitWithIdentity: function (name, async) {
                getOrgActions();
                var data = {"identityList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitSupNestedWithIdentity(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????
            listUnitWithPerson: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitWithPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????????????????
            listAllSupUnitWithPerson: function (name, async) {
                getOrgActions();
                var data = {"personList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitSupNestedWithPerson(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //????????????????????????????????????????????????
            listUnitWithAttribute: function (name, attribute, async) {
                getOrgActions();
                var data = {"name": name, "attribute": attribute};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                promise = orgActions.listUnitWithAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //????????????????????????????????????????????????
            listUnitWithDuty: function (name, id, async) {
                getOrgActions();
                var data = {
                    "name": name,
                    "identity": (typeOf(id) === "object") ? (id.distinguishedName || id.id || id.unique || id.name) : id
                };
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitWithDuty(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },

            //????????????***********
            //????????????????????????????????????
            getDuty: function (duty, id, async) {
                getOrgActions();
                var data = {
                    "name": duty,
                    "unit": (typeOf(id) === "object") ? (id.distinguishedName || id.id || id.unique || id.name) : id
                };
                var v = null;

                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.getDuty(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????
            listDutyNameWithIdentity: function (name, async) {
                getOrgActions();
                var data = {"identityList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data.nameList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listDutyNameWithIdentity(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????
            listDutyNameWithUnit: function (name, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data.nameList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listDutyNameWithUnit(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????
            listUnitAllDuty: function (name, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitAllDuty(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //??????????????????
            listTopUnit: function (async) {
                var action = MWF.Actions.get("x_organization_assemble_control");
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = action.listTopUnit(cb, null, !!async);
                return (!!async) ? promise : v;
            },

            //????????????**************
            //?????????????????????(??????????????????values?????????????????????????????????????????????)
            appendUnitAttribute: function (unit, attr, values, success, failure, async) {
                getOrgActions();
                var unitFlag = (typeOf(unit) === "object") ? (unit.distinguishedName || unit.id || unit.unique || unit.name) : unit;
                var data = {"attributeList": values, "name": attr, "unit": unitFlag};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };
                var promise = orgActions.appendUnitAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var cb = function(json){
                //     if (success) return success(json);
                // }.ag().catch(function(xhr, text, error){
                //     if (failure) return failure(xhr, text, error);
                // });
                //
                // orgActions.appendPersonAttribute(data, cb, null, !!async);

                // orgActions.appendUnitAttribute(data, function(json){
                //     if (json.data.value){
                //         if (success) success();
                //     }else{
                //         if (failure) failure(null, "", "append values failed");
                //     }
                // }, function(xhr, text, error){
                //     if (failure) failure(xhr, text, error);
                // }, false);
            },
            //?????????????????????(?????????????????????values??????????????????????????????????????????)
            setUnitAttribute: function (unit, attr, values, success, failure, async) {
                getOrgActions();
                var unitFlag = (typeOf(unit) === "object") ? (unit.distinguishedName || unit.id || unit.unique || unit.name) : unit;
                var data = {"attributeList": values, "name": attr, "unit": unitFlag};

                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };
                var promise = orgActions.setUnitAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;

                // var cb = function(json){
                //     if (success) return success(json);
                // }.ag().catch(function(xhr, text, error){
                //     if (failure) return failure(xhr, text, error);
                // });
                // orgActions.setUnitAttribute(data, cb, null, !!async);

                // orgActions.setUnitAttribute(data, function(json){
                //     if (json.data.value){
                //         if (success) success();
                //     }else{
                //         if (failure) failure(null, "", "append values failed");
                //     }
                // }, function(xhr, text, error){
                //     if (failure) failure(xhr, text, error);
                // }, false);
            },
            //?????????????????????
            getUnitAttribute: function (unit, attr, async) {
                getOrgActions();
                var unitFlag = (typeOf(unit) === "object") ? (unit.distinguishedName || unit.id || unit.unique || unit.name) : unit;
                var data = {"name": attr, "unit": unitFlag};
                var v = null;
                var cb = function (json) {
                    v = json.data.attributeList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.getUnitAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //?????????????????????????????????
            listUnitAttributeName: function (name, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data.nameList;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitAttributeName(data, cb, null, !!async);
                return (!!async) ? promise : v;
            },
            //???????????????????????????
            listUnitAllAttribute: function (name, async) {
                getOrgActions();
                var data = {"unitList": getNameFlag(name)};
                var v = null;
                var cb = function (json) {
                    v = json.data;
                    if (async && o2.typeOf(async) == "function") return async(v);
                    return v;
                };

                var promise = orgActions.listUnitAllAttribute(data, cb, null, !!async);
                return (!!async) ? promise : v;
            }
        };

        this.Action = (function () {
            var actions = [];
            return function (root, json) {
                var action = actions[root] || (actions[root] = new MWF.xDesktop.Actions.RestActions("", root, ""));
                action.getActions = function (callback) {
                    if (!this.actions) this.actions = {};
                    Object.merge(this.actions, json);
                    if (callback) callback();
                };
                this.invoke = function (option) {
                    action.invoke(option)
                }
            }
        })();
        // this.service = {
        //     "jaxwsClient": {},
        //     "jaxrsClient": {}
        // };

        var lookupAction = null;
        var getLookupAction = function (callback) {
            if (!lookupAction) {
                MWF.require("MWF.xDesktop.Actions.RestActions", function () {
                    lookupAction = new MWF.xDesktop.Actions.RestActions("", "x_processplatform_assemble_surface", "");
                    lookupAction.getActions = function (actionCallback) {
                        this.actions = {
                            //"lookup": {"uri": "/jaxrs/view/flag/{view}/application/flag/{application}"},
                            //"getView": {"uri": "/jaxrs/view/{id}/design"}
                            "lookup": {
                                "uri": "/jaxrs/queryview/flag/{view}/application/flag/{application}/execute",
                                "method": "PUT"
                            },
                            "getView": {"uri": "/jaxrs/queryview/flag/{view}/application/flag/{application}"}
                        };
                        if (actionCallback) actionCallback();
                    }
                    if (callback) callback();
                });
            } else {
                if (callback) callback();
            }
        };

        this.view = {
            "lookup": function (view, callback, async) {
                var filterList = {"filterList": (view.filter || null)};
                MWF.Actions.load("x_query_assemble_surface").ViewAction.executeWithQuery(view.view, view.application, filterList, function (json) {
                    var data = {
                        "grid": json.data.grid || json.data.groupGrid,
                        "groupGrid": json.data.groupGrid
                    };
                    if (callback) callback(data);
                }, null, async);
            },

            "lookupV1": function (view, callback) {
                getLookupAction(function () {
                    lookupAction.invoke({
                        "name": "lookup",
                        "async": true,
                        "parameter": {"view": view.view, "application": view.application},
                        "success": function (json) {
                            var data = {
                                "grid": json.data.grid,
                                "groupGrid": json.data.groupGrid
                            };
                            if (callback) callback(data);
                        }.bind(this)
                    });
                }.bind(this));
            },
            "select": function (view, callback, options) {
                if (view.view) {
                    var viewJson = {
                        "application": view.application || _form.json.application,
                        "viewName": view.view || "",
                        "isTitle": (view.isTitle === false) ? "no" : "yes",
                        "select": (view.isMulti === false) ? "single" : "multi",
                        "filter": view.filter
                    };
                    if (!options) options = {};
                    options.width = view.width;
                    options.height = view.height;
                    options.title = view.caption;

                    var width = options.width || "700";
                    var height = options.height || "400";

                    if (layout.mobile) {
                        var size = document.body.getSize();
                        width = size.x;
                        height = size.y;
                        options.style = "viewmobile";
                    }
                    width = width.toInt();
                    height = height.toInt();

                    var size = _form.app.content.getSize();
                    var x = (size.x - width) / 2;
                    var y = (size.y - height) / 2;
                    if (x < 0) x = 0;
                    if (y < 0) y = 0;
                    if (layout.mobile) {
                        x = 20;
                        y = 0;
                    }

                    var _self = this;
                    MWF.require("MWF.xDesktop.Dialog", function () {
                        var dlg = new MWF.xDesktop.Dialog({
                            "title": options.title || "select view",
                            "style": options.style || "view",
                            "top": y,
                            "left": x - 20,
                            "fromTop": y,
                            "fromLeft": x - 20,
                            "width": width,
                            "height": height,
                            "html": "<div style='height: 100%;'></div>",
                            "maskNode": _form.app.content,
                            "container": _form.app.content,
                            "buttonList": [
                                {
                                    "text": MWF.LP.process.button.ok,
                                    "action": function () {
                                        //if (callback) callback(_self.view.selectedItems);
                                        if (callback) callback(_self.view.getData());
                                        this.close();
                                    }
                                },
                                {
                                    "text": MWF.LP.process.button.cancel,
                                    "action": function () {
                                        this.close();
                                    }
                                }
                            ]
                        });
                        dlg.show();

                        if (layout.mobile) {
                            var backAction = dlg.node.getElement(".MWF_dialod_Action_back");
                            var okAction = dlg.node.getElement(".MWF_dialod_Action_ok");
                            if (backAction) backAction.addEvent("click", function (e) {
                                dlg.close();
                            }.bind(this));
                            if (okAction) okAction.addEvent("click", function (e) {
                                //if (callback) callback(this.view.selectedItems);
                                if (callback) callback(this.view.getData());
                                dlg.close();
                            }.bind(this));
                        }

                        MWF.xDesktop.requireApp("query.Query", "Viewer", function () {
                            this.view = new MWF.xApplication.query.Query.Viewer(dlg.content.getFirst(), viewJson, {"style": "select"}, _form.app, _form.Macro);
                        }.bind(this));
                    }.bind(this));
                }
            }
        };

        this.statement = {
            "execute": function (statement, callback, async) {
                var parameter = this.parseParameter(statement.parameter);
                var filterList = this.parseFilter(statement.filter, parameter);
                var obj = {
                    "filterList": filterList,
                    "parameter": parameter
                };
                MWF.Actions.load("x_query_assemble_surface").StatementAction.executeV2(
                    statement.name, statement.mode || "data", statement.page || 1, statement.pageSize || 20, obj,
                    function (json) {
                        if (callback) callback(json);
                    }, null, async);
            },
            parseFilter: function (filter, parameter) {
                if (typeOf(filter) !== "array") return [];
                var filterList = [];
                (filter || []).each(function (d) {
                    var parameterName = d.path.replace(/\./g, "_");
                    var value = d.value;
                    if (d.comparison === "like" || d.comparison === "notLike") {
                        if (value.substr(0, 1) !== "%") value = "%" + value;
                        if (value.substr(value.length - 1, 1) !== "%") value = value + "%";
                        parameter[parameterName] = value; //"%"+value+"%";
                    } else {
                        if (d.formatType === "dateTimeValue" || d.formatType === "datetimeValue") {
                            value = "{ts '" + value + "'}"
                        } else if (d.formatType === "dateValue") {
                            value = "{d '" + value + "'}"
                        } else if (d.formatType === "timeValue") {
                            value = "{t '" + value + "'}"
                        }
                        parameter[parameterName] = value;
                    }
                    d.value = parameterName;

                    filterList.push(d);
                }.bind(this));
                return filterList;
            },
            parseParameter: function (obj) {
                if (typeOf(obj) !== "object") return {};
                var parameter = {};
                //???????????????
                for (var p in obj) {
                    var value = obj[p];
                    if (typeOf(value) === "date") {
                        value = "{ts '" + value.format("db") + "'}"
                    }
                    parameter[p] = value;
                }
                return parameter;
            },
            "select": function (statement, callback, options) {
                if (statement.name) {
                    // var parameter = this.parseParameter(statement.parameter);
                    // var filterList = this.parseFilter(statement.filter, parameter);
                    var statementJson = {
                        "statementId": statement.name || "",
                        "isTitle": (statement.isTitle === false) ? "no" : "yes",
                        "select": (statement.isMulti === false) ? "single" : "multi",
                        "filter": statement.filter,
                        "parameter": statement.parameter
                    };
                    if (!options) options = {};
                    options.width = statement.width;
                    options.height = statement.height;
                    options.title = statement.caption;

                    var width = options.width || "700";
                    var height = options.height || "400";

                    if (layout.mobile) {
                        var size = document.body.getSize();
                        width = size.x;
                        height = size.y;
                        options.style = "viewmobile";
                    }
                    width = width.toInt();
                    height = height.toInt();

                    var size = _form.app.content.getSize();
                    var x = (size.x - width) / 2;
                    var y = (size.y - height) / 2;
                    if (x < 0) x = 0;
                    if (y < 0) y = 0;
                    if (layout.mobile) {
                        x = 20;
                        y = 0;
                    }

                    var _self = this;
                    MWF.require("MWF.xDesktop.Dialog", function () {
                        var dlg = new MWF.xDesktop.Dialog({
                            "title": options.title || "select statement view",
                            "style": options.style || "view",
                            "top": y,
                            "left": x - 20,
                            "fromTop": y,
                            "fromLeft": x - 20,
                            "width": width,
                            "height": height,
                            "html": "<div style='height: 100%;'></div>",
                            "maskNode": _form.app.content,
                            "container": _form.app.content,
                            "buttonList": [
                                {
                                    "text": MWF.LP.process.button.ok,
                                    "action": function () {
                                        //if (callback) callback(_self.view.selectedItems);
                                        if (callback) callback(_self.statement.getData());
                                        this.close();
                                    }
                                },
                                {
                                    "text": MWF.LP.process.button.cancel,
                                    "action": function () {
                                        this.close();
                                    }
                                }
                            ]
                        });
                        dlg.show();

                        if (layout.mobile) {
                            var backAction = dlg.node.getElement(".MWF_dialod_Action_back");
                            var okAction = dlg.node.getElement(".MWF_dialod_Action_ok");
                            if (backAction) backAction.addEvent("click", function (e) {
                                dlg.close();
                            }.bind(this));
                            if (okAction) okAction.addEvent("click", function (e) {
                                //if (callback) callback(this.view.selectedItems);
                                if (callback) callback(this.statement.getData());
                                dlg.close();
                            }.bind(this));
                        }

                        MWF.xDesktop.requireApp("query.Query", "Statement", function () {
                            this.statement = new MWF.xApplication.query.Query.Statement(dlg.content.getFirst(), statementJson, {"style": "select"}, _form.app, _form.Macro);
                        }.bind(this));
                    }.bind(this));
                }
            }
        };


        this.importer = {
            "upload": function (options, callback, async) {
                MWF.xDesktop.requireApp("query.Query", "Importer", function () {
                    var importer = new MWF.xApplication.query.Query.Importer(_form.app.content, options, {}, _form.app, _form.Macro);
                    importer.load();
                }.bind(this));
            },
            "downloadTemplate": function (options, fileName) {
                MWF.xDesktop.requireApp("query.Query", "Importer", function () {
                    var importer = new MWF.xApplication.query.Query.Importer(_form.app.content, options, {}, _form.app, _form.Macro);
                    importer.downloadTemplate(fileName);
                }.bind(this));
            }
        };

        //include ????????????
        //optionsOrName : {
        //  type : "", ?????????portal, ????????? portal  process  cms
        //  application : "", ??????/??????/CMS?????????/??????/id, ?????????????????????
        //  name : "" // ????????????/??????/id
        //}
        //??????name: "" // ????????????/??????/id
        // if( !window.includedScripts ){
        //     var includedScripts = window.includedScripts = [];
        // }else{
        //     var includedScripts = window.includedScripts;
        // }
        var includedScripts = [];
        var _includeSingle = function (optionsOrName, callback, async) {
            var options = optionsOrName;
            if (typeOf(options) == "string") {
                options = {name: options};
            }
            var name = options.name;
            var type = (options.type && options.application) ? options.type : "portal";
            var application = options.application || _form.json.application;
            var key = type + "-" + application + "-" + name;
            if (includedScripts.indexOf(key) > -1) {
                if (callback) callback.apply(this);
                return;
            }
            //if (includedScripts.indexOf( name )> -1){
            //    if (callback) callback.apply(this);
            //    return;
            //}
            if (( options.enableAnonymous || options.anonymous ) && type === "cms") {
                o2.Actions.load("x_cms_assemble_control").ScriptAnonymousAction.getWithAppWithName(application, name, function (json) {
                    if (json.data) {
                        includedScripts.push(key);
                        //??????????????????id
                        (json.data.importedList || []).each(function (flag) {
                            includedScripts.push(type + "-" + json.data.appId + "-" + flag);
                            if (json.data.appName) includedScripts.push(type + "-" + json.data.appName + "-" + flag);
                            if (json.data.appAlias) includedScripts.push(type + "-" + json.data.appAlias + "-" + flag);
                        });
                        includedScripts = includedScripts.concat(json.data.importedList || []);
                        MWF.CMSMacro.exec(json.data.text, this);
                        if (callback) callback.apply(this);
                    } else {
                        if (callback) callback.apply(this);
                    }
                }.bind(this), null, false);
            } else {
                var scriptAction;
                switch (type) {
                    case "portal" :
                        if (this.scriptActionPortal) {
                            scriptAction = this.scriptActionPortal;
                        } else {
                            MWF.require("MWF.xScript.Actions.PortalScriptActions", null, false);
                            scriptAction = this.scriptActionPortal = new MWF.xScript.Actions.PortalScriptActions();
                        }
                        break;
                    case "process" :
                        if (this.scriptActionProcess) {
                            scriptAction = this.scriptActionProcess;
                        } else {
                            MWF.require("MWF.xScript.Actions.ScriptActions", null, false);
                            scriptAction = this.scriptActionProcess = new MWF.xScript.Actions.ScriptActions();
                        }
                        break;
                    case "cms" :
                        if (this.scriptActionCMS) {
                            scriptAction = this.scriptActionCMS;
                        } else {
                            MWF.require("MWF.xScript.Actions.CMSScriptActions", null, false);
                            scriptAction = this.scriptActionCMS = new MWF.xScript.Actions.CMSScriptActions();
                        }
                        break;
                }
                scriptAction.getScriptByName(application, name, includedScripts, function (json) {
                    if (json.data) {
                        includedScripts.push(key);

                        //??????????????????id
                        json.data.importedList.each(function (flag) {
                            if (type === "portal") {
                                includedScripts.push(type + "-" + json.data.portal + "-" + flag);
                                if (json.data.portalName) includedScripts.push(type + "-" + json.data.portalName + "-" + flag);
                                if (json.data.portalAlias) includedScripts.push(type + "-" + json.data.portalAlias + "-" + flag);
                            } else if (type === "cms") {
                                includedScripts.push(type + "-" + json.data.appId + "-" + flag);
                                if (json.data.appName) includedScripts.push(type + "-" + json.data.appName + "-" + flag);
                                if (json.data.appAlias) includedScripts.push(type + "-" + json.data.appAlias + "-" + flag);
                            } else if (type === "process") {
                                includedScripts.push(type + "-" + json.data.application + "-" + flag);
                                if (json.data.appName) includedScripts.push(type + "-" + json.data.appName + "-" + flag);
                                if (json.data.appAlias) includedScripts.push(type + "-" + json.data.appAlias + "-" + flag);
                            }
                        });

                        includedScripts = includedScripts.concat(json.data.importedList);
                        MWF.Macro.exec(json.data.text, this);
                        if (callback) callback.apply(this);
                    } else {
                        if (callback) callback.apply(this);
                    }
                }.bind(this), null, !!async);
            }
        };
        this.include = function (optionsOrName, callback, async) {
            if (o2.typeOf(optionsOrName) == "array") {
                if (!!async) {
                    var count = optionsOrName.length;
                    var loaded = 0;
                    optionsOrName.each(function (option) {
                        _includeSingle.apply(this, [option, function () {
                            loaded++;
                            if (loaded >= count) if (callback) callback.apply(this);
                        }.bind(this), true]);
                    }.bind(this));

                } else {
                    optionsOrName.each(function (option) {
                        _includeSingle.apply(this, [option]);
                    }.bind(this));
                    if (callback) callback.apply(this);
                }
            } else {
                _includeSingle.apply(this, [optionsOrName, callback, async])
            }
        };

        this.define = function (name, fun, overwrite) {
            var over = true;
            if (overwrite === false) over = false;
            var o = {};
            o[name] = {"value": fun, "configurable": over};
            MWF.defineProperties(this, o);
        }.bind(this);

        //?????????????????????????????????????????????????????????????????????????????????????????????
        //????????????????????? var resolve = this.wait();
        //???????????????????????? ?????? resolve.cb()???
        //?????????????????????queryload????????????????????????
        this.wait = function () {
            resolve = {};
            var setResolve = function (callback) {
                resolve.cb = callback;
            }.bind(this);
            this.target.event_resolve = setResolve;
            return resolve;
        };
        //???this.wait???????????????
        //????????????????????????resolve.cb??????????????????
        //???????????????????????????this.goon();?????????????????????
        this.goon = function () {
            this.target.event_resolve = null;
        };

        //???????????????-----------------------------------------
        //form
        /**
         * page?????????????????????????????????????????????????????????form?????????<b>???????????????????????????</b><br/>
         * @module page
         * @o2cn ????????????
         * @o2category web
         * @o2range {Portal}
         * @o2ordernumber 50
         * @o2syntax
         * //????????????????????????????????????this?????????page??????????????????
         * var page = this.page;
         */
        this.page = this.form = {
            /** ???????????????????????????????????????<b>?????????????????????????????????</b>
             * @method toPage
             * @static
             * @param {String} name - ????????????????????????
             * @param {Object} [par] - ??????????????????????????????????????????????????????????????????this.page.parameters??????
             * @param {Boolean} [nohis] - ??????????????????????????????History?????????????????????????????????false
             * @o2syntax
             * //???????????????????????????????????????
             * this.page.toPage( name, par, nohis );
             * @example
             * this.page.toPage("????????????", {"key": "????????????"});//??????????????????????????????????????????json?????????
             *
             * //???????????????????????????this.page.parameters????????????????????????
             * var key = this.page.parameters.key; //key="????????????"
             */
            "toPage": function (name, par, nohis) {
                _form.app.toPage(name, par, nohis);
            },

            /** ??????????????????????????????<b>?????????????????????????????????</b>
             * @method toPortal
             * @static
             * @param {String} portal - ???????????????????????????
             * @param {String} [page] - ?????????????????????????????????????????????????????????????????????????????????
             * @param {String} [par] - ??????????????????????????????this.page.parameters?????????
             * @o2syntax
             * this.page.toPortal( portal, page, par );
             * @example
             * this.page.toPortal("????????????", "????????????", {"key": "????????????"});//???????????????????????????????????????????????????????????????json?????????
             *
             * //???????????????????????????this.page.parameters????????????????????????
             * var key = this.page.parameters.key; //key="????????????"
             */
            "toPortal": function (portal, page, par) {
                _form.app.toPortal(portal, page, par);
            },
            /**?????????????????????????????????
             * @method getInfor
             * @static
             * @see module:form.getInfor
             */
            "getInfor": function () {
                return ev.pageInfor;
            },
            "infor": ev.pageInfor,
            /**???????????????????????????component?????????
             * @method getApp
             * @static
             * @see module:form.getApp
             */
            "getApp": function () {
                return _form.app;
            },
            "app": _form.app,
            /**??????page?????????DOM?????????
             * @method node
             * @static
             * @see module:form.node
             */
            "node": function () {
                return _form.node;
            },
            //"readonly": _form.options.readonly,
            /**???????????????????????????
             * @method get
             * @static
             * @see module:form.get
             */
            "get": function(name,subformName ){
                if( !_form.all )return null;
                if( subformName ){
                    if( _form.all[subformName +"_"+ name] )return _form.all[subformName +"_"+ name];
                    return _form.all[name];
                }else{
                    return _form.all[name];
                }
                // return (_form.all) ? _form.all[name] : null;
            },

            /**?????????????????????????????????<br/>
             * @method getWidgetModule
             * @static
             * @param {String} widgetId  - ??????????????????????????????????????????
             * @param {String} fieldId  - ????????????????????????
             * @return {FormComponent} ?????????????????????Classes????????????FormComponents???
             * @see module:form.get
             * @o2syntax
             * this.page.getWidgetModule( widgetId, fieldId );
             * @example
             * <caption>
             * 1???????????????????????????????????????????????????subject???<br/>
             * 2??????????????????????????????1???????????????????????????????????????widget_1, widget_2???
             * </caption>
             * var module = this.page.getWidgetModule( "widget_1", "subject"); //??????widget_1???subject??????
             * var data2 = this.page.getWidgetModule( "widget_2", "subject").getData(); //??????widget_2???subject????????????
             */
            "getWidgetModule": function (widget, moduleName) {
                if (!_form.widgetModules || !_form.widgetModules[widget]) return null;
                var module = _form.widgetModules[widget][moduleName];
                return module || null;
            },
            /**?????????????????????????????????????????????
             * @method getField
             * @static
             * @see module:form.getField
             */
            "getField": function (name) {
                return _forms[name];
            },
            "getAction": function () {
                return _form.workAction
            },
            "getDesktop": function () {
                return _form.app.desktop
            },

            "getData": function () {
                return new MWF.xScript.JSONData(_form.getData());
            },
            //"save": function(callback){_form.saveWork(callback);},

            /**??????????????????
             * @method close
             * @static
             * @see module:form.close
             */
            "close": function () {
                _form.closeWork();
            },

            "print": function (application, form) {
                _form.printWork(application, form);
            },

            /**?????????????????????
             * @method confirm
             * @static
             * @see module:form.confirm
             */
            "confirm": function (type, title, text, width, height, ok, cancel, callback, mask, style) {
                // var p = MWF.getCenter({"x": width, "y": height});
                // e = {"event": {"clientX": p.x,"x": p.x,"clientY": p.y,"y": p.y}};
                // _form.confirm(type, e, title, text, width, height, ok, cancel, callback, mask, style);
                if ((arguments.length <= 1) || o2.typeOf(arguments[1]) === "string") {
                    var p = MWF.getCenter({"x": width, "y": height});
                    e = {"event": {"clientX": p.x, "x": p.x, "clientY": p.y, "y": p.y}};
                    _form.confirm(type, e, title, text, width, height, ok, cancel, callback, mask, style);
                } else {
                    e = (arguments.length > 1) ? arguments[1] : null;
                    title = (arguments.length > 2) ? arguments[2] : null;
                    text = (arguments.length > 3) ? arguments[3] : null;
                    width = (arguments.length > 4) ? arguments[4] : null;
                    height = (arguments.length > 5) ? arguments[5] : null;
                    ok = (arguments.length > 6) ? arguments[6] : null;
                    cancel = (arguments.length > 7) ? arguments[7] : null;
                    callback = (arguments.length > 8) ? arguments[8] : null;
                    mask = (arguments.length > 9) ? arguments[9] : null;
                    style = (arguments.length > 10) ? arguments[10] : null;
                    _form.confirm(type, e, title, text, width, height, ok, cancel, callback, mask, style);
                }
            },
            /**???????????????????????????????????????
             * @method alert
             * @static
             * @see module:form.alert
             */
            "alert": function (type, title, text, width, height) {
                _form.alert(type, title, text, width, height);
            },

            /**?????????????????????
             * @method notice
             * @static
             * @see module:form.notice
             */
            "notice": function (content, type, target, where, offset, option) {
                _form.notice(content, type, target, where, offset, option);
            },
            /**????????????????????????
             * @method addEvent
             * @static
             * @see module:form.addEvent
             */
            "addEvent": function (e, f) {
                _form.addEvent(e, f);
            },

            "openWindow": function (form, app) {
                _form.openWindow(form, app);
            },

            /**????????????????????????????????????????????????
             * @method openWork
             * @static
             * @see module:form.openWork
             */
            "openWork": function (id, completedId, title, options) {
                var op = options || {};
                op.workId = id;
                op.workCompletedId = completedId;
                op.docTitle = title;
                op.appId = "process.Work" + (op.workId || op.workCompletedId);
                return layout.desktop.openApplication(this.event, "process.Work", op);
            },
            /**???????????????jobId????????????
             * @method openJob
             * @static
             * @see module:form.openJob
             */
            "openJob": function (id, choice, options) {
                var workData = null;
                o2.Actions.get("x_processplatform_assemble_surface").listWorkByJob(id, function (json) {
                    if (json.data) workData = json.data;
                }.bind(this), null, false);

                if (workData) {
                    var len = workData.workList.length + workData.workCompletedList.length;
                    if (len) {
                        if (len > 1 && choice) {
                            var node = new Element("div", {
                                "styles": {
                                    "padding": "20px",
                                    "width": "500px"
                                }
                            }).inject(_form.node);
                            workData.workList.each(function (work) {
                                var workNode = new Element("div", {
                                    "styles": {
                                        "background": "#ffffff",
                                        "border-radius": "10px",
                                        "clear": "both",
                                        "margin-bottom": "10px",
                                        "height": "40px",
                                        "padding": "10px 10px"
                                    }
                                }).inject(node);
                                var html = "<div style='height: 40px; width: 40px; float: left; background: url(../x_component_process_Xform/$Form/default/icon/work.png) no-repeat center center'></div>" +
                                    "<div style='height: 40px; width: 40px; float: right'><div class='MWFAction' style='height: 20px; width: 40px; margin-top: 10px; border: 1px solid #999999; border-radius: 5px;text-align: center; cursor: pointer'>" + o2.LP.widget.open + "</div></div>" +
                                    "<div style='height: 20px; line-height: 20px; margin: 0px 40px'>" + work.title + "</div>" +
                                    "<div style='margin: 0px 40px'><div style='color:#999999; float: left; margin-right: 10px'>" + work.activityName + "</div>" +
                                    "<div style='color:#999999; float: left; margin-right: 10px'>" + work.activityArrivedTime + "</div>" +
                                    "<div style='color:#999999; float: left; margin-right: 10px'>" + (work.manualTaskIdentityText || "") + "</div></div>";
                                workNode.set("html", html);
                                var action = workNode.getElement(".MWFAction");
                                action.store("work", work);
                                action.addEvent("click", function (e) {
                                    var work = e.target.retrieve("work");
                                    if (work) this.openWork(work.id, null, work.title, options);
                                    dlg.close();
                                }.bind(this));

                            }.bind(this));
                            workData.workCompletedList.each(function (work) {
                                var workNode = new Element("div", {
                                    "styles": {
                                        "background": "#ffffff",
                                        "border-radius": "10px",
                                        "clear": "both",
                                        "margin-bottom": "10px",
                                        "height": "40px",
                                        "padding": "10px 10px"
                                    }
                                }).inject(node);
                                var html = "<div style='height: 40px; width: 40px; float: left; background: url(../x_component_process_Xform/$Form/default/icon/work.png) no-repeat center center'></div>" +
                                    "<div style='height: 40px; width: 40px; float: right'><div class='MWFAction' style='height: 20px; width: 40px; margin-top: 10px; border: 1px solid #999999; border-radius: 5px;text-align: center; cursor: pointer'>" + o2.LP.widget.open + "</div></div>" +
                                    "<div style='height: 20px; line-height: 20px; margin: 0px 40px'>" + work.title + "</div>" +
                                    "<div style='margin: 0px 40px'><div style='color:#999999; float: left; margin-right: 10px'>" + o2.LP.widget.workcompleted + "</div>" +
                                    "<div style='color:#999999; float: left; margin-right: 10px'>" + work.completedTime + "</div>";
                                workNode.set("html", html);
                                var action = workNode.getElement(".MWFAction");
                                action.store("work", work);
                                action.addEvent("click", function (e) {
                                    var work = e.target.retrieve("work");
                                    if (work) this.openWork(null, work.id, work.title, options);
                                    dlg.close();
                                }.bind(this));

                            }.bind(this));
                            var height = node.getSize().y + 20;
                            if (height > 600) height = 600;

                            var dlg = o2.DL.open({
                                "title": o2.LP.widget.choiceWork,
                                "style": "user",
                                "isResize": false,
                                "content": node,
                                "buttonList": [
                                    {
                                        "type": "cancel",
                                        "text": o2.LP.widget.close,
                                        "action": function () {
                                            dlg.close();
                                        }
                                    }
                                ]
                            });
                        } else {
                            if (workData.workList.length) {
                                var work = workData.workList[0];
                                return this.openWork(work.id, null, work.title, options);
                            } else {
                                var work = workData.workCompletedList[0];
                                return this.openWork(null, work.id, work.title, options);
                            }
                        }
                    }
                }
            },
            /**??????????????????????????????
             * @method openDocument
             * @static
             * @see module:form.openDocument
             */
            "openDocument": function (id, title, options) {
                var op = options || {};
                op.documentId = id;
                op.docTitle = title || "";
                op.appId = (op.appId) || ("cms.Document"+id);
                return layout.desktop.openApplication(this.event, "cms.Document", op);
            },
            /**????????????????????????
             * @method openPortal
             * @static
             * @see module:form.openPortal
             */
            "openPortal": function (name, page, par) {
                var action = MWF.Actions.get("x_portal_assemble_surface");
                action.getApplication(name, function (json) {
                    if (json.data) {
                        if (page) {
                            action.getPageByName(page, json.data.id, function (pageJson) {
                                var pageId = (pageJson.data) ? pageJson.data.id : "";
                                layout.desktop.openApplication(null, "portal.Portal", {
                                    "portalId": json.data.id,
                                    "pageId": pageId,
                                    "parameters": par,
                                    "appId": (par && par.appId) || ("portal.Portal" + json.data.id + pageId)
                                })
                            });
                        } else {
                            layout.desktop.openApplication(null, "portal.Portal", {
                                "portalId": json.data.id,
                                "parameters": par,
                                "appId": (par && par.appId) || ("portal.Portal" + json.data.id)
                            })
                        }
                    }

                });
            },
            /**??????????????????????????????????????????
             * @method openCMS
             * @static
             * @see module:form.openCMS
             */
            "openCMS": function (name) {
                var action = MWF.Actions.get("x_cms_assemble_control");
                action.getColumn(name, function (json) {
                    if (json.data) {
                        layout.desktop.openApplication(null, "cms.Module", {
                            "columnId": json.data.id,
                            "appId": "cms.Module" + json.data.id
                        });
                    }
                });
            },
            /**????????????????????????
             * @method openProcess
             * @static
             * @see module:form.openProcess
             */
            "openProcess": function (name) {
                var action = MWF.Actions.get("x_processplatform_assemble_surface");
                action.getApplication(name, function (json) {
                    if (json.data) {
                        layout.desktop.openApplication(null, "process.Application", {
                            "id": json.data.id,
                            "appId": "process.Application" + json.data.id
                        });
                    }
                });
            },
            /**????????????????????????component??????
             * @method openApplication
             * @static
             * @see module:form.openApplication
             */
            "openApplication": function (name, options) {
                return layout.desktop.openApplication(null, name, options);
            },
            /**??????????????????????????????
             * @method createDocument
             * @static
             * @see module:form.createDocument
             */
            "createDocument": function (columnOrOptions, category, data, identity, callback, target, latest, selectColumnEnable, ignoreTitle, restrictToColumn) {
                var column = columnOrOptions;
                var onAfterPublish, onPostPublish;
                if (typeOf(columnOrOptions) == "object") {
                    column = columnOrOptions.column;
                    category = columnOrOptions.category;
                    data = columnOrOptions.data;
                    identity = columnOrOptions.identity;
                    callback = columnOrOptions.callback;
                    target = columnOrOptions.target;
                    latest = columnOrOptions.latest;
                    selectColumnEnable = columnOrOptions.selectColumnEnable;
                    ignoreTitle = columnOrOptions.ignoreTitle;
                    restrictToColumn = columnOrOptions.restrictToColumn;
                    onAfterPublish = columnOrOptions.onAfterPublish;
                    onPostPublish = columnOrOptions.onPostPublish;
                }
                if (target) {
                    if (layout.app && layout.app.inBrowser) {
                        layout.app.content.empty();
                        layout.app = null;
                    }
                }

                MWF.xDesktop.requireApp("cms.Index", "Newer", function () {
                    var starter = new MWF.xApplication.cms.Index.Newer(null, null, _form.app, null, {
                        "documentData": data,
                        "identity": identity,

                        "ignoreTitle": ignoreTitle === true,
                        "ignoreDrafted": latest === false,
                        "selectColumnEnable": !category || selectColumnEnable === true,
                        "restrictToColumn": restrictToColumn === true || (!!category && selectColumnEnable !== true),

                        "categoryFlag": category, //category id or name
                        "columnFlag": column, //column id or name,
                        "onStarted": function (documentId, data, windowHandle) {
                            if (callback) callback(documentId, data, windowHandle);
                        },
                        "onPostPublish": function () {
                            if (onPostPublish) onPostPublish();
                        },
                        "onAfterPublish": function () {
                            if (onAfterPublish) onAfterPublish();
                        }
                    });
                    starter.load();
                })
            },
            /**????????????????????????
             * @method startProcess
             * @static
             * @see module:form.startProcess
             */
            "startProcess": function (app, process, data, identity, callback, target, latest) {
                if (arguments.length > 2) {
                    for (var i = 2; i < arguments.length; i++) {
                        if (typeOf(arguments[i]) == "boolean") {
                            target = arguments[i];
                            break;
                        }
                    }
                }

                if (target) {
                    if (layout.app && layout.app.inBrowser) {
                        //layout.app.content.empty();
                        layout.app.$openWithSelf = true;
                    }
                }
                if (!app || !process){
                    var cmpt = this.getApp();
                    o2.requireApp([["process.TaskCenter", "lp."+o2.language], ["process.TaskCenter", ""]],"", function(){
                        var obj = {
                            "lp": o2.xApplication.process.TaskCenter.LP,
                            "content": cmpt.content,
                            "addEvent": function(type, fun){
                                cmpt.addEvent(type, fun);
                            },
                            "getAction": function (callback) {
                                if (!this.action) {
                                    this.action = o2.Actions.get("x_processplatform_assemble_surface");
                                    if (callback) callback();
                                } else {
                                    if (callback) callback();
                                }
                            },
                            "desktop": layout.desktop,
                            "refreshAll": function(){},
                            "notice": cmpt.notice,
                        }
                        o2.JSON.get("../x_component_process_TaskCenter/$Main/default/css.wcss", function(data){
                            obj.css = data;
                        }, false);

                        if (!cmpt.processStarter) cmpt.processStarter = new o2.xApplication.process.TaskCenter.Starter(obj);
                        cmpt.processStarter.load();
                    }, true, true);
                    return "";
                }
                var action = MWF.Actions.get("x_processplatform_assemble_surface").getProcessByName(process, app, function (json) {
                    if (json.data) {
                        MWF.xDesktop.requireApp("process.TaskCenter", "ProcessStarter", function () {
                            var starter = new MWF.xApplication.process.TaskCenter.ProcessStarter(json.data, _form.app, {
                                "workData": data,
                                "identity": identity,
                                "latest": latest,
                                "onStarted": function (data, title, processName) {
                                    if (data.work) {
                                        var work = data.work;
                                        var options = {
                                            "draft": work,
                                            "appId": "process.Work" + (new o2.widget.UUID).toString(),
                                            "desktopReload": false
                                        };
                                        layout.desktop.openApplication(null, "process.Work", options);
                                    } else {
                                        var currentTask = [];
                                        data.each(function (work) {
                                            if (work.currentTaskIndex != -1) currentTask.push(work.taskList[work.currentTaskIndex].work);
                                        }.bind(this));

                                        if (currentTask.length == 1) {
                                            var options = {"workId": currentTask[0], "appId": currentTask[0]};
                                            layout.desktop.openApplication(null, "process.Work", options);
                                        } else {
                                        }
                                    }

                                    // var currentTask = [];
                                    // data.each(function (work) {
                                    //     if (work.currentTaskIndex != -1) currentTask.push(work.taskList[work.currentTaskIndex].work);
                                    // }.bind(this));
                                    //
                                    // if (currentTask.length == 1) {
                                    //     var options = { "workId": currentTask[0], "appId": currentTask[0] };
                                    //     layout.desktop.openApplication(null, "process.Work", options);
                                    // } else { }

                                    if (callback) callback(data);
                                }.bind(this)
                            });
                            starter.load();
                        }.bind(this));
                    }
                });
            },

            /**
             * ???????????????????????????????????????????????????????????????
             * @member parameters
             * @static
             * @return {Boolean} ???????????????????????????????????????????????????
             * @o2syntax
             * var par = this.page.parameters
             * @example
             * //??????????????????????????????
             * this.form.openPortal(id, "", {"type": "my type"});
             *
             * //???????????????????????????????????????????????????parameters???
             * var par = this.page.parameters;
             * //par????????????{"type": "my type"}
             */
            "parameters": _form.options.parameters,

            /**
             * ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
             * @method getWidgetPrameters
             * @static
             * @return {Object} ???????????????????????????????????????????????????
             * @o2syntax
             * var par = this.page.getWidgetPrameters();
             * @example
             * //????????????????????????????????????????????????
             * return {"type": "my type"};
             *
             * //???????????????????????????????????????parameters???
             * var par = this.page.getWidgetPrameters();
             * //par????????????{"type": "my type"}
             */
            "getWidgetPrameters": function () {
                if (!this.target) return null;
                if (!this.target.widget) return null;
                if (!this.widgetParameters) return null;
                var pageId = this.target.widget.json.id;
                return this.widgetParameters[pageId];
            }.bind(this)
            //"app": _form.app
        };
        this.form.currentRouteName = _form.json.currentRouteName;
        this.form.opinion = _form.json.opinion;

        this.target = ev.target;
        this.event = ev.event;
        this.status = ev.status;
        this.session = layout.desktop.session;
        this.Actions = o2.Actions;

        this.query = function (option) {
            // options = {
            //      "name": "statementName",
            //      "data": "json data",
            //      "firstResult": 1,
            //      "maxResults": 100,
            //      "success": function(){},
            //      "error": function(){},
            //      "async": true or false, default is true
            // }
            if (option) {
                var json = (option.data) || {};
                if (option.firstResult) json.firstResult = option.firstResult.toInt();
                if (option.maxResults) json.maxResults = option.maxResults.toInt();
                o2.Actions.get("x_query_assemble_surface").executeStatement(option.name, json, success, error, options.async);
            }
        };
        this.Table = MWF.xScript.createTable();
    };
}

if (!MWF.xScript.createTable) MWF.xScript.createTable = function(){
    return function(name){
        this.name = name;
        this.action = o2.Actions.load("x_query_assemble_surface").TableAction;

        this.listRowNext = function(id, count, success, error, async){
            this.action.listRowNext(this.name, id, count, success, error, async);
        };
        this.listRowPrev = function(id, count, success, error, async){
            this.action.listRowPrev(this.name, id, count, success, error, async);
        };
        this.listRowSelect = function(where, orderBy, size, success, error, async){
            this.action.listRowSelect(this.name, {"where": where, "orderBy": orderBy, "size": size || ""}, success, error, async);
        };
        this.listRowSelectWhere = function(where, success, error, async){
            this.action.listRowSelectWhere(this.name, where, success, error, async);
        };
        this.rowCountWhere = function(where, success, error, async){
            this.action.rowCountWhere(this.name, where, success, error, async);
        };
        this.deleteRow = function(id, success, error, async){
            this.action.rowDelete(this.name, id, success, error, async);
        };
        this.deleteAllRow = function(success, error, async){
            this.action.rowDeleteAll(this.name, success, error, async);
        };
        this.getRow = function(id, success, error, async){
            this.action.rowGet(this.name, id, success, error, async);
        };
        this.insertRow = function(data, success, error, async){
            this.action.rowInsert(this.name, data, success, error, async);
        };
        this.addRow = function(data, success, error, async){
            this.action.rowInsertOne(this.name, data, success, error, async);
        };
        this.updateRow = function(id, data, success, error, async){
            this.action.rowUpdate(this.name, id, data, success, error, async);
        };
    }
};
if (!MWF.xScript.JSONData) {
    var getArrayJSONData = function (jData, p, _form) {
        return new MWF.xScript.JSONData(jData, function (data, key, _self) {
            var p = {
                "getKey": function () {
                    return key;
                }, "getParent": function () {
                    return _self;
                }
            };
            while (p && !_form.forms[p.getKey()]) p = p.getParent();
            //if (p) if (p.getKey()) if (_forms[p.getKey()]) _forms[p.getKey()].resetData();
            var k = (p) ? p.getKey() : "";
            if (k) if (_form.forms[k]) if (_form.forms[k].resetData) _form.forms[k].resetData();
            //if(p) if(p.getKey()) if(_forms[p.getKey()]) if(_forms[p.getKey()].render) _forms[p.getKey()].render();
        }, "", p, _form);
    };
    MWF.xScript.JSONData = function (data, callback, key, parent, _form) {
        var getter = function (data, callback, k, _self) {
            return function () {
                var t = typeOf(data[k]);
                if (["array", "object"].indexOf(t) === -1) {
                    return data[k]
                } else {
                    if (t === "array") {
                        if (window.Proxy){
                            var arr = new Proxy(data[k], {
                                get: function(o, k){
                                    return (o2.typeOf(o[k])==="object") ? getArrayJSONData(o[k], _self, _form) : o[k];
                                },
                                set: function(o, k, v){
                                    o[k] = v;
                                    if (callback) callback(o, k, _self);
                                    return true;
                                }
                            });
                            return arr;
                        }else{
                            var arr =[];
                            data[k].forEach(function(d, i){
                                arr.push((o2.typeOf(d)==="object") ? getArrayJSONData(d, _self, _form) : d);
                            });
                            return arr;
                        }
                    } else {
                        return new MWF.xScript.JSONData(data[k], callback, k, _self, _form);
                    }
                    // var obj =
                    // if (t==="array") obj.constructor = Array;
                    // return obj;
                }
                //return (["array","object"].indexOf(typeOf(data[k]))===-1) ? data[k] : new MWF.xScript.JSONData(data[k], callback, k, _self, _form);
            };
        };
        var setter = function (data, callback, k, _self) {
            return function (v) {
                data[k] = v;
                //debugger;
                //this.add(k, v, true);
                if (callback) callback(data, k, _self);
            }
        };
        var define = function () {
            var o = {};
            for (var k in data) o[k] = {
                "configurable": true,
                "enumerable": true,
                "get": getter.apply(this, [data, callback, k, this]),
                "set": setter.apply(this, [data, callback, k, this])
            };
            o["length"] = {
                "get": function () {
                    return Object.keys(data).length;
                }
            };
            o["some"] = {
                "get": function () {
                    return data.some;
                }
            };
            MWF.defineProperties(this, o);

            var methods = {
                "getKey": {
                    "value": function () {
                        return key;
                    }
                },
                "getParent": {
                    "value": function () {
                        return parent;
                    }
                },
                "toString": {
                    "value": function () {
                        return data.toString();
                    }
                },
                "setSection": {
                    "value": function (newKey, newValue) {
                        this.add(newKey, newValue, true);
                        try {
                            var path = [this.getKey()];
                            p = this.getParent();
                            while (p && p.getKey()) {
                                path.unshift(p.getKey());
                                p = p.getParent();
                            }
                            if (path.length) _form.sectionListObj[path.join(".")] = newKey;
                        } catch (e) {

                        }
                    }
                },

                "add": {
                    "value": function (newKey, newValue, overwrite, noreset) {
                        if (arguments.length < 2 || newKey.indexOf("..") === -1) {
                            var flag = true;
                            var type = typeOf(data);
                            if (type === "array") {
                                if (arguments.length < 2) {
                                    data.push(newKey);
                                    newValue = newKey;
                                    newKey = data.length - 1;
                                } else {
                                    if (!newKey && newKey !== 0) {
                                        data.push(newValue);
                                        newKey = data.length - 1;
                                    } else {
                                        if (newKey >= data.length) {
                                            data.push(newValue);
                                            newKey = data.length - 1;
                                        } else {
                                            if (overwrite) data[newKey] = newValue;
                                            newValue = data[newKey];
                                            flag = false;
                                        }
                                    }
                                }
                                if (flag) {
                                    var o = {};
                                    o[newKey] = {
                                        "configurable": true,
                                        "enumerable": true,
                                        "get": getter.apply(this, [data, callback, newKey, this]),
                                        "set": setter.apply(this, [data, callback, newKey, this])
                                    };
                                    MWF.defineProperties(this, o);
                                }
                                if (!noreset) this[newKey] = newValue;
                            } else if (type === "object") {
                                if (!this.hasOwnProperty(newKey)) {
                                    if (!data[newKey] || overwrite) {
                                        data[newKey] = newValue;
                                    }
                                    newValue = data[newKey];

                                    if (flag) {
                                        var o = {};
                                        o[newKey] = {
                                            "configurable": true,
                                            "enumerable": true,
                                            "get": getter.apply(this, [data, callback, newKey, this]),
                                            "set": setter.apply(this, [data, callback, newKey, this])
                                        };
                                        MWF.defineProperties(this, o);
                                    }
                                    if (!noreset) this[newKey] = newValue;
                                } else {
                                    if (!Object.getOwnPropertyDescriptor(this, newKey).get){
                                        var o = {};
                                        o[newKey] = {"configurable": true, "enumerable": true, "get": getter.apply(this, [data, callback, newKey, this]),"set": setter.apply(this, [data, callback, newKey, this])};
                                        MWF.defineProperties(this, o);
                                    }
                                    if (overwrite) {
                                        data[newKey] = newValue;
                                        if (!noreset) this[newKey] = newValue;
                                    }
                                }
                            }
                            return this[newKey];
                        } else {
                            var keys = newKey.split("..");
                            var kk = keys.shift();
                            var d = this.add(kk, {}, false, true);
                            if (keys.length) return d.add(keys.join(".."), newValue, overwrite, noreset);
                            return d;
                        }
                    }
                },
                "check": {
                    "value": function (kk, v) {
                        this.add(kk, v || "", false, true);
                    }
                },
                "del": {
                    "value": function (delKey) {
                        if (!this.hasOwnProperty(delKey)) return null;
                        // delete data[delKey];
                        // delete this[delKey];
                        data[delKey] = "";
                        this[delKey] = "";
                        return this;
                    }
                }
            };
            MWF.defineProperties(this, methods);

            //this.getKey = function(){ return key; };
            //this.getParent = function(){ return parent; };
            //this.toString = function() { return data.toString();};
            //this.add = function(newKey, newValue, overwrite){
            //    var flag = true;
            //    var type = typeOf(data);
            //    if (!this.hasOwnProperty(newKey)){
            //        if (type=="array"){
            //            if (arguments.length<2){
            //                data.push(newKey);
            //                newValue = newKey;
            //                newKey = data.length-1;
            //            }else{
            //                debugger;
            //                if (!newKey && newKey!=0){
            //                    data.push(newValue);
            //                    newKey = data.length-1;
            //                }else{
            //                    flag == false;
            //                }
            //            }
            //        }else{
            //            data[newKey] = newValue;
            //        }
            //        //var valueType = typeOf(newValue);
            //        //var newValueData = newValue;
            //        //if (valueType=="object" || valueType=="array") newValueData = new MWF.xScript.JSONData(newValue, callback, newKey, this);
            //        //if (valueType=="null") newValueData = new MWF.xScript.JSONData({}, callback, newKey, this);
            //        if (flag){
            //            var o = {};
            //            o[newKey] = {"configurable": true, "enumerable": true, "get": getter.apply(this, [data, callback, newKey, this]),"set": setter.apply(this, [data, callback, newKey, this])};
            //            MWF.defineProperties(this, o);
            //        }
            //        this[newKey] = newValue;
            //    }else{
            //        if (overwrite) this[newKey] = newValue;
            //    }
            //
            //    //var valueType = typeOf(newValue);
            //    //var newValueData = newValue;
            //    //if (valueType=="object" || valueType=="array") newValueData = new MWF.xScript.JSONData(newValue, callback, newKey, this);
            //    //if (valueType=="null") newValueData = new MWF.xScript.JSONData({}, callback, newKey, this);
            //    //
            //    //this[newKey] = newValueData;
            //
            //    return this[newKey];
            //};
            //this.del = function(delKey){
            //    if (!this.hasOwnProperty(delKey)) return null;
            //    delete data[newKey];
            //    delete this[newKey];
            //    return this;
            //};
        };

        var type = typeOf(data);
        if (type === "object" || type === "array") define.apply(this);
    };
}
if( !MWF.xScript.dictLoaded )MWF.xScript.dictLoaded = {};

if (!MWF.xScript.createDict) {
    MWF.xScript.addDictToCache = function (options, path, json) {
        if (!path) path = "root";
        if (path.indexOf("root") !== 0) path = "root." + path;

        var type = options.appType || "process";
        var enableAnonymous = ( options.enableAnonymous || options.anonymous ) || false;

        var appFlagList = [];
        if (options.application) appFlagList.push(options.application);
        if (options.appId) appFlagList.push(options.appId);
        if (options.appName) appFlagList.push(options.appName);
        if (options.appAlias) appFlagList.push(options.appAlias);

        var dictFlagList = [];
        if (options.id) dictFlagList.push(options.id);
        if (options.name) dictFlagList.push(options.name);
        if (options.alias) dictFlagList.push(options.alias);

        var cache = {};
        cache[path] = json;

        for (var i = 0; i < appFlagList.length; i++) {
            for (var j = 0; j < dictFlagList.length; j++) {
                var k = dictFlagList[j] + type + appFlagList[i] + enableAnonymous;
                if (!MWF.xScript.dictLoaded[k]) {
                    MWF.xScript.dictLoaded[k] = cache; //?????????????????????
                    // MWF.xScript.dictLoaded[k][path] = json; //?????????????????????
                } else if (i === 0 && j === 0) {
                    MWF.xScript.setDictToCache(k, path, json);
                    var arr = path.split(/\./g);
                    var p;
                    var cache = MWF.xScript.dictLoaded[k];
                    for (var l = 0; l < arr.length; l++) {
                        p = l === 0 ? arr[0] : (p + "." + arr[l]);
                        if (cache[p]) break;
                    }
                    if (p) {
                        var mathP = p + ".";
                        Object.keys(cache).each(function (path, idx) {
                            if (path.indexOf(mathP) === 0) delete cache[path];
                        })
                    }
                }
            }
        }
    };

    MWF.xScript.getMatchedDict = function (key, path) {
        if (!path) path = "root";
        if (path.indexOf("root") !== 0) path = "root." + path;

        var arr = path.split(/\./g);
        if (MWF.xScript.dictLoaded[key]) {
            var dicts = MWF.xScript.dictLoaded[key];
            var list = Array.clone(arr);
            var p;
            var dict;
            for (var i = 0; i < arr.length; i++) {
                p = i === 0 ? arr[0] : (p + "." + arr[i]);
                list.shift();
                if (dicts[p]) {
                    dict = dicts[p];
                    break;
                }
            }
            return {
                dict: dict,
                unmatchedPathList: list
            }
        }
        return {
            dict: null,
            unmatchedPathList: list
        }
    };

    MWF.xScript.insertDictToCache = function (key, path, json) {
        var p = path;
        if( !p )p = "root";
        if( p.indexOf("root") !== 0 )p = "root." + p ;

        if (MWF.xScript.dictLoaded[key]) {
            var matchedDict = MWF.xScript.getMatchedDict(key, path);
            var dict = matchedDict.dict;
            var list = matchedDict.unmatchedPathList;
            if (!dict) {
                MWF.xScript.dictLoaded[key][p] = json;
            }else if( !list || list.length === 0 ){
                MWF.xScript.dictLoaded[key][p] = json;
            } else {
                for (var j = 0; j < list.length - 1; j++) {
                    if (!dict[list[j]]) {
                        dict[list[j]] = {};
                    }
                    dict = dict[list[j]];
                }
                var lastPath = list[list.length - 1];
                if (!dict[lastPath]) {
                    dict[lastPath] = json;
                } else if (typeOf(dict[lastPath]) === "array") {
                    dict[lastPath].push(json);
                }
            }
        } else {
            MWF.xScript.dictLoaded[key] = {};
            MWF.xScript.dictLoaded[key][p] = json;
        }
    };

    MWF.xScript.setDictToCache = function (key, path, json) {
        var p = path;
        if( !p )p = "root";
        if( p.indexOf("root") !== 0 )p = "root." + p ;

        if (MWF.xScript.dictLoaded[key]) {
            var matchedDict = MWF.xScript.getMatchedDict(key, path);
            var dict = matchedDict.dict;
            var list = matchedDict.unmatchedPathList;
            if (!dict) {
                MWF.xScript.dictLoaded[key][p] = json;
            }else if( !list || list.length === 0 ){
                MWF.xScript.dictLoaded[key][p] = json;
            } else {
                for (var j = 0; j < list.length - 1; j++) {
                    if (!dict[list[j]]) {
                        dict[list[j]] = {};
                    }
                    dict = dict[list[j]];
                }
                dict[list[list.length - 1]] = json;
            }
        } else {
            MWF.xScript.dictLoaded[key] = {};
            MWF.xScript.dictLoaded[key][p] = json;
        }
    };

    MWF.xScript.getDictFromCache = function (key, path) {
        var matchedDict = MWF.xScript.getMatchedDict(key, path);
        var dict = matchedDict.dict;
        var list = matchedDict.unmatchedPathList;
        if (dict) {
            for (var j = 0; j < list.length; j++) {
                dict = dict[list[j]];
                if (!dict) return null;
            }
            return dict;
        }
        return null;
    };

    MWF.xScript.deleteDictToCache = function (key, path) {
        var matchedDict = MWF.xScript.getMatchedDict(key, path);
        var dict = matchedDict.dict;
        var list = matchedDict.unmatchedPathList;

        if (dict) {
            for (var j = 0; j < list.length - 1; j++) {
                dict = dict[list[j]];
                if (!dict) return;
            }
            if( list.length ){
                delete dict[list[list.length - 1]];
            }
        }
    };

    MWF.xScript.createDict = function (application) {
        //optionsOrName : {
        //  type : "", //?????????process, ?????????  process  cms
        //  application : "", //??????/CMS?????????/??????/id, ?????????????????????
        //  name : "", // ??????????????????/??????/id
        //  anonymous : false //????????????????????????????????????CMS?????????????????? ???????????????????????? enableAnonymous
        //}
        //??????name: "" // ??????????????????/??????/id
        return function (optionsOrName) {
            var options = optionsOrName;
            if (typeOf(options) == "string") {
                options = {name: options};
            }
            var name = this.name = options.name;
            var type = (options.type && options.application) ? options.type : "process";
            var applicationId = options.application || application;
            var enableAnonymous = ( options.enableAnonymous || options.anonymous ) || false;

            var opt = {
                "appType": type,
                "name": name,
                "appId": applicationId,
                "enableAnonymous": enableAnonymous
            };

            var key = name + type + applicationId + enableAnonymous;
            // if (!dictLoaded[key]) dictLoaded[key] = {};
            // this.dictData = dictLoaded[key];

            //MWF.require("MWF.xScript.Actions.DictActions", null, false);
            if (type == "cms") {
                var action = MWF.Actions.get("x_cms_assemble_control");
            } else {
                var action = MWF.Actions.get("x_processplatform_assemble_surface");
            }

            var encodePath = function (path) {
                var arr = path.split(/\./g);
                var ar = arr.map(function (v) {
                    return encodeURIComponent(v);
                });
                return ar.join("/");
            };

            this.get = function (path, success, failure, async, refresh) {
                var value = null;

                if (success === true) async = true;
                if (failure === true) async = true;

                if (!refresh) {
                    var data = MWF.xScript.getDictFromCache(key, path);
                    if (data) {
                        if (success && o2.typeOf(success) == "function") success(data);
                        if (!!async) {
                            return Promise.resolve(data);
                        } else {
                            return data;
                        }
                    }
                }

                // var cb = function(json){
                //     value = json.data;
                //     MWF.xScript.addDictToCache(opt, path, value);
                //     if (success && o2.typeOf(success)=="function") value = success(json.data);
                //     return value;
                // }.ag().catch(function(xhr, text, error){ if (failure && o2.typeOf(failure)=="function") return failure(xhr, text, error); });

                var cb = function (json) {
                    value = json.data;
                    MWF.xScript.addDictToCache(opt, path, value);
                    if (success && o2.typeOf(success) == "function") value = success(json.data);
                    return value;
                };

                var promise;
                if (path) {
                    var p = encodePath(path);
                    //var p = path.replace(/\./g, "/");
                    promise = action[((enableAnonymous && type == "cms") ? "getDictDataAnonymous" : "getDictData")](encodeURIComponent(this.name), applicationId, p, cb, null, !!async, false);
                } else {
                    promise = action[((enableAnonymous && type == "cms") ? "getDictRootAnonymous" : "getDictRoot")](this.name, applicationId, cb, null, !!async, false);
                }
                return (!!async) ? promise : value;

                // if (path){
                //     var p = encodePath( path );
                //     //var p = path.replace(/\./g, "/");
                //     action[ ( (enableAnonymous && type == "cms") ? "getDictDataAnonymous" : "getDictData" ) ](encodeURIComponent(this.name), applicationId, p, function(json){
                //         value = json.data;
                //         // this.dictData[path] = value;
                //         MWF.xScript.addDictToCache(opt, path, value);
                //         if (success) success(json.data);
                //     }.bind(this), function(xhr, text, error){
                //         if (failure) failure(xhr, text, error);
                //     }, !!async);
                // }else{
                //     action[ ( (enableAnonymous && type == "cms") ? "getDictRootAnonymous" : "getDictRoot" ) ](this.name, applicationId, function(json){
                //         value = json.data;
                //         // this.dictData["root"] = value;
                //         MWF.xScript.addDictToCache(opt, path, value);
                //         if (success) success(json.data);
                //     }.bind(this), function(xhr, text, error){
                //         if (failure) failure(xhr, text, error);
                //     }, !!async);
                // }

                //return value;
            };

            this.set = function (path, value, success, failure) {
                var p = encodePath(path);
                //var p = path.replace(/\./g, "/");
                return action.setDictData(encodeURIComponent(this.name), applicationId, p, value, function (json) {
                    MWF.xScript.setDictToCache(key, path, value);
                    if (success) return success(json.data);
                }, function (xhr, text, error) {
                    if (failure) return failure(xhr, text, error);
                }, false, false);
            };
            this.add = function (path, value, success, failure) {
                var p = encodePath(path);
                //var p = path.replace(/\./g, "/");
                return action.addDictData(encodeURIComponent(this.name), applicationId, p, value, function (json) {
                    MWF.xScript.insertDictToCache(key, path, value);
                    if (success) return success(json.data);
                }, function (xhr, text, error) {
                    if (failure) return failure(xhr, text, error);
                }, false, false);
            };
            this["delete"] = function (path, success, failure) {
                var p = encodePath(path);
                //var p = path.replace(/\./g, "/");
                return action.deleteDictData(encodeURIComponent(this.name), applicationId, p, function (json) {
                    MWF.xScript.deleteDictToCache(key, path);
                    if (success) return success(json.data);
                }, function (xhr, text, error) {
                    if (failure) return failure(xhr, text, error);
                }, false, false);
            };
            this.destory = this["delete"];
        }
    };
}
