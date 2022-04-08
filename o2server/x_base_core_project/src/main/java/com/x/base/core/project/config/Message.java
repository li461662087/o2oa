package com.x.base.core.project.config;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.x.base.core.project.annotation.FieldDescribe;
import com.x.base.core.project.gson.GsonPropertyObject;

public class Message extends GsonPropertyObject {

	private static final long serialVersionUID = 2536141863287117519L;

	public Message() {

	}

	public Message(List<String> list) {
		this.consumers.addAll(list);
	}

	public Message(List<String> list, Map<String, String> map) {
		this.consumers.addAll(list);
		if (map != null) {
			this.consumersV2.putAll(map);
		}
	}

	public Message(String... args) {
		if (args != null) {
			for (String arg : args) {
				this.consumersV2.put(arg, "");
			}
		}
	}

	public Message(Map<String, String> map) {
		if (map != null) {
			this.consumersV2.putAll(map);
		}
	}

	public static Message defaultInstance() {
		return new Message();
	}

	private List<String> consumers = new ArrayList<>();

	private Map<String, String> consumersV2 = new HashMap<>();

	private List<Consumer> consumersV3 = new ArrayList<>();

	public List<Consumer> getConsumersV3() {
		return consumersV3;
	}

	public List<String> getConsumers() {
		return consumers;
	}

	public void setConsumers(List<String> consumers) {
		this.consumers = consumers;
	}

	public Map<String, String> getConsumersV2() {
		return consumersV2;
	}

	public void setConsumersV2(Map<String, String> consumersV2) {
		this.consumersV2 = consumersV2;
	}

	public static class Consumer implements Serializable {

		private static final long serialVersionUID = 392932139617988800L;
		
		@FieldDescribe("消费者名称")
		private String type;
		@FieldDescribe("是否启用")
		private Boolean enable;
		@FieldDescribe("装载器")
		private String loader;
		@FieldDescribe("过滤器")
		private String filter;
		@FieldDescribe("配置条目")
		private String item;

		public String getFilter() {
			return filter;
		}

		public void setFilter(String filter) {
			this.filter = filter;
		}

		public String getType() {
			return type;
		}

		public void setType(String type) {
			this.type = type;
		}

		public Boolean getEnable() {
			return enable;
		}

		public void setEnable(Boolean enable) {
			this.enable = enable;
		}

		public String getLoader() {
			return loader;
		}

		public void setLoader(String loader) {
			this.loader = loader;
		}

		public String getItem() {
			return item;
		}

		public void setItem(String item) {
			this.item = item;
		}

	}
}
