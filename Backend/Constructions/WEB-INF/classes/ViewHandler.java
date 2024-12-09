
package constructions;

import utils.Database;
import utils.Util;

import java.time.LocalTime;
import java.time.ZoneId; 

import java.sql.Time;
import java.sql.Connection; 
import java.sql.ResultSet;
import java.sql.PreparedStatement;  

import java.util.ArrayList; 
import java.util.Properties; 
import java.util.Map; 
import java.util.List;  
import java.util.Base64; 
import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONObject;
import org.json.JSONArray;


public class ViewHandler extends Util
{
		private static Logger logg = Logger.getLogger("ViewLogger");

	public  static JSONObject verifyOTP(String credentail_type,String credential,String oneTimePassword)throws Exception
	{
		JSONObject resultObj=new JSONObject();
		String status="error";
		String message="Invalid OTP!!...";
		try
		{
			String tableName="otp";
			Connection con=Database.getConnection();
			PreparedStatement st=con.prepareStatement("select * from "+tableName+" where "+credentail_type+"='"+credential+"' AND oneTimePassword='"+oneTimePassword+"';");
			ResultSet rs=st.executeQuery();
			resultObj.put("credential",credential);
			resultObj.put("oneTimePassword",oneTimePassword);
			if(rs.next())
			{
				ZoneId istZone = ZoneId.of("Asia/Kolkata");
				LocalTime currentTime = LocalTime.now(istZone);
				Time time = Time.valueOf(currentTime);
				Time time2=rs.getTime(3);
				int comparison = time.compareTo(time2);
				if(comparison>0)
				{
					message="OTP Expired!!!..Resend OTP";
				}
				else
				{
					status="success";
					message="Otp verified Successfully!!";
				}
			}
			rs.close();
			st.close();
		}
		catch(Exception e){
			logg.log(Level.INFO,"Exception occurred while verify the otp details: ",e);
		}
		resultObj.put("status",status);
		resultObj.put("message",message);
		return resultObj;
	}
	
