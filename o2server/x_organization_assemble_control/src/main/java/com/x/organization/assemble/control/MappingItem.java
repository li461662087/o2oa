package com.x.organization.assemble.control;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import org.apache.commons.beanutils.PropertyUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;

import com.x.base.core.entity.JpaObject;
import com.x.base.core.entity.type.GenderType;
import com.x.base.core.project.gson.GsonPropertyObject;

public class MappingItem extends GsonPropertyObject {

	public static void setValue(Row row, JpaObject jpaObject, MappingItem item) throws Exception {
		Cell cell = row.getCell(item.getColumn());
		if (null != cell) {
			switch (item.getType()) {
			case string:
				cell.setCellType(CellType.STRING);
				String stringValue = cell.getStringCellValue();
				if (null != stringValue) {
					PropertyUtils.setProperty(jpaObject, item.getField(), stringValue);
				}
				break;
			case integer:
				cell.setCellType(CellType.NUMERIC);
				Double doubeValue = cell.getNumericCellValue();
				if (null != doubeValue) {
					PropertyUtils.setProperty(jpaObject, item.getField(), doubeValue.intValue());
				}
				break;
			case date:
				Date dateValue = cell.getDateCellValue();
				if (null != dateValue) {
					PropertyUtils.setProperty(jpaObject, item.getField(), dateValue);
				}
				break;
			case genderType:
				String genderTypeStringValue = cell.getStringCellValue();
				if (StringUtils.isNotEmpty(genderTypeStringValue)) {
					if (StringUtils.equalsIgnoreCase(GenderType.f.toString(), genderTypeStringValue)) {
						PropertyUtils.setProperty(jpaObject, item.getField(), GenderType.f);
					} else if (StringUtils.equalsIgnoreCase(GenderType.m.toString(), genderTypeStringValue)) {
						PropertyUtils.setProperty(jpaObject, item.getField(), GenderType.m);
					} else {
						PropertyUtils.setProperty(jpaObject, item.getField(), GenderType.d);
					}
				}
				break;
			case stringList:
				String stringListValue = cell.getStringCellValue();
				if (null != stringListValue) {
					List<String> list = new ArrayList<>(Arrays.asList(StringUtils.split(stringListValue, ",")));
					PropertyUtils.setProperty(jpaObject, item.getField(), list);
				}
				break;
			default:
				break;
			}
		}
	}

