
package parser;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import java.util.Properties;
import java.util.ArrayList;

import utils.Database;
import utils.Util;

public class TableDataParser extends Util {

    public static void parseTableData() 
	{
        try {
			
			ArrayList<Properties> configurations = getTableDataConfigurations();
		
			
			for(Properties tableData : configurations)
			{
				String fileLocation = tableData.getProperty("fileLocation"),query = tableData.getProperty("query"),tagName = tableData.getProperty("tagName");
				ArrayList<String> attributes =(ArrayList)tableData.get("attributes");
				File xmlFile = new File(fileLocation);
				DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
				DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
				Document document = dBuilder.parse(xmlFile);
				document.getDocumentElement().normalize();
			
				Connection connection = Database.getConnection();
				
				PreparedStatement preparedStatement = connection.prepareStatement(query);

				NodeList nodeList = document.getElementsByTagName(tagName);
				String value = "";
				for (int i = 0; i < nodeList.getLength(); i++) {
					Element element = (Element) nodeList.item(i);
					
					for(int j=0;j<attributes.size();j++)
					{
						value = element.getAttribute(attributes.get(j));
						if (value.startsWith("ID:")) {
						     int id = Integer.parseInt(value.substring(3));
							 preparedStatement.setInt(j+1,id); 
						}
						else
						{
							preparedStatement.setString(j+1,value);
						}
					}
					
					preparedStatement.executeUpdate();
				}
				preparedStatement.close();
			}
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