	public static String isValidUser(String mail)
	{
		
		String user_id = null;
		
		try{
			
			Connection con=Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement("select userid from accounts where mail=?");
			pstmt.setString(1,mail);
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
			{
				user_id = rs.getString("userid");
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while verify the user profile: ",e);
		}
		return user_id;
	}
	
	public static JSONObject getUserInfo(String mail)throws Exception
	{
		JSONObject userInfo=new JSONObject();
		String status="error",message="User Information unavailable!!..";
		try{
			if(!mail.isEmpty())
			{
				String query = "select DISTINCT a.account_id,a.mail,a.fname,a.lname,a.address,a.pincode,a.mobile,a.city,a.state,a.role_id, a.maplocation,a.profile_pic_id,i.image as profile_pic,r.role from accounts a left join role_actions ra on ra.role_id = a.role_id left join roles r on r.role_id = ra.role_id left join images i on i.image_id = a.profile_pic_id where mail = ?;";
				Connection con=Database.getConnection();
				PreparedStatement stmt=con.prepareStatement(query);
				stmt.setString(1,mail);
				ResultSet rs=stmt.executeQuery();
				
				if(rs.next())
				{
					userInfo.put("mail",rs.getString("mail"));
					userInfo.put("profile_pic",Base64.getEncoder().encodeToString(rs.getBytes("profile_pic")));
					userInfo.put("profile_pic_id",rs.getInt("profile_pic_id"));
					userInfo.put("fname",rs.getString("fname"));
					userInfo.put("lname",rs.getString("lname"));
					userInfo.put("address",rs.getString("address"));
					userInfo.put("pincode",rs.getString("pincode"));
					userInfo.put("mobile",rs.getString("mobile"));
					userInfo.put("city",rs.getString("city"));
					userInfo.put("state",rs.getString("state"));
					userInfo.put("role",rs.getString("role"));
					userInfo.put("role_id",rs.getInt("role_id"));
					userInfo.put("account_id",rs.getInt("account_id"));
					userInfo.put("maplocation",rs.getString("maplocation"));
					status="success";
					message="User Information fetched successfully!!..";
				}
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the user details: ",e);
		}
		userInfo.put("status",status);
		userInfo.put("message",message);
		return userInfo;
	}
	
	public static ArrayList getAllAmenities()throws Exception 
	{
		ArrayList amenities = new ArrayList();
		
		try
		{
			Properties amenity_details;
			Connection con=Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement("select c.category_id,c.category , jsonb_agg(row_to_json(am)) as amenities from categories c left join amenities am on am.amenity_category_id = c.category_id where c.category_type_id = '1' group by category_id order by c.category_id ; ");
			ResultSet rs = pstmt.executeQuery();
			
			while(rs.next())
			{
				amenity_details = new Properties();
				amenity_details.put("category_id",rs.getString("category_id"));
				amenity_details.put("category",rs.getString("category"));
				amenity_details.put("amenities",new JSONArray(rs.getString("amenities")));
				amenities.add(amenity_details);
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the amenity details: ",e);
		}
		return amenities;		
	}
	
	public static JSONArray getCategories(int categoryTypeId)throws Exception
	{
		JSONArray categories= new JSONArray();
		try
		{
			String query = "select COALESCE(jsonb_agg(row_to_json(c)),'[]') as categories from categories c where c.category_type_id = ?;";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,categoryTypeId);
			ResultSet rs = pstmt.executeQuery();
			
			while(rs.next())
			{
				categories = new JSONArray(rs.getString("categories"));
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the category details: ",e);
		}
		return categories;
	}
	
	public static JSONObject getProjOverview(String location,List<Map<String, Long>> priceRanges,JSONArray amenityIds, JSONArray projectTypes,String searchValue, String project_status)throws Exception
	{
		JSONObject results = new JSONObject();
		JSONArray projects = new JSONArray();
		String status  = "error";
		String message = "An unexpected error occurred while fetching Projects!.Please try again after sometime...";
		try
		{
			JSONObject projectInfo;
			StringBuilder query = new StringBuilder("select p.project_id,p.project_name,encode(i.image,'base64')as elevation_poster,pld.landmark,pd.status,pd.project_type,pd.min_price,pd.max_price,pd.min_built_area,pd.max_built_area from projects p left join project_details pd on pd.project_id  = p.project_id left join project_location_details pld on pld.project_id  = p.project_id left join images i on i.image_id = p.elevation_poster_id WHERE 1 = 1 ");
			
			if(!searchValue.isEmpty())
			{
				query.append(" AND to_tsvector('english', CONCAT_WS(' ', lower(p.project_name), lower(pld.landmark),lower(pd.project_type))) @@ plainto_tsquery('").append(searchValue).append("')");
			}
			
			if(!project_status.isEmpty() && !project_status.equals("All"))
			{
				if(project_status.equals("Active"))
					query.append(" AND pd.status != 'Closed'");
				else
					query.append(" AND pd.status = '").append(project_status).append("'");
			}
			
			
			 if (amenityIds.length() > 0) 
			 {
				 int length = amenityIds.length();
				query.append("AND p.project_id IN (SELECT project_id FROM project_amenities WHERE amenity_id IN (");
				for (int i = 0; i < length; i++) {
					query.append(amenityIds.get(i));
					if (i < length - 1) {
						query.append(", ");
					}
				}
				query.append(")) ");
			}
			
			if (!priceRanges.isEmpty()) {
				query.append("AND (");
				int i =0 ;
				for (Map<String, Long> price: priceRanges) {
					query.append("(pd.min_price >= ").append(price.get("min")).append(" AND pd.max_price <= ").append(price.get("max")).append(")");
					if(i < priceRanges.size() -1 )
						query.append(" OR ");
					i++;
				}
				query.append(") ");
			}

			if (projectTypes.length() > 0) {
				int length = projectTypes.length();
				query.append("AND pd.project_type IN (");
				for (int i = 0; i < length; i++) {
					query.append("'").append(projectTypes.get(i)).append("'");
					if (i < length - 1) {
						query.append(", ");
					}
				}
				query.append(") ");
			}
			
			if(location.length() > 0 && !location.equals("All")){
				query.append("AND SIMILARITY(lower(pld.city), lower('"+location+"')) > 0.3");
			}
			
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query.toString());
			ResultSet rs = pstmt.executeQuery();
			
			while(rs.next())
			{
				projectInfo = new JSONObject();
				projectInfo.put("project_id",rs.getString("project_id"));
				projectInfo.put("project_type",rs.getString("project_type"));
				projectInfo.put("project_status",rs.getString("status"));
				projectInfo.put("project_name",rs.getString("project_name"));
				projectInfo.put("landmark",rs.getString("landmark"));
				projectInfo.put("min_price",rs.getLong("min_price"));
				projectInfo.put("max_price",rs.getLong("max_price"));
				projectInfo.put("min_built_area",rs.getLong("min_built_area"));
				projectInfo.put("max_built_area",rs.getLong("max_built_area"));
				projectInfo.put("elevation_poster",rs.getString("elevation_poster"));
				projects.put(projectInfo);
			}
			status  = "success";
			message = "Project Details fetched successfully..";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the project overview details: ",e);
		}
		results.put("status",status);
		results.put("message",message);
		results.put("projects",projects);
		return results;
	}
	
	public static JSONObject getProjectDetails(int project_id) throws Exception
	{
		JSONObject details = new JSONObject();
		String status = "error",message = "An unexpected error occurred while fetching Projects details!.Please try again after sometime...";
		try
		{
			String query = "SELECT p.project_id, p.project_name, pld.landmark, pld.address,pld.latitude,pld.longitude, pd.min_price,pd.max_price,pd.total_floors,pd.total_blocks,pd.total_units, pd.min_built_area,pd.max_built_area,pd.project_type, pld.pincode, encode(i.image, 'base64') AS elevation_poster, " +
			"COALESCE((SELECT jsonb_agg(row_to_json(pc)) FROM project_config pc WHERE pc.project_id = p.project_id), '[]') AS configs, " +
			"COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', c.category_id, 'categoryType', c.category, 'images', subquery.images) ORDER BY c.category_id) FILTER (WHERE    c.category_type_id = '2'), '[]') AS blueprints, " +
			"COALESCE(JSON_AGG(JSON_BUILD_OBJECT('id', c.category_id, 'categoryType', c.category, 'images', subquery.images)) FILTER (WHERE c.category_type_id = '3'), '[]')  AS gallery " +
			"FROM projects p " +
			"LEFT JOIN project_details pd ON pd.project_id = p.project_id " +
			"LEFT JOIN project_location_details pld ON pld.project_id = p.project_id " +
			"LEFT JOIN project_category pc2 ON pc2.project_id = p.project_id " +
			"LEFT JOIN categories c ON c.category_id = pc2.category_id " +
			"LEFT JOIN images i ON i.image_id = p.elevation_poster_id " +
			"LEFT JOIN LATERAL (SELECT json_agg(encode(i2.image, 'base64')) AS images FROM category_images ci JOIN images i2 ON ci.image_id = i2.image_id WHERE ci.project_category_id = pc2.project_category_id) subquery ON true " +
			"WHERE p.project_id = ? " +
            "GROUP BY p.project_id, p.project_name, pld.landmark, pld.address, pd.min_price,pd.max_price, pld.pincode, i.image, configs, pd.min_built_area, pd.max_built_area, pd.project_type,pld.latitude,pld.longitude,pd.total_floors,pd.total_blocks,pd.total_units;";

			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,project_id);
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
			{
				details.put("project_id",rs.getInt("project_id"));
				details.put("project_type",rs.getString("project_type"));
				details.put("project_name",rs.getString("project_name"));
				details.put("landmark",rs.getString("landmark"));
				details.put("latitude",rs.getString("latitude"));
				details.put("longitude",rs.getString("longitude"));
				details.put("address",rs.getString("address"));
				details.put("min_price",rs.getLong("min_price"));
				details.put("max_price",rs.getLong("max_price"));
				details.put("min_built_area",rs.getLong("min_built_area"));
				details.put("max_built_area",rs.getLong("max_built_area"));
				details.put("total_blocks",rs.getInt("total_blocks"));
				details.put("total_floors",rs.getInt("total_floors"));
				details.put("total_units",rs.getInt("total_units"));
				details.put("pincode",rs.getString("pincode"));
				details.put("elevation_poster",rs.getString("elevation_poster"));		
				details.put("blueprints",new JSONArray(rs.getString("blueprints")));
				details.put("gallery",new JSONArray(rs.getString("gallery")));
				details.put("configs",new JSONArray(rs.getString("configs")));
				status = "success";
				message = "Project details fetched successfully";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the project details: ",e);
		}
		details.put("status",status);
		details.put("message",message);
		return details;
	}
	
	public static boolean isValidProjectId(int project_id)
	{
		boolean isValidId = false;
		try
		{
			String query = "select project_name from projects where project_id = ?";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,project_id);
			ResultSet rs = pstmt.executeQuery();
			if(rs.next())
			{
				isValidId = true;
			}
		}catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while verify the project Id: ",e);
		}
		return isValidId;
	}
	