	public static List<MappingItem> personMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "display", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "employee", MappingItemValueType.string));
		list.add(new MappingItem("??????", "genderType", MappingItemValueType.genderType));
		list.add(new MappingItem("??????", "password", MappingItemValueType.string));
		list.add(new MappingItem("??????????????????", "passwordExpiredTime", MappingItemValueType.date));
		list.add(new MappingItem("?????????", "orderNumber", MappingItemValueType.integer));
		// list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("??????", "mail", MappingItemValueType.string));
		list.add(new MappingItem("??????", "mobile", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "officePhone", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		list.add(new MappingItem("????????????", "boardDate", MappingItemValueType.date));
		list.add(new MappingItem("????????????", "birthday", MappingItemValueType.date));
		list.add(new MappingItem("??????", "icon", MappingItemValueType.string));
		list.add(new MappingItem("??????", "signature", MappingItemValueType.string));
		list.add(new MappingItem("??????", "weixin", MappingItemValueType.string));
		list.add(new MappingItem("QQ", "qq", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "controllerList", MappingItemValueType.stringList));
		return list;
	}

	public static List<MappingItem> personMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = personMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> groupMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "display", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "orderNumber", MappingItemValueType.integer));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		list.add(new MappingItem("????????????", "personList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "groupList", MappingItemValueType.stringList));
		return list;
	}

	public static List<MappingItem> groupMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = groupMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> roleMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "display", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "orderNumber", MappingItemValueType.integer));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		list.add(new MappingItem("????????????", "personList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "groupList", MappingItemValueType.stringList));
		return list;
	}

	public static List<MappingItem> roleMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = roleMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> companyMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "display", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "shortName", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "superior", MappingItemValueType.string));
		list.add(new MappingItem("??????", "level", MappingItemValueType.integer));
		list.add(new MappingItem("?????????", "orderNumber", MappingItemValueType.integer));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		list.add(new MappingItem("?????????", "controllerList", MappingItemValueType.stringList));
		return list;
	}

	public static List<MappingItem> companyMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = companyMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> departmentMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "display", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "shortName", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "superior", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "company", MappingItemValueType.string));
		list.add(new MappingItem("??????", "level", MappingItemValueType.integer));
		list.add(new MappingItem("?????????", "orderNumber", MappingItemValueType.integer));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> departmentMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = departmentMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> identityMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "display", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "person", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "department", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "orderNumber", MappingItemValueType.integer));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "juniorList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> identityMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = identityMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> personAttributeMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "person", MappingItemValueType.string));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "attributeList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> personAttributeMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = personAttributeMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> companyAttributeMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "company", MappingItemValueType.string));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "attributeList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> companyAttributeMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = companyAttributeMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> companyDutyMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "company", MappingItemValueType.string));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("??????", "identityList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> companyDutyMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = companyDutyMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> departmentAttributeMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "department", MappingItemValueType.string));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("?????????", "attributeList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> departmentAttributeMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = departmentAttributeMappings();
		mappingColumns(list, sheet);
		return list;
	}

	public static List<MappingItem> departmentDutyMappings() {
		List<MappingItem> list = new ArrayList<>();
		list.add(new MappingItem("??????", "name", MappingItemValueType.string));
		list.add(new MappingItem("????????????", "unique", MappingItemValueType.string));
		list.add(new MappingItem("??????", "department", MappingItemValueType.string));
		list.add(new MappingItem("??????", "id", MappingItemValueType.string));
		list.add(new MappingItem("??????", "identityList", MappingItemValueType.stringList));
		list.add(new MappingItem("????????????", "createTime", MappingItemValueType.date));
		return list;
	}

	public static List<MappingItem> departmentDutyMappings(Sheet sheet) throws Exception {
		List<MappingItem> list = departmentDutyMappings();
		mappingColumns(list, sheet);
		return list;
	}

	private static void mappingColumns(List<MappingItem> list, Sheet sheet) {
		Row row = sheet.getRow(sheet.getFirstRowNum());
		if (null != row) {
			Cell cell = null;
			for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
				cell = row.getCell(i);
				if (null != cell) {
					String str = cell.getStringCellValue();
					for (MappingItem o : list) {
						if (StringUtils.equalsIgnoreCase(o.getName(), str)) {
							o.setColumn(i);
						}
					}
				}
			}
		}
	}

	public static Integer getResultColumnNum(Sheet sheet) {
		Row row = sheet.getRow(sheet.getFirstRowNum());
		if (null != row) {
			Cell cell = null;
			for (int i = row.getFirstCellNum() + 1; i < row.getLastCellNum(); i++) {
				cell = row.getCell(i);
				if (null != cell) {
					String str = cell.getStringCellValue();
					if (StringUtils.isEmpty(str) || StringUtils.equals(str, "??????")
							|| StringUtils.equals(str, "result")) {
						return i;
					}
				}
			}
			return (int) row.getLastCellNum();
		}
		return null;
	}

	private String name;
	private String field;
	private MappingItemValueType type;
	private Integer column;

	public MappingItem(String name, String field, MappingItemValueType type) {
		this.name = name;
		this.field = field;
		this.type = type;
		this.column = -1;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getField() {
		return field;
	}

	public void setField(String field) {
		this.field = field;
	}

	public MappingItemValueType getType() {
		return type;
	}

	public void setType(MappingItemValueType type) {
		this.type = type;
	}

	public Integer getColumn() {
		return column;
	}

	public void setColumn(Integer column) {
		this.column = column;
	}
}