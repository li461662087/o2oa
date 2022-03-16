package com.x.processplatform.assemble.surface.jaxrs.sign;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.config.StorageMapping;
import com.x.base.core.project.exception.ExceptionAccessDenied;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoFile;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.assemble.surface.ThisApplication;
import com.x.processplatform.core.entity.content.DocSignScrawl;
import org.apache.commons.lang3.StringUtils;

class ActionDownload extends BaseAction {
	ActionResult<Wo> execute(EffectivePerson effectivePerson, String scrawlId)
			throws Exception {

		ActionResult<Wo> result = new ActionResult<>();
		DocSignScrawl signScrawl = null;

		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			signScrawl = emc.find(scrawlId, DocSignScrawl.class);
			if (null == signScrawl) {
				throw new ExceptionEntityNotExist(scrawlId, DocSignScrawl.class);
			}
			if(StringUtils.isBlank(signScrawl.getStorage())){
				throw new IllegalStateException(scrawlId+"附件不存在！");
			}
			if(!business.readableWithJob(effectivePerson, signScrawl.getJob())){
				throw new ExceptionAccessDenied(effectivePerson, scrawlId);
			}
		}
		String fileName = signScrawl.getName();
		StorageMapping mapping = ThisApplication.context().storageMappings().get(DocSignScrawl.class,
				signScrawl.getStorage());
		byte[] bytes = signScrawl.readContent(mapping);
		Wo wo = new Wo(bytes, this.contentType(false, fileName), this.contentDisposition(false, fileName));
		result.setData(wo);
		return result;
	}

	public static class Wo extends WoFile {

		public Wo(byte[] bytes, String contentType, String contentDisposition) {
			super(bytes, contentType, contentDisposition);
		}

	}

}
