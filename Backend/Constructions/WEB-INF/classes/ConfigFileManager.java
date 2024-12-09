
package utils;

import java.io.*;
import java.nio.file.*;
import java.util.Properties;
import java.security.Key;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

public class ConfigFileManager {

    private static final String CONFIG_FILE = "../conf/config.properties";
    private final Properties properties;

    public ConfigFileManager() {
        properties = new Properties();
 
        try 
		{
            File configFile = new File(CONFIG_FILE);
            if (configFile.exists()) 
			{
                try (InputStream input = new FileInputStream(CONFIG_FILE)) {
                    properties.load(input); 
                }
            } 
			else 
			{
				loadAndSaveConfigs();
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load configuration file.", e);
        }
    }
	
	public void loadAndSaveConfigs()
	{
		try
		{
			Key signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);  
			setProperty("SIGNING_KEY_PROPERTY", Util.convertKeytoString(signingKey)); 
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
	}

    public String getProperty(String key) {
        return properties.getProperty(key);
    }


    public void setProperty(String key, String value) {
        properties.setProperty(key, value);
        saveProperties();
    }


    private void saveProperties() {
        try (OutputStream output = new FileOutputStream(CONFIG_FILE)) {
            properties.store(output, "Application Configuration");
        } catch (IOException e) {
            throw new RuntimeException("Failed to save configuration file.", e);
        }
    }

    public boolean hasProperty(String key) {
        return properties.containsKey(key);
    }
}
