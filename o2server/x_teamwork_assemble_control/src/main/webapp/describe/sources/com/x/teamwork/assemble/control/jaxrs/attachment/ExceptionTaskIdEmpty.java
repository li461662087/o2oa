package com.x.teamwork.assemble.control.jaxrs.attachment;

import com.x.base.core.project.exception.PromptException;

public class ExceptionTaskIdEmpty extends PromptException {

	private static final long serialVersionUID = 1859164370743532895L;

	public ExceptionTaskIdEmpty() {
		super("工作任务id为空，无法继续进行查询操作。");
	}
}
