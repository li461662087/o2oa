package com.x.processplatform.service.processing.jaxrs.work;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.TimeUnit;

import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.JpaObject;
import com.x.base.core.entity.annotation.CheckPersistType;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.executor.ProcessPlatformExecutorFactory;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WrapBoolean;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.processplatform.ManualTaskIdentityMatrix;
import com.x.base.core.project.tools.ListTools;
import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.entity.content.Work;
import com.x.processplatform.core.express.service.processing.jaxrs.task.V2AddWi;
import com.x.processplatform.service.processing.Business;

class V2Add extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(V2Add.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, JsonElement jsonElement) throws Exception {

		final Wi wi = this.convertToWrapIn(jsonElement, Wi.class);

		if (LOGGER.isDebugEnabled()) {
			LOGGER.debug("execute:{}.", effectivePerson::getDistinguishedName);
		}

		Task task = null;

		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			task = getTask(business, wi.getTask());
			if (null == task) {
				throw new ExceptionEntityNotExist(wi.getTask(), Task.class);
			}
			if (!this.checkWorkExist(business, task.getWork())) {
				throw new ExceptionEntityNotExist(task.getWork(), Work.class);
			}
		}

		return ProcessPlatformExecutorFactory.get(task.getJob()).submit(new CallableImpl(task.getWork(),
				task.getIdentity(), wi.getAfter(), wi.getReplace(), wi.getIdentityList())).get(300, TimeUnit.SECONDS);

	}

	private Task getTask(Business business, String id) throws Exception {
		return business.entityManagerContainer().fetch(id, Task.class,
				ListTools.toList(Task.job_FIELDNAME, Task.identity_FIELDNAME, Task.work_FIELDNAME));
	}

	private boolean checkWorkExist(Business business, String id) throws Exception {
		return business.entityManagerContainer().countEqual(Work.class, JpaObject.id_FIELDNAME, id) > 0;
	}

	private class CallableImpl implements Callable<ActionResult<Wo>> {

		private String id;

		private String identity;

		private Boolean after;

		private Boolean replace;

		private List<String> identities;

		CallableImpl(String id, String identity, Boolean after, Boolean replace, List<String> identities) {
			this.id = id;
			this.identity = identity;
			this.after = after;
			this.replace = replace;
			this.identities = identities;
		}

		@Override
		public ActionResult<Wo> call() throws Exception {
			try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
				emc.beginTransaction(Work.class);
				Work work = emc.find(this.id, Work.class);
				ManualTaskIdentityMatrix matrix = work.getManualTaskIdentityMatrix();
				matrix.add(identity, after, replace, identities);
				work.setManualTaskIdentityMatrix(matrix);
				emc.check(work, CheckPersistType.all);
				emc.commit();
			} catch (Exception e) {
				LOGGER.error(e);
			}
			ActionResult<Wo> result = new ActionResult<>();
			Wo wo = new Wo();
			wo.setValue(true);
			result.setData(wo);
			return result;
		}

	}

	public static class Wi extends V2AddWi {

		private static final long serialVersionUID = 7870902860170655791L;

	}

	public static class Wo extends WrapBoolean {

		private static final long serialVersionUID = -8882214104176786739L;

	}

}