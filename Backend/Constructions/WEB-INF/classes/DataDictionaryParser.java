
package parser;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import utils.Database;

public class DataDictionaryParser 
{
    public static void parseDataDictionary() 
	{
        try {
            
            // Connect to the database
            Connection connection = Database.getConnection();

            // Parse the XML file
            File xmlFile = new File("C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\webapps\\Constructions\\WEB-INF\\classes\\parser\\data-dictionary.xml");
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(xmlFile);
            doc.getDocumentElement().normalize();

            // Get the list of tables
            NodeList tableNodes = doc.getElementsByTagName("table");
            for (int i = 0; i < tableNodes.getLength(); i++) 
			{
                Element tableElement = (Element) tableNodes.item(i);
                String tableName = tableElement.getAttribute("name");

                // Create the table
                Statement statement = connection.createStatement();
                String createTableQuery = "CREATE TABLE IF NOT EXISTS " + tableName + " (";
                NodeList columnNodes = tableElement.getElementsByTagName("column");
                for (int j = 0; j < columnNodes.getLength(); j++) 
				{
                    Element columnElement = (Element) columnNodes.item(j);
                    String columnName = columnElement.getAttribute("name");
                    String columnType = columnElement.getAttribute("type");
                    createTableQuery += columnName + " " + columnType + ", ";

                    // Check if the column is a primary key
                    if (columnElement.hasAttribute("primaryKey")) {
                        createTableQuery += "PRIMARY KEY (" + columnName + "), ";
                    } else if(columnElement.hasAttribute("unique")){
						createTableQuery += "UNIQUE (" + columnName + "), ";
					}

                    // Check if the column is a foreign key
                    if (columnElement.hasAttribute("foreignKey")) {
                        String references = columnElement.getAttribute("references");
                        String onDelete = columnElement.getAttribute("onDelete");
                        createTableQuery += "FOREIGN KEY (" + columnName + ") REFERENCES " + references + " ON DELETE " + onDelete + ", ";
                    }
                }
                createTableQuery = createTableQuery.substring(0, createTableQuery.length() - 2); // Remove the trailing comma and space
                createTableQuery += ")";
                statement.executeUpdate(createTableQuery);
                statement.close();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