	public static JSONObject getAllReviews(String searchValue)throws Exception
	{
		JSONObject result = new JSONObject();
		JSONArray reviews = new JSONArray();
		String status = "error",message = "An unexpected error occurred while fetching User Reviews!.Please try again after sometime...";
		try
		{
			StringBuilder query = new StringBuilder("SELECT coalesce(jsonb_agg(jsonb_build_object('quote', rv.quote,'author', rv.author,'review_id', rv.review_id,'reviewerpic',encode(rv.reviewerpic, 'base64'))),'[]'::jsonb) as reviews FROM reviews rv where 1=1");
			
			if(!searchValue.isEmpty())
			{
				query.append(" AND to_tsvector('english', CONCAT_WS(' ', lower(rv.quote), lower(rv.author))) @@ plainto_tsquery('").append(searchValue).append("')");
			}
			query.append(";");
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query.toString());
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
			{
				reviews = new JSONArray(rs.getString("reviews"));
				status="success";
				message="Reviews fetched successfully";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the review details: ",e);
		}
		result.put("reviews",reviews);
		result.put("status",status);
		result.put("message",message);
		return result;		
	}
	
	
	public static JSONObject getCallBackReq(String searchValue,String request_status)throws Exception
	{
		JSONObject result = new JSONObject();
		JSONArray reviews = new JSONArray();
		String status = "error",message = "An unexpected error occurred while fetching User Requests!.Please try again after sometime...";
		try
		{
			StringBuilder query = new StringBuilder("select coalesce(jsonb_agg (json_build_object('call_back_req_id',cr.call_back_req_id,'customer_id', cd.customer_id,'preferred_time',cr.preferred_time,'name',cd.name,'mobile',cd.mobile,'mail', cd.mail, 'request_status',Case when cr.request_status then 'Active' Else 'Closed' end)),'[]') as callBackReq from call_back_req cr left join customer_details cd on cd.customer_id = cr.customer_id where 1=1 ");
			
			if(!request_status.isEmpty() && !request_status.equals("All"))
			{
				query.append("And cr.request_status = '").append(request_status.equals("Active")).append("'");
			}
			
			if(!searchValue.isEmpty())
			{
				query.append(" AND to_tsvector('english', CONCAT_WS(' ',lower(cd.name), lower(cd.mail))) @@ plainto_tsquery('").append(searchValue).append("') OR (cd.mobile ilike '%").append(searchValue).append("%') OR (cr.preferred_time ilike '%").append(searchValue).append("%')");
			}
			
			query.append(";");
			
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query.toString());
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
			{
				reviews = new JSONArray(rs.getString("callBackReq"));
				status="success";
				message="Call back requests fetched successfully";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the callback request details: ",e);
		}
		result.put("callbackreq",reviews);
		result.put("status",status);
		result.put("message",message);
		return result;	
	}
	
