package utils;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet; 
import java.sql.PreparedStatement; 

import utils.Database;

public class AuthUtil 
{ 
	private static Logger logg = Logger.getLogger("AuthUtilLogger");
	private static final Map<String,List<String>> roleActions = new HashMap<>();
	static{ //a static function is used to fetch the user roles and their actions and load to the roleActions mapper for futher use
		try
		{ 
			String query = "select r.role_id,r.role,coalesce(jsonb_agg(a.action),'[]') as actionroles from roles r left join role_actions ra on ra.role_id = r.role_id  left join actions a on a.action_id = ra.action_id  group by r.role_id,r.role order by r.role_id; ";

			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			ResultSet rs = pstmt.executeQuery();
			
			ObjectMapper mapper = new ObjectMapper();
			
			while(rs.next())
			{
				String roleId = String.valueOf(rs.getInt("role_id")),
                     actionRolesJson = rs.getString("actionroles");

                List<String> actions = mapper.readValue(actionRolesJson, List.class);

                roleActions.put(roleId, actions);
			}
			logg.log(Level.INFO," Authorization roles and actions fetched successfully");
		}
		catch(Exception e)
		{
			logg.log(Level.INFO," Error occurred! Can't Inititalize Authorization roles and actions: ",e);
		}
	}
	
	//checks if the logined user has the permission to access the functions
	public static boolean isAuthorized(String action,String role_id)
	{
		return (roleActions.get(role_id)).contains(action);
	}
}
