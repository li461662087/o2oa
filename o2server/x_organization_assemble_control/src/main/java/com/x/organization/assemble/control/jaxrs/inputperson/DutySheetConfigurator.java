package com.x.organization.assemble.control.jaxrs.inputperson;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.x.base.core.project.gson.GsonPropertyObject;

public class DutySheetConfigurator extends GsonPropertyObject {

	private static final Pattern attributePattern = Pattern.compile("^\\((.+?)\\)$");

	private Integer sheetIndex;
	private Integer memoColumn;
	private Integer firstRow;
	private Integer lastRow;

	private Integer nameColumn;
	private Integer uniqueColumn;

	private Map<String, Integer> attributes = new HashMap<>();

	public DutySheetConfigurator(XSSFWorkbook workbook, Sheet sheet) {
		this.sheetIndex = workbook.getSheetIndex(sheet);
		Row row = sheet.getRow(sheet.getFirstRowNum());
		this.firstRow = sheet.getFirstRowNum() + 1;
		this.lastRow = sheet.getLastRowNum();
		memoColumn = row.getLastCellNum() + 1;
		for (int i = row.getFirstCellNum(); i <= row.getLastCellNum(); i++) {
			Cell cell = row.getCell(i);
			if (null != cell) {
				String str = this.getCellStringValue(cell);
				//System.out.println("str="+str+"----i="+i);
				if (StringUtils.isNotEmpty(str)) {
					if (uniqueItems.contains(str)) {
						this.uniqueColumn = i;
					} else if (nameItems.contains(str)) {
						this.nameColumn = i;
					}else {
						Matcher matcher = attributePattern.matcher(str);
						if (matcher.matches()) {
							String attribute = matcher.group(1);
							this.attributes.put(attribute, new Integer(i));
						}
					}
				}
			}
		}
	}

	private static List<String> uniqueItems = Arrays.asList(new String[] { "职务编号 *",  "unique" });
	private static List<String> nameItems = Arrays.asList(new String[] { "职务名称 *", "name" });

	public String getCellStringValue(Cell cell) {
		if (null != cell) {
			switch (cell.getCellType()) {
			case BLANK:
				return "";
			case BOOLEAN:
				return BooleanUtils.toString(cell.getBooleanCellValue(), "true", "false", "false");
			case ERROR:
				return "";
			case FORMULA:
				return "";
			case NUMERIC:
				Double d = cell.getNumericCellValue();
				Long l = d.longValue();
				if (l.doubleValue() == d) {
					return l.toString();
				} else {
					return d.toString();
				}
			default:
				return cell.getStringCellValue();
			}
		}
		return "";
	}

	public Integer getMemoColumn() {
		return memoColumn;
	}

	public Integer getUniqueColumn() {
		return uniqueColumn;
	}

	public Integer getNameColumn() {
		return nameColumn;
	}

	public Map<String, Integer> getAttributes() {
		return attributes;
	}

	public Integer getFirstRow() {
		return firstRow;
	}

	public Integer getLastRow() {
		return lastRow;
	}

	public Integer getSheetIndex() {
		return sheetIndex;
	}

}