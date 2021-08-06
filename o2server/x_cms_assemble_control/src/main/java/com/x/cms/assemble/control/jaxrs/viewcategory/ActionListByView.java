package com.x.cms.assemble.control.jaxrs.viewcategory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.JpaObject;
import com.x.base.core.project.bean.WrapCopier;
import com.x.base.core.project.bean.WrapCopierFactory;
import com.x.base.core.project.cache.Cache;
import com.x.base.core.project.cache.CacheManager;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.cms.assemble.control.Business;
import com.x.cms.assemble.control.factory.ViewCategoryFactory;
import com.x.cms.core.entity.element.ViewCategory;

import net.sf.ehcache.Element;

public class ActionListByView extends BaseAction {
	
	@SuppressWarnings("unchecked")
	protected ActionResult<List<Wo>> execute( HttpServletRequest request, EffectivePerson effectivePerson, String viewId ) throws Exception {
		ActionResult<List<Wo>> result = new ActionResult<>();
		List<Wo> wraps = null;
		Cache.CacheKey cacheKey = new Cache.CacheKey( this.getClass(), viewId );
		Optional<?> optional = CacheManager.get(cacheCategory, cacheKey );

		if (optional.isPresent()) {
			wraps = (List<Wo>) optional.get();
			result.setData(wraps);
		} else {
			try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {			
				Business business = new Business(emc);			
				//如判断用户是否有查看所有视图分类关联信息的权限，如果没权限不允许继续操作
				if (!business.viewEditAvailable( effectivePerson )) {
					throw new Exception("person{name:" + effectivePerson.getDistinguishedName() + "} 用户没有查询全部视图分类关联信息的权限！");
				}			
				//如果有权限，继续操作
				ViewCategoryFactory viewCategoryFactory  = business.getViewCategoryFactory();
				List<String> ids = viewCategoryFactory.listByViewId( viewId );//获取指定应用的所有视图分类关联信息列表
				List<ViewCategory> viewList = emc.list( ViewCategory.class, ids );//查询ID IN ids 的所有视图分类关联信息信息列表
				
				wraps = Wo.copier.copy( viewList );//将所有查询出来的有状态的对象转换为可以输出的过滤过属性的对象

				CacheManager.put(cacheCategory, cacheKey, wraps );
				result.setData(wraps);
			} catch (Throwable th) {
				th.printStackTrace();
				result.error(th);
			}
		}
		
		return result;
	}
	
	public static class Wo extends ViewCategory {
		
		private static final long serialVersionUID = -5076990764713538973L;
		
		public static List<String> Excludes = new ArrayList<String>();

		public static WrapCopier<ViewCategory, Wo> copier = WrapCopierFactory.wo( ViewCategory.class, Wo.class, null, JpaObject.FieldsInvisible);
	}
}