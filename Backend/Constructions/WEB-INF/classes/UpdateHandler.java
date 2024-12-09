
package constructions;

import utils.Database;

import java.sql.Connection; 
import java.sql.ResultSet;
import java.sql.PreparedStatement; 
import java.sql.Statement; 
import java.sql.Time; 

import java.util.UUID; 
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
  
import java.time.LocalTime;
import java.time.ZoneId;
import org.json.JSONObject;
import org.json.JSONArray;

import utils.Util;

public class UpdateHandler extends Util
{
	private static Logger logg = Logger.getLogger("UpdateLogger");
	
	public static String addUser(String fname,String mail,String mobile,String userId,int role_id)
	{
		return addUser(fname,"",mail,mobile,role_id,userId,"","","",new byte[0],"","");
	}
	
	public static String addUser(String fname,String lname,String mail,String mobile,int role_id,String userId,String pincode,String city,String state,byte[] profile_pic,String maplocation,String address)
	{
		try
		{
			String temp_userId = ViewHandler.isValidUser(mail);
			if(temp_userId==null)
			{
				Connection con=Database.getConnection();
				con.setAutoCommit(false);
				
				int profile_pic_id = addSingleImage(con,profile_pic);
				if(profile_pic_id != -1)
				{
					if(userId.isEmpty())
					{
						userId=(UUID.randomUUID()).toString();
					}
					PreparedStatement st=con.prepareStatement("insert into accounts(fname, lname, mail, mobile, role_id, userid, pincode, city, state, profile_pic_id,maplocation,address) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
					st.setString(1,fname);
					st.setString(2,lname);
					st.setString(3,mail);
					st.setString(4,mobile);
					st.setInt(5,role_id);
					st.setString(6,userId);
					st.setString(7,pincode);
					st.setString(8,city);
					st.setString(9,state);
					st.setInt(10,profile_pic_id);
					st.setString(11,maplocation);
					st.setString(12,address);
					st.executeUpdate();
					st.close();
				}
				con.setAutoCommit(true);
			}
			else userId = temp_userId;
		}
		catch(Exception e)
		{
			userId ="error";
			logg.log(Level.INFO,"Exception occurred while creating a new user profile: ",e);
		}
		
		return userId;
	}
	
	public static void addOtpDetails(String mail,String OTP)
	{
		try{
			String tableName="otp";
			Connection con=Database.getConnection();

			ZoneId istZone = ZoneId.of("Asia/Kolkata");
			LocalTime currentTime = LocalTime.now(istZone);
			LocalTime localtime = currentTime.plusMinutes(5);
			Time otpValidity = Time.valueOf(localtime);
			PreparedStatement st=null;
			if(Database.getRecord("select * from "+tableName+" where mail='"+mail+"';")!=null)
			{
				st=con.prepareStatement("update "+tableName+" set oneTimePassword='"+OTP+"',validity='"+otpValidity+"' where mail='"+mail+"';");
				st.executeUpdate();
			}
			else{
				st=con.prepareStatement("insert into "+tableName+" values(?,?,?)");
				st.setString(1,mail);
				st.setString(2,OTP);
				st.setTime(3,otpValidity);
				st.executeUpdate();
			}
			st.close();
		}catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while add the otp details: ",e);
		}
	}
	
