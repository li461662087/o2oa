package com.x.message.assemble.communicate;

import java.net.URLEncoder;

import com.x.base.core.project.message.MessageConnector;
import org.apache.commons.lang3.StringUtils;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.connection.HttpConnection;
import com.x.base.core.project.gson.XGsonBuilder;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.queue.AbstractQueue;
import com.x.base.core.project.tools.DefaultCharset;
import com.x.message.assemble.communicate.message.QiyeweixinMessage;
import com.x.message.core.entity.Message;

public class QiyeweixinConsumeQueue extends AbstractQueue<Message> {

	private static final Logger LOGGER = LoggerFactory.getLogger(QiyeweixinConsumeQueue.class);

	private static final Gson gson = XGsonBuilder.instance();

	protected void execute(Message message) throws Exception {

		if (Config.qiyeweixin().getEnable() && Config.qiyeweixin().getMessageEnable()) {
			try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
				Business business = new Business(emc);
				QiyeweixinMessage m = new QiyeweixinMessage();
				m.setAgentid(Long.parseLong(Config.qiyeweixin().getAgentId(), 10));
				m.setTouser(business.organization().person().getObject(message.getPerson()).getQiyeweixinId());
				String content = message.getTitle();
				if (needTransferLink(message.getType())) {
					String workUrl = getOpenUrl(message);
					if (StringUtils.isNotEmpty(workUrl)) {
						content = "<a href=\"" + workUrl + "\">" + message.getTitle() + "</a>";
					}
				}
				m.getText().setContent(content);
				if (LOGGER.isDebugEnabled()) {
					LOGGER.debug("微信消息：{}", m::toString);
				}
				String address = Config.qiyeweixin().getApiAddress() + "/cgi-bin/message/send?access_token="
						+ Config.qiyeweixin().corpAccessToken();
				QiyeweixinMessageResp resp = HttpConnection.postAsObject(address, null, m.toString(),
						QiyeweixinMessageResp.class);
				if (resp.getErrcode() != 0) {
					ExceptionQiyeweixinMessage e = new ExceptionQiyeweixinMessage(resp.getErrcode(), resp.getErrmsg());
					LOGGER.error(e);
				} else {
					Message messageEntityObject = emc.find(message.getId(), Message.class);
					if (null != messageEntityObject) {
						emc.beginTransaction(Message.class);
						messageEntityObject.setConsumed(true);
						emc.commit();
					}
				}
			}
		}
	}



	/**
	 * 判断打开地址
	 *
	 * @param message
	 * @return
	 */
	private String getOpenUrl(Message message) {
		String openUrl = "";
		// cms 文档
		if (MessageConnector.TYPE_CMS_PUBLISH.equals(message.getType())
				|| MessageConnector.TYPE_CMS_PUBLISH_TO_CREATOR.equals(message.getType())) {
			openUrl = getQywxOpenCMSDocumentUrl(message.getBody());
		} else { // 流程工作相关的
			openUrl = getQywxOpenWorkUrl(message.getBody());
		}
		return openUrl;
	}

	/**
	 * 文档打开的url
	 *
	 * @param messageBody
	 * @return
	 */
	private String getQywxOpenCMSDocumentUrl(String messageBody) {
		String o2oaUrl = null;
		try {
			String corpId = Config.qiyeweixin().getCorpId();
			String agentId = Config.qiyeweixin().getAgentId();
			o2oaUrl = Config.qiyeweixin().getWorkUrl() + "qiyeweixinsso.html?redirect=";
			o2oaUrl = DingdingConsumeQueue.OuterMessageHelper.getOpenCMSDocumentUrl(o2oaUrl, messageBody);
			if (StringUtils.isEmpty(o2oaUrl) || StringUtils.isEmpty(corpId) || StringUtils.isEmpty(agentId)) {
				return null;
			}
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("o2oa 地址：{}" , o2oaUrl);
			}
			o2oaUrl = URLEncoder.encode(o2oaUrl, DefaultCharset.name);
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("encode url : {}", o2oaUrl);
			}
			String url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + corpId
					+ "&response_type=code&scope=snsapi_base" + "&agentid=" + agentId + "&redirect_uri=" + o2oaUrl
					+ "&#wechat_redirect";
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("final url : {}" , url);
			}
			return url;
		} catch (Exception e) {
			LOGGER.error(e);
			return null;
		}
	}

	/**
	 * 生成单点登录和打开工作的地址
	 * 
	 * @param messageBody
	 * @return
	 */
	private String getQywxOpenWorkUrl(String messageBody) {
		try {
			String work = DingdingConsumeQueue.OuterMessageHelper.getWorkIdFromBody(messageBody);
			String o2oaUrl = Config.qiyeweixin().getWorkUrl();
			String corpId = Config.qiyeweixin().getCorpId();
			String agentId = Config.qiyeweixin().getAgentId();
			if (StringUtils.isEmpty(work) || StringUtils.isEmpty(o2oaUrl) || StringUtils.isEmpty(corpId)
					|| StringUtils.isEmpty(agentId)) {
				return null;
			}
			String openPage = DingdingConsumeQueue.OuterMessageHelper.getOpenPageUrl(messageBody);
			if (StringUtils.isNotEmpty(openPage)) {
				o2oaUrl = o2oaUrl + "qiyeweixinsso.html?redirect=" + openPage;
			} else {
				String workUrl = "workmobilewithaction.html?workid=" + work;
				String messageRedirectPortal = Config.qiyeweixin().getMessageRedirectPortal();
				if (messageRedirectPortal != null && !"".equals(messageRedirectPortal)) {
					String portal = "portalmobile.html?id=" + messageRedirectPortal;
					portal = URLEncoder.encode(portal, DefaultCharset.name);
					workUrl += "&redirectlink=" + portal;
				}
				workUrl = URLEncoder.encode(workUrl, DefaultCharset.name);
				o2oaUrl = o2oaUrl + "qiyeweixinsso.html?redirect=" + workUrl;
			}
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("o2oa 地址：{}", o2oaUrl);
			}
			o2oaUrl = URLEncoder.encode(o2oaUrl, DefaultCharset.name);
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("encode url : {}" , o2oaUrl);
			}
			String url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + corpId
					+ "&response_type=code&scope=snsapi_base" + "&agentid=" + agentId + "&redirect_uri=" + o2oaUrl
					+ "&#wechat_redirect";
			if (LOGGER.isDebugEnabled()) {
				LOGGER.debug("final url : {}" , url);
			}
			return url;
		} catch (Exception e) {
			LOGGER.error(e);
		}

		return "";
	}


	/**
	 * 是否需要把企业微信消息转成超链接消息 根据是否配置了企业微信应用链接、是否是工作消息（目前只支持工作消息）
	 * 
	 * @param messageType 消息类型 判断是否是工作消息
	 * @return
	 */
	private boolean needTransferLink(String messageType) {
		try {
			String workUrl = Config.qiyeweixin().getWorkUrl();
			if (StringUtils.isNotEmpty(workUrl)) {
				return true;
			}
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return false;
	}



	public static class QiyeweixinMessageResp {

		/**
		 * <code>	 {
		 * "errcode" : 0,
		 * "errmsg" : "ok",
		 * "invaliduser" : "userid1|userid2", // 不区分大小写，返回的列表都统一转为小写
		 * "invalidparty" : "partyid1|partyid2",
		 * "invalidtag":"tagid1|tagid2"
		 * }
		 * </code>
		 */

		private Integer errcode;
		private String errmsg;
		private String invaliduser;
		private String invalidparty;
		private String invalidtag;

		public String getErrmsg() {
			return errmsg;
		}

		public void setErrmsg(String errmsg) {
			this.errmsg = errmsg;
		}

		public String getInvaliduser() {
			return invaliduser;
		}

		public void setInvaliduser(String invaliduser) {
			this.invaliduser = invaliduser;
		}

		public String getInvalidparty() {
			return invalidparty;
		}

		public void setInvalidparty(String invalidparty) {
			this.invalidparty = invalidparty;
		}

		public String getInvalidtag() {
			return invalidtag;
		}

		public void setInvalidtag(String invalidtag) {
			this.invalidtag = invalidtag;
		}

		public Integer getErrcode() {
			return errcode;
		}

		public void setErrcode(Integer errcode) {
			this.errcode = errcode;
		}

	}
}
