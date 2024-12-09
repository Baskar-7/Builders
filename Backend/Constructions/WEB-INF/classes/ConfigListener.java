
package listener;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
   
import java.io.FileInputStream;
import java.io.IOException;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import java.util.logging.Level;
import java.util.logging.Logger;

import constructions.UpdateHandler;
import utils.ConfigFileManager;
import utils.Util;
import utils.Database;
import parser.DataDictionaryParser;
import parser.TableDataParser;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class ConfigListener implements ServletContextListener {

	private static Logger logg = Logger.getLogger("ConfigListenerLogger");

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        initializeFirebaseConfig();
		initializeApplicationConfigs(sce);
		checkAndInitializeDB();
    }
	
	public static void checkAndInitializeDB()
	{
		try
		{ 
			Connection connection = DriverManager.getConnection("jdbc:postgresql://localhost:5432/","postgres", "12345");            
            Statement stmt = connection.createStatement();
			ResultSet rs = stmt.executeQuery("SELECT 1 FROM pg_database WHERE datname = 'constructions'"); //check if the required database is present
			
			if (!rs.next()) {
				Statement createDbStmt = connection.createStatement();
                createDbStmt.executeUpdate("CREATE DATABASE constructions"); //creates a new database if it doesn't exist
                createDbStmt.close(); 
				
				Connection con = Database.getConnection();
				Statement statement= con.createStatement();
				statement.executeUpdate("CREATE EXTENSION IF NOT EXISTS pg_trgm;");  //creates an extension for similarity function to compare strings for seaches
				statement.close();
	
				DataDictionaryParser.parseDataDictionary(); //create required tables using the table parser with table configs in data-dictionary.xml
				TableDataParser.parseTableData(); //inserts the table values into the required tables with data in tableData.xml file
				UpdateHandler.addUser("Baskar","Balaji","baskar97917@gmail.com","908070652",1,"Baskar@7","600095","Chennai","Tamil Nadu",new byte[0],"","");//Admin Account
			}
			rs.close();
			stmt.close();
			logg.log(Level.INFO,"Database initialized successfully.");			
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred! Can't initialize Database: ",e);
			e.printStackTrace();
		}	
	}
	
	public static void initializeApplicationConfigs(ServletContextEvent sce)
	{
		try {
            ConfigFileManager configManager = new ConfigFileManager(); //creates or fetch the config file to retrieve the server details
            ServletContext context = sce.getServletContext();
            context.setAttribute("configManager", configManager); 
			Util.setSigningKey(configManager.getProperty("SIGNING_KEY_PROPERTY")); //sets signinkey to validate the jwt tokens
			logg.log(Level.INFO,"ConfigFileManager initialized successfully.");			
        } 
		catch (Exception e) 
		{  
			logg.log(Level.INFO,"Error occurred! Can't initialize Database: ",e); 
            throw new RuntimeException(e);
        }
	}
	
	public static void initializeFirebaseConfig()
	{
		try {
            //Check if FirebaseApp is already initialized 
            if (FirebaseApp.getApps().isEmpty()) {
                FileInputStream serviceAccount = new FileInputStream("C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\webapps\\Constructions\\WEB-INF\\classes\\utils\\serviceAccountKey.json");

                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
               logg.log(Level.INFO,"Firebase initialized successfully.");
            }
        } catch (IOException e) {
            logg.log(Level.INFO,"Error occurred! Can't initialize Firebase",e);
        }
		
	}

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        // logger.info("ServletContext destroyed.");
    }
}
