package com.x.processplatform.assemble.surface.jaxrs.data;

import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.Applications;
import com.x.base.core.project.x_processplatform_service_processing;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoId;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.assemble.surface.ThisApplication;
import com.x.processplatform.assemble.surface.WorkControl;
import com.x.processplatform.core.entity.content.Work;

class ActionUpdateWithJob extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionUpdateWithJob.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String job, JsonElement jsonElement) throws Exception {
		LOGGER.debug("{} access.", effectivePerson::getDistinguishedName);
		ActionResult<Wo> result = new ActionResult<>();
		if (null == jsonElement || (!jsonElement.isJsonObject())) {
			throw new ExceptionNotJsonObject();
		}
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			checkUpdateWithJobControl(effectivePerson, business, job);
		}
		Wo wo = ThisApplication.context().applications().putQuery(x_processplatform_service_processing.class,
				Applications.joinQueryUri("data", "job", job), jsonElement, job).getData(Wo.class);
		result.setData(wo);
		return result;
	}

	public static class Wo extends WoId {

		private static final long serialVersionUID = -2942168134266650614L;

	}

	public static class WoControl extends WorkControl {

		private static final long serialVersionUID = -4623079643959758023L;
	}
}
