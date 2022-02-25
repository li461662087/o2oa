package com.x.general.assemble.control.jaxrs.qrcode;

import org.apache.commons.lang3.StringUtils;

import com.google.gson.JsonElement;
import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.gson.GsonPropertyObject;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoFile;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;

public class ActionPostCreate extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionPostCreate.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, JsonElement jsonElement) throws Exception {
		LOGGER.debug("effectivePerson: {}.", effectivePerson.getDistinguishedName());
		Wi wi = this.convertToWrapIn(jsonElement, Wi.class);
		ActionResult<Wo> result = new ActionResult<>();
		byte[] bytes = this.create(wi.getWidth(), wi.getHeight(), wi.getText());
		Wo wo = new Wo(bytes, this.contentType(false, FILENAME), this.contentDisposition(false, FILENAME));
		result.setData(wo);
		return result;
	}

	public class Wi extends GsonPropertyObject {
		private static final long serialVersionUID = -670631145209495465L;
		@FieldDescribe("转换文本")
		private String text;
		@FieldDescribe("图像宽度,默认200.")
		private Integer width;
		@FieldDescribe("图像高度,默认200.")
		private Integer height;

		public String getText() {
			return StringUtils.trimToEmpty(text);
		}

		public void setText(String text) {
			this.text = text;
		}

		public Integer getWidth() {
			return width;
		}

		public void setWidth(Integer width) {
			this.width = width;
		}

		public Integer getHeight() {
			return height;
		}

		public void setHeight(Integer height) {
			this.height = height;
		}

	}

	public class Wo extends WoFile {
		private static final long serialVersionUID = -6210739068105920249L;

		public Wo(byte[] bytes, String contentType, String contentDisposition) {
			super(bytes, contentType, contentDisposition);
		}
	}

}