	public static JSONObject getEnquires(String searchValue,String request_status)throws Exception
	{
		JSONObject result = new JSONObject();
		JSONArray reviews = new JSONArray();
		String status = "error",message = "An unexpected error occurred while fetching User Enquires!.Please try again after sometime...";
		try
		{
			StringBuilder query = new StringBuilder("select coalesce(jsonb_agg(json_build_object('enquiry_req_id',er.enquiry_req_id,'customer_id',cd.customer_id, 'project_id',er.project_id,'project_name',p.project_name,'project_loation',pld.landmark,'name',cd.name,'mobile',cd.mobile,'mail',cd.mail,'request_status', CASE WHEN er.request_status THEN 'Active' ELSE 'Closed' END)),'[]') as enquires from enquiry_req er left join customer_details cd on cd.customer_id = er.customer_id left join projects p on p.project_id=er.project_id left join project_location_details pld on pld.project_id = er.project_id where 1=1 ");
			
			if(!request_status.isEmpty() &&  !request_status.equals("All"))
			{
				query.append("And er.request_status = '").append(request_status.equals("Active")).append("'");
			}
			
			if(!searchValue.isEmpty())
			{
				query.append(" AND to_tsvector('english', CONCAT_WS(' ', lower(p.project_name), lower(pld.landmark), lower(cd.name), lower(cd.mail))) @@ plainto_tsquery( '").append(searchValue).append("') OR (cd.mobile ilike '%").append(searchValue).append("%')");
			}
			
			query.append(";");
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query.toString());
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
			{
				reviews = new JSONArray(rs.getString("enquires"));
				status="success";
				message="Enquires fetched successfully";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the enquiry details: ",e);
		}
		result.put("enquires",reviews);
		result.put("status",status);
		result.put("message",message);
		return result;	
	}
	
