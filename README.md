<p align="center">
	<a target="_blank" href="https://github.com/o2oa/o2oa/blob/develop/LICENSE"><img alt="GitHub license" src="https://img.shields.io/github/license/o2oa/o2oa"></a>
	<a target="_blank" href="https://www.oracle.com/technetwork/java/javase/downloads/index.html">
		<img src="https://img.shields.io/badge/JDK-11-green" />
	</a>
	<a target="_blank" href="https://gitee.com/o2oa/O2OA/stargazers">
		<img src="https://gitee.com/o2oa/O2OA/badge/star.svg?theme=dark" alt='gitee star'/>
	</a>
	<a target="_blank" href="https://github.com/o2oa/o2oa/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/o2oa/o2oa?style=social"></a>
</p>

----------------------------------------------------------------------------


# O2OA : Java企业信息化系统,开源OA openSource OA Platform

​        O2OA企业应用开发平台是兰德纵横网络技术股份有限公司发布和维护的开源产品，是使用JavaEE技术栈，分布式架构设计的一款真正全代码开源的企业应用定制化开发平台。适用于企业OA、协同办公类信息化系统的建设和开发。

​        平台拥有流程管理、门户管理、信息管理、数据管理和服务管理五大核心能力。用户可以直接使用平台已有功能进行信息信息化建设，平台提供了完整的用户管理，权限管理，流程和信息管理体系，并且提供了大量的开发组件和开箱即用的应用，可以大幅度减化企业信息化建设成本和业务应用开发难度。