	public static JSONObject updateSingleImage(byte[] fileBytes,int image_id)throws Exception
	{
		JSONObject result = new JSONObject();
		String status="error",message="Can't Update pics...";
		try
		{
			Connection con=Database.getConnection();
			PreparedStatement stmt=con.prepareStatement("update images set image = ? where image_id = ?;");
			stmt.setBytes(1, fileBytes);
			stmt.setInt(2, image_id);
			stmt.executeUpdate();
			
			status="success";
			message="Pic Updated Successfully!..";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while update a picture details: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static boolean updateUserDetails(String fname,String lname,String mail,String mobile,String pincode,String city,String state,String userId,String maplocation)throws Exception
	{
		boolean isUpdated = false;
		try
		{
			String UpdateUserDetailsQuery = "UPDATE accounts SET fname = ?, lname = ?, mail = ?, mobile = ?, pincode = ?, city = ?, state = ?,maplocation = ?  where userid = ?";


			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(UpdateUserDetailsQuery);
			pstmt.setString(1,fname);
			pstmt.setString(2,lname);
			pstmt.setString(3,mail);
			pstmt.setString(4,mobile);
			pstmt.setString(5,pincode);
			pstmt.setString(6,city);
			pstmt.setString(7,state);
			pstmt.setString(8,maplocation);
			pstmt.setString(9,userId);
			int rowsAffected = pstmt.executeUpdate();
			
			if(rowsAffected > 0)
				isUpdated = true;
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while update the user details: ",e);
		}	
		return isUpdated;
	}
	
	public static int addProjectAmenities(Connection con,int project_id,List<Integer> amenitiesList)throws Exception
	{
		int successCount = 0;
		try
		{
			String query = "Insert into project_amenities(project_id,amenity_id) values(?,?);";
			PreparedStatement pstmt = con.prepareStatement(query);
			
			for(int amenity_id: amenitiesList)
			{
				pstmt.setInt(1,project_id);
				pstmt.setInt(2,amenity_id);
				pstmt.addBatch();
			}
			int[] updateCounts = pstmt.executeBatch();
			for (int i=0;i<updateCounts.length;i++) {
				if (updateCounts[i] == Statement.SUCCESS_NO_INFO) {
					i=updateCounts.length;
				}else successCount++;
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the project amenity details: ",e);
		}
		return successCount;
	}
	
	public static int addSingleImage(byte[] image)throws Exception
	{
		return addSingleImage(Database.getConnection(),image);
	}
	
	public static int addSingleImage(Connection con,byte[] image)throws Exception
	{
		int image_id = -1;
		try
		{
			String query = "insert into images(image) values(?)";
			PreparedStatement pstmt = con.prepareStatement(query,Statement.RETURN_GENERATED_KEYS);
			pstmt.setBytes(1,image);
			pstmt.executeUpdate();
			ResultSet rs = pstmt.getGeneratedKeys();
			if(rs.next())
				image_id = rs.getInt(1);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding a image: ",e);
		}
		return image_id;
	}
	
	public static List<Integer> addMultipleImages(List<byte[]> images)throws Exception
	{
		return addMultipleImages(Database.getConnection(),images);
	}
	
	public static List<Integer> addMultipleImages(Connection con,List<byte[]> images)throws Exception
	{
		List<Integer> image_ids = new ArrayList<>();
		String query = "insert into images(image) values(?)";
		try
		{
			PreparedStatement pstmt = con.prepareStatement(query,Statement.RETURN_GENERATED_KEYS);
			
			for(byte[] image : images)
			{
				pstmt.setBytes(1,image);
				pstmt.addBatch();
			}
			pstmt.executeBatch();
			ResultSet rs = pstmt.getGeneratedKeys();
			while(rs.next())
			{
				image_ids.add(rs.getInt(1));
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding multiple images: ",e);
		}
		return image_ids;
	}
	
	public static JSONObject linkImageCategories(int project_category_id,List<Integer> imageIds)throws Exception
	{
		return linkImageCategories(Database.getConnection(),project_category_id,imageIds);
	}
		
	public static JSONObject linkImageCategories(Connection con,int project_category_id,List<Integer> imageIds)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message = "An unexpected error occurred linking image categories..";
		try
		{
			String query = "insert into category_images(image_id,project_category_id) values(?,?);";
			PreparedStatement pstmt = con.prepareStatement(query);
			
			for(int image_id : imageIds)
			{
				pstmt.setInt(1,image_id);
				pstmt.setInt(2,project_category_id);
				pstmt.addBatch();
			}
			int[] updateCounts = pstmt.executeBatch(); 
			int successCount = 0;
			
			for (int i=0;i<updateCounts.length;i++) {
				if (updateCounts[i] == Statement.SUCCESS_NO_INFO) {
					i=updateCounts.length;
				}else successCount++;
			}
			
			if(successCount == updateCounts.length){
				status = "success";
				message = "Category Images are linked Successfully";
			}
			else if(successCount > 0 && successCount < updateCounts.length)
			{
				status = "info";
				message = "Some images could not be linked with categories...";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while links the images with their appropriate categories : ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;		
	}
	
	public static JSONObject addProjectCategories(int project_id,Map<String, List<byte[]>> categories)throws Exception
	{
		return addProjectCategories(Database.getConnection(),project_id,categories);
	}
	
	public static JSONObject addProjectCategories(Connection con,int project_id,Map<String, List<byte[]>> categories)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "success",message = "Categories added successfully..";
		int totalCategories = categories.size(), insertedCategories = 0;
		try
		{
			String query = "Insert into project_category(category_id,project_id) values(?,?);";
			int projectCategoryId = 0;
			List<Integer> imageIds;
			JSONObject linkStatus; 
			
			for(Map.Entry<String,List<byte[]>> entry: categories.entrySet())
			{
				PreparedStatement pstmt = con.prepareStatement(query,Statement.RETURN_GENERATED_KEYS);
				pstmt.setInt(1,Integer.parseInt(entry.getKey()));
				pstmt.setInt(2,project_id);
				pstmt.executeUpdate();
				
				ResultSet rs = pstmt.getGeneratedKeys();
				if(rs.next())
				{
					insertedCategories++;
					projectCategoryId = rs.getInt(1);
					imageIds = addMultipleImages(con,entry.getValue());
					linkStatus = linkImageCategories(con,projectCategoryId,imageIds);
					if(linkStatus.getString("status").equals("error"))
					{
						insertedCategories--;
					} 
				}
			}
			
			if(insertedCategories  == 0)
			{
				status = "error";
				message = "Error Occured Can't add Project Categories";
			}
			else if(insertedCategories  < totalCategories && !status.equals("error"))
			{
				status = "info";
				message = "Some categories & its details could not be added...";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the project category details: ",e);
			status = "error";
			message = "An unexpected error occurred while adding project categories.";
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	private static int createNewProjectRecord(Connection conn,int account_id,String project_name,byte[] elevationPoster)
	{
		int project_id = -1;
		try
		{
			int elevation_poster_id = addSingleImage(conn,elevationPoster);
			if(elevation_poster_id != -1)
			{
				String projectQuery = "insert into projects(account_id,project_name,elevation_poster_id) values(?,?,?)";
				
				PreparedStatement pstmt = conn.prepareStatement(projectQuery,Statement.RETURN_GENERATED_KEYS);
				pstmt.setInt(1,account_id);
				pstmt.setString(2,project_name);
				pstmt.setInt(3,elevation_poster_id);	
				pstmt.executeUpdate();
				ResultSet rs = pstmt.getGeneratedKeys();
				if(rs.next())
				{
					project_id = rs.getInt(1);
				}
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while creating the new project record: ",e);
		}
		return project_id;		
	}
	
	public static JSONObject addNewProject(Map<String, List<byte[]>> blueprints,Map<String, List<byte[]>> gallery,List<Integer> amenitiesList,List<Map<String, String>> configurations,byte[] elevationPoster, JSONObject params,int account_id)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "success",
			  message = "Project details and configurations have been successfully added..";
		try(Connection conn = Database.getNewConnection())
		{
			conn.setAutoCommit(false);
			
			boolean isProjectAdded = false;

			int project_id = createNewProjectRecord(conn,account_id,params.getString("project_name"),elevationPoster);
			if(project_id != -1)
			{
				int project_details_id = addProjectDetails(conn,params,project_id),location_details_id = addProjectLocationDetails(conn,params,project_id);
				if(project_details_id != -1 && location_details_id != -1)
				{
					
					int amenitySuccessCount = addProjectAmenities(conn,project_id,amenitiesList),
						configSuccessCount  = addConfigurations(project_id,conn,configurations);
					String blueprintStatus = addProjectCategories(conn,project_id,blueprints).getString("status"),
							galleryStatus   = addProjectCategories(conn,project_id,gallery).getString("status");
					isProjectAdded = true;
					if(blueprintStatus.equals("error") && galleryStatus.equals("error") && amenitySuccessCount == 0 &&  configSuccessCount == 0)
					{
						isProjectAdded = false;
						status = "error";
						message = "An unexpected error occurred while adding the project categories and amenities..";
					}
					else if(blueprintStatus.equals("info") || galleryStatus.equals("info") || (amenitySuccessCount>0 && amenitySuccessCount < amenitiesList.size()) || (configSuccessCount > 0 && configSuccessCount < configurations.size()))
					{
						status = "info";
						message = "Some project details were added successfully, but certain items could not be included.!"; 
					}  
				}
			}
			
			if(!isProjectAdded){
				conn.rollback(); 
			}
		    else 
				conn.commit();
				
			conn.setAutoCommit(true);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while create a new project with their configs: ",e);
			status = "error";
			message = "An unexpected error occurred while adding projects..";
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	private static int addProjectDetails(Connection con, JSONObject projectDetails,int project_id)throws Exception
	{
		int project_details_id = -1;
		try
		{
			String query = "insert into project_details(min_price,min_built_area,max_built_area,project_type,total_floors,total_blocks,total_units,status,project_id,max_price) values(?,?,?,?,?,?,?,?,?,?);";
			PreparedStatement pstmt = con.prepareStatement(query,Statement.RETURN_GENERATED_KEYS);
			pstmt.setLong(1,projectDetails.getLong("min_price"));
			pstmt.setLong(2,projectDetails.getLong("min_area"));
			pstmt.setLong(3,projectDetails.getLong("max_area"));
			pstmt.setString(4,projectDetails.getString("project_type"));
			pstmt.setInt(5,projectDetails.getInt("total_floors"));
			pstmt.setInt(6,projectDetails.getInt("total_blocks"));
			pstmt.setInt(7,projectDetails.getInt("total_units"));
			pstmt.setString(8,projectDetails.getString("status"));
			pstmt.setInt(9,project_id);
			pstmt.setLong(10,projectDetails.getLong("max_price"));
			pstmt.executeUpdate();
			ResultSet rs = pstmt.getGeneratedKeys();
			if(rs.next())
			{
				project_details_id = rs.getInt(1);
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the project details: ",e);
		}
		return project_details_id;
	}

	private static int addProjectLocationDetails(Connection con,JSONObject locationDetails,int project_id)throws Exception
	{
		int location_details_id = -1;
		try
		{
			String query = "Insert into project_location_details(landmark,address,pincode,city,state,latitude,longitude,project_id) values(?,?,?,?,?,?,?,?);";
			PreparedStatement pstmt =  con.prepareStatement(query,Statement.RETURN_GENERATED_KEYS);
			pstmt.setString(1,locationDetails.getString("landmark"));
			pstmt.setString(2,locationDetails.getString("address")); 
			pstmt.setString(3,locationDetails.getString("pincode"));
			pstmt.setString(4,locationDetails.getString("city"));
			pstmt.setString(5,locationDetails.getString("state"));
			pstmt.setString(6,locationDetails.getString("latitude"));
			pstmt.setString(7,locationDetails.getString("longitude"));
			pstmt.setInt(8,project_id);
			pstmt.executeUpdate();
			ResultSet rs = pstmt.getGeneratedKeys();
			if(rs.next())
			{
				location_details_id = rs.getInt(1);
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the project location details: ",e);
		}
		return location_details_id;
	}
	
	public static int addConfigurations(int project_id,List<Map<String,String>> configurations)throws Exception
	{
		return addConfigurations(project_id,Database.getConnection(),configurations);
	}
	
	public static int addConfigurations(int project_id,Connection con,List<Map<String,String>> configurations)
	{
		int successCount = 0;
		try
		{
			String configQuery = "insert into project_config(project_id,bhk,unit_type,built_area1,built_area2,sqft_price,price_range1,price_range2) values(?,?,?,?,?,?,?,?)";
			
			PreparedStatement pstmt = con.prepareStatement(configQuery);
			for(Map<String,String> config : configurations)
			{
				pstmt.setInt(1,project_id);
				pstmt.setString(2,config.get("bhk"));
				pstmt.setString(3,config.get("unit_type"));
				pstmt.setString(4,config.get("min_area"));
				pstmt.setString(5,config.get("max_area"));
				pstmt.setString(6,config.get("sqft_price"));
				pstmt.setString(7,config.get("min_price"));
				pstmt.setString(8,config.get("max_price"));
				
				pstmt.addBatch();
			}
			int[] updateCounts = pstmt.executeBatch();
			for (int i=0;i<updateCounts.length;i++) {
				if (updateCounts[i] == Statement.SUCCESS_NO_INFO) {
					i=updateCounts.length;
				}else successCount++;
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the project configurations details: ",e);
		}
		
		return successCount;
	}
	
	public static JSONObject addCustomerDetails(String name,String mail,String mobile)throws Exception
	{
		return addCustomerDetails(Database.getConnection(),name,mail,mobile);
	}
	
	public static JSONObject addCustomerDetails(Connection con,String name,String mail,String mobile)throws Exception
	{
		JSONObject result = new JSONObject();
		int customer_id = -1;
		String status="error",message="An unexpected error occurred while adding user details";
		try
		{
			String query = "Insert into customer_details(name,mail,mobile) values(?,?,?);";
			PreparedStatement pstmt =  con.prepareStatement(query,Statement.RETURN_GENERATED_KEYS);
			pstmt.setString(1,name);
			pstmt.setString(2,mail);
			pstmt.setString(3,mobile);
			pstmt.executeUpdate();
			ResultSet rs = pstmt.getGeneratedKeys();
			if(rs.next())
			{				
				customer_id = rs.getInt("customer_id");
				status = "success";
				message = "message";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the client details: ",e);
		}
		result.put("customer_id",customer_id);
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject addNewEnquiry(String name,String mail,String mobile,int project_id)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message="An unexpected error occurred while adding new Enquiry!!";
		try(Connection con = Database.getNewConnection())
		{ 
			con.setAutoCommit(false);
			int customer_id = ViewHandler.getCustomerId(mail,mobile);
			if(customer_id == -1)
			{
				result = addCustomerDetails(con,name,mail,mobile);
				customer_id = result.getInt("customer_id");
			}

			if(customer_id != -1 && ViewHandler.isValidProjectId(project_id))
			{
				String query = "Insert into enquiry_req(project_id,customer_id,request_status) values(?,?,?)";
				PreparedStatement pstmt = con.prepareStatement(query);
				pstmt.setInt(1,project_id);
				pstmt.setInt(2,customer_id);
				pstmt.setBoolean(3,true);
				pstmt.executeUpdate();
				status="success";
				message = "Your enquiry form has been submitted successfully. Our team will reach out to you shortly.";
			}
			else{ 
				status = result.getString("status");
				message = status.equals("success") ? "Invalid Project Details..." : result.getString("message");
				 con.rollback();
			}
			con.setAutoCommit(true);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the new enquiry details: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject addNewReview(String author,String quotes,byte[] reviewerPic)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message="An unexpected error occurred while adding new Enquiry!!";
		try
		{
			String query = "Insert into reviews(author,quote,reviewerPic) values(?,?,?)";
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setString(1,author);
			pstmt.setString(2,quotes);
			pstmt.setBytes(3,reviewerPic);   
			int rowsAffected = pstmt.executeUpdate();
			
			if(rowsAffected > 0)
			{
				status="success";
				message = "Your review has been submitted successfully. Thank you for your thoughts.";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the new review: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject addNewCallBackReq(String name,String mail,String mobile,String preferred_time)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message="An unexpected error occurred while adding request!!";
		try(Connection con = Database.getNewConnection())
		{ 
			con.setAutoCommit(false);
			int customer_id = ViewHandler.getCustomerId(mail,mobile);
			if(customer_id == -1)
			{
				result = addCustomerDetails(con,name,mail,mobile);
				customer_id = result.getInt("customer_id");
			}
			
			if(customer_id != -1)
			{
				String query = "Insert into call_back_req(preferred_time,customer_id,request_status) values(?,?,?)";
				PreparedStatement pstmt = con.prepareStatement(query);
				pstmt.setString(1,preferred_time);
				pstmt.setInt(2,customer_id);
				pstmt.setBoolean(3,true);
				pstmt.executeUpdate();
				status="success";
				message = "Your form has been submitted successfully. Our team will reach out to you shortly.";
			}
			else
			{
				message =  result.getString("message");
				con.rollback();
			}
			con.setAutoCommit(true);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the new callback request: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject addNewServiceReq(String name,String mail,String mobile,String serviceType,String status,String landSize,String location)throws Exception
	{
		JSONObject result = new JSONObject();
		String codeStatus = "error",message = "An unexpected error occurred while add your request!..Pls try again later..";
		try
		{
			Connection con = Database.getNewConnection();
			int customer_id = ViewHandler.getCustomerId(mail,mobile);
			if(customer_id == -1)
			{
				result = addCustomerDetails(con,name,mail,mobile);
				customer_id = result.getInt("customer_id");
			} 
			
			if(customer_id != -1)
			{
				String query = "Insert into service_req(customer_id,service_type,status,landSize,location,request_status) values(?,?,?,?,?,?)";
				PreparedStatement pstmt = con.prepareStatement(query);
				pstmt.setInt(1,customer_id);
				pstmt.setString(2,serviceType);
				pstmt.setString(3,status);
				pstmt.setString(4,landSize);
				pstmt.setString(5,location);
				pstmt.setString(6,"Pending Approval");
				pstmt.executeUpdate();
				codeStatus="success";
				message = "Your request has been submitted successfully. Our team will reach out to you shortly.";
			}
			else{ 
				message =  result.getString("message");
				con.rollback();
			}
			con.setAutoCommit(true);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the new service request: ",e);
		}
		result.put("status",codeStatus);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject deleteProject(int project_id)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message = "An unexpected error occurred while remove the project!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidProjectId(project_id))
			{
				String query = "delete from projects where project_id = ?";
				Connection con = Database.getConnection();
				PreparedStatement pstmt = con.prepareStatement(query);
				pstmt.setInt(1,project_id);
				int rowsAffected = pstmt.executeUpdate();
			
				if(rowsAffected > 0){
					status = "success";
					message = "Project deleted successfully..";
				}
			}
			else 
				message = "Invalid project details...";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the project details: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	private static boolean deleteCustomer(int customer_id,Connection con) 
	{
		boolean isDeleted = false;
		try
		{
			String query = "delete from customer_details where customer_id = ?";
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setInt(1,customer_id);
			int rowsAffected = pstmt.executeUpdate();
			
			if(rowsAffected > 0)
				isDeleted = true;
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the client details: ",e);
		}
		return isDeleted;
	}
		
	public static JSONObject deleteReview(int review_id)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message = "An unexpected error occurred while remove the review!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidReviewId(review_id))
			{
				String query = "delete from reviews where review_id = ?";
				Connection con = Database.getConnection();
				PreparedStatement pstmt = con.prepareStatement(query);
				pstmt.setInt(1,review_id);
				int rowsAffected = pstmt.executeUpdate();
			
				if(rowsAffected > 0){
					status = "success";
					message = "Review deleted successfully..";
				}
			}
			else 
				message = "Invalid review details..";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the review: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject deleteEnquiryReq(int request_id,int customer_id)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		String message= "An unexpected error occurred while remove the details!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidEnquiryId(request_id))
			{
				String query = "delete from enquiry_req where enquiry_req_id = ?";
				return deleteRequests(query,request_id,customer_id);
			}
			else 
				message = "Invalid request details..";
		
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the enquiry request: ",e);
		}
		result.put("message",message);
		return result;
	}
	
	public static JSONObject deleteCallBackReq(int request_id,int customer_id)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		String message= "An unexpected error occurred while remove the details!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidCallBackReqId(request_id))
			{
				String query = "delete from call_back_req where call_back_req_id = ?";
				return deleteRequests(query,request_id,customer_id);
			}
			else 
				message = "Invalid request details...";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the callback request: ",e);
		}
		result.put("message",message);
		return result;
	}
	
	public static JSONObject deleteServiceReq(int request_id,int customer_id)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		String message= "An unexpected error occurred while remove the details!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidServiceReqId(request_id))
			{
				String query = "delete from service_req where service_id = ?";
				return deleteRequests(query,request_id,customer_id);
			}
			else
				message = "Invalid request details...";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the service request details: ",e);
		}
		result.put("message",message);
		return result;
	}
	
	public static JSONObject deleteRequests(String query,int request_id,int customer_id)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message = "An unexpected error occurred while remove the details!..Pls try again later..";
		try
		{ 
			if(ViewHandler.isValidCustomerId(customer_id))
			{
				Connection con = Database.getConnection();
				PreparedStatement pstmt = con.prepareStatement(query);
				pstmt.setInt(1,request_id);
				pstmt.executeUpdate();
				
				if(!Database.isReferencedbyOthers("customer_details","customer_id",customer_id))
				{
					deleteCustomer(customer_id,con);
				}
				
				status = "success";
				message = "Details deleted successfully..";
			}
			else 
				message = "Invalid customer details";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the user request details: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		return result;
	}
	
	public static JSONObject toggleCallbackReqStatus(int request_id,boolean request_status)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		String message= "An unexpected error occurred while remove the details!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidCallBackReqId(request_id))
			{
				String query = "update call_back_req set request_status = ? where call_back_req_id = ?";
				return toggleReqStatus(query,request_id,request_status);
			}
			else
				message = "Invalid request details...";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while toggle the callback request status: ",e);
		}
		result.put("message",message);
		return result;
	}
	
	public static JSONObject toggleEnquiryReqStatus(int request_id,boolean request_status)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		String message= "An unexpected error occurred while remove the details!..Pls try again later..";
		try
		{
			if(ViewHandler.isValidEnquiryId(request_id))
			{
				String query = "update enquiry_req set request_status = ? where enquiry_req_id = ?";
				return toggleReqStatus(query,request_id,request_status);
			}
			else
				message = "Invalid request details...";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while toggle enquiry request details: ",e);
		}
		result.put("message",message);
		return result;
	}
	
	
	public static JSONObject toggleReqStatus(String query,int request_id,boolean request_status)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error", message= "An unexpected error occurred while toggle request status!..Pls try again later..";
		try
		{
			Connection con = Database.getConnection();
			PreparedStatement pstmt = con.prepareStatement(query);
			pstmt.setBoolean(1,request_status);
			pstmt.setInt(2,request_id);
			int rowsAffected = pstmt.executeUpdate();
			
			if(rowsAffected > 0){	
				status = "success";
				message = "Request status toggled successfully..";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while toggle the user request details: ",e);;
		}
		result.put("status",status);
		result.put("message",message);
		return result;		
	}
	
}





