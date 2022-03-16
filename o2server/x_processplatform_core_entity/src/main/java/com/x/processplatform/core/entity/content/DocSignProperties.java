package com.x.processplatform.core.entity.content;

import com.x.base.core.entity.JsonProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * 文件签批扩展信息
 * @author sword
 */
public class DocSignProperties extends JsonProperties {

    private Data data = new Data();

    private String title;

    private List<String> inputList = new ArrayList<>();

    private List<String> scrawlList = new ArrayList<>();

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getInputList() {
        return inputList;
    }

    public void setInputList(List<String> inputList) {
        this.inputList = inputList;
    }

    public List<String> getScrawlList() {
        return scrawlList;
    }

    public void setScrawlList(List<String> scrawlList) {
        this.scrawlList = scrawlList;
    }
}
