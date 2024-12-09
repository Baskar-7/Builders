
package servletApi;

import utils.Database;
import utils.Util;

import java.lang.reflect.Method;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.PreparedStatement;

public class ServletAPIController {

	private static Logger logg = Logger.getLogger("ServletApiControllerLogger");
	volatile private static ServletAPIController instance = null;
	private Hashtable<String, Hashtable<String, Object>> apiMapping = new Hashtable<String, Hashtable<String, Object>>();
	private final static String CLASS_INSTANCE = "CLASS_INSTANCE";
	private final static String METHOD_INSTANCE = "METHOD_INSTANCE";
	private final static String GET_INSTANCE_METHOD = "getInstance";
	
	public static ServletAPIController getInstance() {
		if (instance == null) {
			synchronized (ServletAPIController.class) {
				if (instance == null) {
					instance = new ServletAPIController();
				}
			}
		}
		return instance;
	}

	private ServletAPIController() {
		try {
			initializeAPIMap(); 
		} catch (Exception ex) {
			logg.log(Level.INFO,"Exception occurred while create a object for servlet api controller: ",ex);
		}
	}

	private void initializeAPIMap() {
		try 
		{
			Connection con=Database.getConnection();
			PreparedStatement stmt=null;
			
			stmt=con.prepareStatement("select * from servlet_apimapping");
			ResultSet rs=stmt.executeQuery();
			
			while(rs.next())
			{
				String urlPath = rs.getString("url_path");
				String className = rs.getString("class_name");
				String methodName = rs.getString("method_name");
				String apiType=rs.getString("api_type");
				
				Class<?> caller = Class.forName(className);
				Class<?>[] argTypes = new Class<?>[] {};
				Method getInstanceMethod = caller.getMethod(GET_INSTANCE_METHOD, argTypes);
				Object obj = getInstanceMethod.invoke(caller);

				argTypes = new Class<?>[] { HttpServletRequest.class, HttpServletResponse.class };
				Method executionMethod = caller.getMethod(methodName, argTypes);

				Hashtable<String, Object> mappingInfo = new Hashtable<String, Object>();
				mappingInfo.put(CLASS_INSTANCE, obj);
				mappingInfo.put(METHOD_INSTANCE, executionMethod);
				mappingInfo.put("api_type", apiType);
				apiMapping.put(urlPath, mappingInfo);
			}
			rs.close();
		} catch (Exception ex) {
			logg.log(Level.INFO,"Exception occurred while intialize api map: ",ex);
		}
	}

	public int execute(HttpServletRequest request, HttpServletResponse response) {
		
		String urlPath = (request.getRequestURI()).replaceFirst("/Constructions/", "");
		int errCode = 200;
		
		try {
			Hashtable<String, Object> mappingInfo = apiMapping.get(urlPath);
			if (mappingInfo != null && ((mappingInfo.get("api_type")).equals("public") || (request.getRequestedSessionId() != null && 
                  request.isRequestedSessionIdValid()) || Util.validateJWTtoken(request,response)))
			// if(mappingInfo != null)
			{
				Object obj = mappingInfo.get(CLASS_INSTANCE);				
				Method executionMethod = (Method) mappingInfo.get(METHOD_INSTANCE);
				executionMethod.invoke(obj, request, response);
			} else {
				errCode = 404;
			}
		} catch (Exception ex) {
			logg.log(Level.INFO,"Exception occurred while execute the servlet request: ",ex);
		}
		return errCode;
	}
}

