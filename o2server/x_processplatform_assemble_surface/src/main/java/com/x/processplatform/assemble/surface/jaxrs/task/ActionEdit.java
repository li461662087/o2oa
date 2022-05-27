package com.x.processplatform.assemble.surface.jaxrs.task;

import org.apache.commons.lang3.StringUtils;

import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.Applications;
import com.x.base.core.project.x_processplatform_service_processing;
import com.x.base.core.project.exception.ExceptionAccessDenied;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoId;
import com.x.processplatform.assemble.surface.ThisApplication;
import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.express.service.processing.jaxrs.task.V2EditWi;

class ActionEdit extends BaseAction {

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String id, JsonElement jsonElement) throws Exception {
		Task task = null;
		Wi wi = this.convertToWrapIn(jsonElement, Wi.class);
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			task = emc.find(id, Task.class);
			if (null == task) {
				throw new ExceptionEntityNotExist(id, Task.class);
			}
			if (effectivePerson.isNotPerson(task.getPerson()) && effectivePerson.isNotManager()) {
				throw new ExceptionAccessDenied(effectivePerson, task);
			}
		}

		if (StringUtils.isNotEmpty(wi.getOpinion()) || StringUtils.isNotEmpty(wi.getRouteName())) {
			updateTask(task, wi.getOpinion(), wi.getRouteName());
		}
		ActionResult<Wo> result = new ActionResult<>();
		Wo wo = new Wo();
		wo.setId(id);
		result.setData(wo);
		return result;
	}

	private void updateTask(Task task, String opinion, String routeName) throws Exception {
		V2EditWi req = new V2EditWi();
		req.setOpinion(opinion);
		req.setRouteName(routeName);
		WoId resp = ThisApplication.context().applications().putQuery(x_processplatform_service_processing.class,
				Applications.joinQueryUri("task", task.getId()), req, task.getJob()).getData(WoId.class);
		if (StringUtils.isEmpty(resp.getId())) {
			throw new ExceptionUpdateTask(task.getId());
		}
	}

	public static class Wo extends WoId {

		private static final long serialVersionUID = 8340104077391192781L;
	}

	public static class Wi extends V2EditWi {

		private static final long serialVersionUID = -4726539076530209219L;

	}
}