![o2oa](https://static.oschina.net/uploads/space/2018/0918/200301_N9TG_3931542.png)



# **2021年免费培训报名开启**

### **课程名称：** O2OA企业级协同业务实战课程

### **课程内容：** 平台基础使用以及高级业务定制

①平台使用（组织管理，流程管理，门户搭建，内容管理，移动办公，数据中心，服务管理，应用介绍）；
②业务实战（信创环境，高可用性，单点认证，钉钉微信集成，国标公文系统，office在线协作，数据可视化，协同办公）。

#### 近60小时企业级业务实战课程，干货满满，欢迎大家报名参加！

![o2oa](https://www.o2oa.net/imagex/1024.png)




# 产品特点:

1. 代码全部开源，开发者可以下载源码进行任意，编译成自己的信息化平台。

2. 平台全功能免费，无任何功能和人数限制。

3. 支持私有化部署，下载软件安装包后可以安装在自己的服务器上，数据更安全。

4. 随时随地办公，平台支持兼容HTML5的浏览器，并且提供了原生的IOS/Android应用，并且支持钉钉和企业微信集成。

5. 高可扩展性，用户通过简单的学习后，可以自定义配置门户、流程应用、内容管理应用

   更多的产品介绍、使用说明、下载、在线体验、API及讨论请移步官网：[http://www.o2oa.net/](http://www.o2oa.net/)




# 官方网站:

开源主页 : https://www.oschina.net/p/o2oa

官方网站 : http://www.o2oa.net




# 关于正式环境数据安全相关的建议:

O2OA自带的H2数据库是一个内嵌式的内存数据库，适合用于开发环境、功能演示环境，并不适合用作正式环境。

如果作为正式环境使用，建议您使用拥有更高性能，更加稳定的商用级别数据库。如Mysql8，Oracle12C，SQLServer 2012等。

另外，O2OA提供数据定期备份和恢复的能力，建议您开启正式环境的数据定期备份的功能，以确保数据库异常时可以进行数据恢复。





## 支持操作系统：

```shell
Windows 64Bit, Linux 64Bit[CentOS, RedHat, Ubuntu等], MacOS, AIX, Raspberrypi(树莓派),

ARM_Linux,

MIPS_Linux,

UOS,麒麟等国产操作系统
```



## 支持数据库：

```shell
自带H2数据库.

第三方数据库: Apache Derby, Borland Interbase, Borland JDataStore, DB2, Empress, Firebird, H2 Database Engine, 
              Hypersonic Database Engine, Informix Dynamic Server, Ingres Database, InterSystems Cache,
              Microsoft Access, Microsoft SQL Server, Microsoft Visual FoxPro, MySQL, Oracle, Pointbase,
              PostgreSQL, IBM solidDB, Sybase Adaptive Server Enterprise, 达梦DM7+, 人大金仓, 南大通用, 神通数据库
```



# 官方网盘下载:

百度云盘：https://pan.baidu.com/s/1oBQ1atXGyXdLaYE5uAqF1w   提取码: pnk9




# 服务器部署教程：

Windows环境：https://www.o2oa.net/course/qq5gny.html

Linux环境：https://www.o2oa.net/course/yto8af.html



## 平台使用手册：

https://www.o2oa.net/course/



# 源码编译使用教程:

http://www.o2oa.net/course/ng5iqb.html





# 最新版本 v6.3.x:

功能新增

[通用]HTML编辑器CKEditor升级到4161，增加了阅读状态的图片延迟加载功能、浏览原图功能。涉及的应用有流程表单、内容管理表单和论坛帖子

[数据中心]新增了查询视图中导出Excel的功能

[内容管理]新增了内容管理文档的操作条中置顶的功能，并为内容管理列表增加置顶标记

[服务管理]新增了服务管理的代理和接口开发界面调试的功能

[流程管理]新增了表单设计界面增加数据模板的时候带入默认相关组件，数据模板导出字段配置自动获取的功能

[流程管理]新增了onlyoffice控件

[流程管理]新增了wps控件

[流程管理]新增了金格控件

[流程管理]新增了永中控件

[流程管理]新增了LibreOffice预览

[移动办公]新增了微信公众号，关注回复的消息的功能

[移动办公]新增了企业微信考勤数据导入查询功能

[移动办公]新增了移动端App支持tokenName修改的功能

[移动办公]新增了移动端App支持通讯录权限控制的功能

[移动办公]新增了移动端App个人信息页面的个人属性展现的功能

[数据库]新增了南大通用GBASE华库数据库支持

[日志]新增了服务器http request access log

[流程平台]新增了流程起草权限增加群组设置的功能

[内容管理]新增了根据条件查找附件的接口

[流程平台]新增了流程起草增加权限校验

[人员组织]新增了人员组织管理模块接口mockput和mockdelete

[流程平台]新增了待办、待阅根据title查询

[平台架构]新增了平台审计日志自定义程序分析功能

[流程平台]增加了公文编辑器转换Word后加密的功能

[流程平台]增加了公文编辑器加盖图片章的功能

[流程平台]新增了公文编辑器增加标题字体定义的功能

[流程平台]新增了公文编辑器保证版记在偶数页的功能

[流程平台]新增了公文编辑器增加附件内容编辑的功能

[流程平台]新增了公文编辑器增加编辑器属性配置的功能

[平台架构]新增了主菜单排序设置功能，管理员可设置默认和强制方式

[平台架构]新增了一组ElementUI组件

功能优化

[考勤管理]优化了考勤管理界面

[脚本API]优化了脚本API（增加了后台脚本API,增加了发送待阅、添加参阅）

[内容管理]优化了内容管理表单事件，增加postSave、 postPublish

[内容管理]整理了内容管理操作条的图标

[移动办公]优化了主题切换功能

[移动办公]优化了移动端已阅意见功能支持

[移动办公]O2云连接配置UI修改，以及一些页面功能调整优化

[移动办公]优化了移动端App分享功能

[移动办公]优化了移动端App拍照功能

[服务器]集群增加健康检查

[服务器]优化了线程池

[服务器]优化了缓存机制

[认证]验证码改为全匹配,并更新验证码实现

[内容管理]优化了文档发布消息发送条件，未配置消息类型不往消息处理器发送消息

[人员组织]优化了人员身份唯一编码，使其根据组织编码和人员唯一编码生成

[内容管理]优化了文档权限刷新，增加多线程处理，增加根据文档类型刷新权限

[内容管理]优化了分页查询的查询速度

[内容管理]优化了review表索引，减少不必要索引，增加联合索引

[流程平台]优化了公文编辑器格式展现

[流程平台]公文编辑器粘贴表格时，控制合适的宽度

[流程平台]公文编辑器只有一个附件时不显示序号

[平台架构]修复this.data绑定的Array数据类型问题

[平台优化]基于Authorization请求头的系统认证

问题修复

[流程管理]修复了重置处理人未剔除待办人的问题

[流程管理]修复了人员选择保存范围刷新后变回精简的问题

[内容管理]修复了内容管理设计端语言包上的一些问题

[流程管理]修复了表单Tab组件设置宽度无效的问题

[流程管理]修复了表单中TextArea组件只读时setData的问题

[流程管理]修复了数据表格移动端条目为0时无添加按钮的问题

[移动办公]修复了钉钉、企业微信考勤数据展现的bug

[流程引擎]修复了定时节点无法清空已选值的bug

[内容管理]修复了文档阅读记录出现cipher用户的问题

[内容管理]修复了根据创建时间查询文档错误的问题

[流程平台]修复了根据状态分页查找work的bug

[内容管理]修复了文档保存时未保存置顶信息的问题

[流程平台]修复了执行this.data.save脚本时，在表单未载入完全时，可能造成数据丢失的问题

[平台架构]修复了loadCss方法会多次载入的问题

[流程平台]去除流程启动前和流程结束前两个事件

[平台架构]修复Promise的uncatch错误



### 若开发者学习研究O2OA，企业在O2OA应用开发平台上建设内部使用的办公系统，不闭源分发版本，不参与商业项目的使用行为不会构成侵权风险。

### 如果需要进行转售，闭源分发或者在商业项目中作为项目的一部分使用，请主动联系兰德网络公司购买商用许可。

商用许可说明：https://www.o2oa.net/license.html

技术支持服务：https://www.o2oa.net/support.html



# 协议

[AGPL-3.0 开源协议。](./LICENSE)



# 关于

[![img](https://www.o2oa.net/imagex/logo_all@1.5x.png)](./assets/O2OA-logo.jpg)



O2OA开发平台是由 **浙江兰德纵横网路技术股份有限公司** 建立和维护的。O2OA 的名字和标志是属于 **浙江兰德纵横网路技术股份有限公司** 的注册商标。

我们 ❤️ 开源软件！看一下[我们的其他开源项目](https://github.com/o2oa)，瞅一眼[我们的博客](https://my.oschina.net/o2oa)。