	public static JSONObject getServiceReq(String searchValue,String request_status)throws Exception
	{
		JSONObject result = new JSONObject();
		JSONArray reviews = new JSONArray();
		String status = "error",message = "An unexpected error occurred while fetching Service Requests!.Please try again after sometime...";
		try
		{
			StringBuilder query = new StringBuilder("select coalesce(jsonb_agg(json_build_object('service_req_id',sr.service_id,'customer_id', cd.customer_id,'name',cd.name,'mail',cd.mail,'mobile',cd.mobile,'service_type',sr.service_type,'project_status',sr.status,'landsize',sr.landsize,'location',sr.location,'request_status',sr.request_status)) ,'[]')as service_requests from service_req sr left join customer_details cd on cd.customer_id  = sr.customer_id where 1=1 ");
			
			if(!request_status.isEmpty() && !request_status.equals("All"))
			{
				query.append("And sr.request_status = '").append(request_status).append("'");
			}
			
			if(!searchValue.isEmpty())
			{
				query.append(" AND to_tsvector('english', CONCAT_WS(' ',lower(sr.service_type),lower(sr.status),lower(sr.location),lower(cd.name), cd.mail)) @@ plainto_tsquery('").append(searchValue).append("') OR (sr.landsize ilike '%").append(searchValue).append("%') OR (cd.mobile ilike '%").append(searchValue).append("%')");
			}
			query.append(";");
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query.toString());
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
			{
				reviews = new JSONArray(rs.getString("service_requests"));
				status="success";
				message="Service requests fetched successfully";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the service request details: ",e);
		}
		result.put("service_requests",reviews);
		result.put("status",status);
		result.put("message",message);
		return result;	
		
	}
	
	public static int getCustomerId(String mail,String mobile)
	{
		int customer_id = -1;
		try
		{
			String query = "Select customer_id from customer_details where mail = ? OR mobile = ?";
			Connection con = Database.getConnection();
			PreparedStatement stmt = con.prepareStatement(query);
			stmt.setString(1,mail);
			stmt.setString(2,mobile);
			ResultSet rs = stmt.executeQuery();
			
			if(rs.next())
			{
				customer_id = rs.getInt("customer_id");
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the client id: ",e);
		}
		return customer_id;		
	}
	
	public static boolean isValidCustomerId(int customer_id)
	{
		boolean isValidId  = false;
		try
		{
			String query = "select name from customer_details where customer_id = ?";
			Connection con =  Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,customer_id);
			ResultSet rs = pstmt.executeQuery();
			if(rs.next())
				isValidId = true; 
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while verify the client id: ",e);
		}
		return isValidId;
	}
	
	public static boolean isValidReviewId(int review_id)
	{
		boolean isValidId = false;
		try
		{
			String query = "select author from reviews where review_id = ?";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,review_id);
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
				isValidId = true;
		}
		catch(Exception e){
			logg.log(Level.INFO,"Exception occurred while verify the review id: ",e);
		}
		return isValidId;
	}
	
	public static boolean isValidCallBackReqId(int call_back_req_id)
	{
		boolean isValidId = false;
		try
		{
			String query = "select customer_id from call_back_req where call_back_req_id = ?";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,call_back_req_id);
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
				isValidId = true;
		}
		catch(Exception e){
			logg.log(Level.INFO,"Exception occurred while verify the callback request id: ",e);
		}
		return isValidId;
	}
	
	public static boolean isValidEnquiryId(int enquiry_req_id)
	{
		boolean isValidId = false;
		try
		{
			String query = "select customer_id from enquiry_req where enquiry_req_id = ?";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,enquiry_req_id);
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
				isValidId = true;
		}
		catch(Exception e){
			logg.log(Level.INFO,"Exception occurred while verify enquiry request id: ",e);
		}
		return isValidId;
	}
	
	public static boolean isValidServiceReqId(int service_id)
	{
		boolean isValidId = false;
		try
		{
			String query = "select customer_id from service_req where service_id = ?";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,service_id);
			ResultSet rs = pstmt.executeQuery();
			
			if(rs.next())
				isValidId = true;
		}
		catch(Exception e){
			logg.log(Level.INFO,"Exception occurred while verify the service request id: ",e);
		}
		return isValidId;
	}
}