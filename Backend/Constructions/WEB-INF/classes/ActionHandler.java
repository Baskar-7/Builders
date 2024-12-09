
package constructions;

import utils.Mail;
import utils.AuthUtil;
import utils.Util; 
 
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpSession;
import javax.servlet.http.Part;

import java.io.PrintWriter;  

import java.util.ArrayList; 
import java.util.List; 
import java.util.Map; 
import java.util.Random; 
import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONObject;
import org.json.JSONArray; 



import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

  
@MultipartConfig(
    maxFileSize = 80485760, // Set to 10 MB in bytes (adjust as needed)
    maxRequestSize = 80971520, // Set to 20 MB in bytes (adjust as needed)
    fileSizeThreshold = 3048576 // 1 MB in bytes
)

public class ActionHandler extends Util
{
	private static volatile ActionHandler instance = null;
	private static Logger logg = Logger.getLogger("ActionLogger");

    public ActionHandler() {
    }

    public static ActionHandler getInstance() {
        if (instance == null) {
            Class var0 = ActionHandler.class;
            synchronized(ActionHandler.class) {
                if (instance == null) {
                    instance = new ActionHandler();
                }
            }
        }

        return instance;
    }
	
	public void sendOTP(HttpServletRequest request, HttpServletResponse response)throws Exception 
	{
		try{
			JSONObject result=new JSONObject();
			String status="",message="An unexpected error Occurred!!Check your credentials!";
						
			JSONObject params= new JSONObject(convertToJsonParams(request));
			String mailId = params.getString("mailId");
			boolean existingUser=true;
			
			Random random = new Random();
			String oneTimePassword = String.valueOf(random.nextInt(9000) + 1000);
			String content="Please enter the below OTP to continue.<table width='750px' border='0' cellspacing='0' cellpadding='0'><tbody><tr><td background='https://i.postimg.cc/SRG7Mhp5/OTPTemplate.jpg'  style='background-repeat:no-repeat' width='100%' height='750' valign='top' class='bgresize'><div><table width='50%' border='0' cellspacing='0' cellpadding='0'><tbody><tr><td align='left' valign='top' class='mobile-padding'><table width='100%' border='0' cellspacing='0' cellpadding='0'><tbody><tr><td align='left' valign='top' style='padding-top: 220px;padding-left:215px;font-size:45px;color: #1F4167;letter-spacing: 14px;' class='padding65'><span class='banner-heading55'>"+oneTimePassword+"</span></td></tr></tbody></table></td></tr></tbody></table></div></td></tr></tbody></table>";
			status=Mail.sendMail(mailId,content);
			
			if(status.equals("success"))
			{
				UpdateHandler.addOtpDetails(mailId,oneTimePassword);
				result.put("userMail",mailId);
				// result.put("OTP",oneTimePassword);
				message="OTP send Successfully!!";
			}
			result.put("message",message);
			result.put("status",status);
			PrintWriter out=response.getWriter();
			out.print(result);
		}
		catch(Exception e){
			logg.log(Level.INFO,"Error occurred while Send otp: ",e);
		}
    }
	
	public void authenticateUser(HttpServletRequest request, HttpServletResponse response)throws Exception 
	{
		JSONObject result=new JSONObject();
		String status="error",message="Login failed..Please try again later!..";
		try{
			JSONObject params= new JSONObject(convertToJsonParams(request));
			String mail = params.getString("mailId"),
			  oneTimePassword = params.getString("otp");

			result=ViewHandler.verifyOTP("mail",mail,oneTimePassword);
			status=result.getString("status");
			if(status.equals("success"))
			{
				String userId=ViewHandler.isValidUser(mail) ;
				if(userId == null) //creates a new user 
				{
					int atIndex = mail.indexOf('@');
					String username = mail.substring(0, atIndex);
					userId=UpdateHandler.addUser(username,mail,"","",2);
				}
				
				if(userId!=null || !userId.equals(""))
				{ 
					JSONObject userInfo=ViewHandler.getUserInfo(mail);
					String name = userInfo.getString("fname"),photoURL = userInfo.getString("profile_pic");
					int account_id = userInfo.getInt("account_id"),role_id = userInfo.getInt("role_id");
					
					String jwtToken = Util.generateToken(userId,account_id,mail,role_id);
					String customToken = createFireBaseCustomToken(userId,mail,name, photoURL);
 
					result.put("jwtToken",jwtToken);
					result.put("customToken",customToken); 
					// result.put("userId",userId);
					message="Login Successfully...";
				}
			}
			else
			{
				status = "error";
				message=result.getString("message");
			}
		}
		catch(Exception e){
			logg.log(Level.INFO,"Error occurred while Authenticate user: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		
		PrintWriter out=response.getWriter();
		out.print(result);
    }
	
	public void checkAndUpdateUser(HttpServletRequest request,HttpServletResponse response) throws Exception
	{
		JSONObject result=new JSONObject();
		String status="error",message="Login failed..Please try again later!..";
		boolean isLogined = true;
		try{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			
			String name = params.getString("name"),
			       mail = params.getString("mail"),
				   user_id=params.getString("user_id");

			if(ViewHandler.isValidUser(mail) == null)
			{
				 user_id = UpdateHandler.addUser(name,mail,"",user_id,2);
				 
				 if(user_id.equals("error"))
				 {
					isLogined = false;
				 }
			}
			
			if(isLogined)
			{
				status="success";
				message="Login Successfully...";
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while Update the user details: ",e);
		}		
		result.put("status",status);
		result.put("message",message);
		
		PrintWriter out=response.getWriter();
		out.print(result);
	}
	
	public void verifyCredentials(HttpServletRequest request,HttpServletResponse response)
	{
		try{
			JSONObject params= new JSONObject(convertToJsonParams(request));
			String credential  = params.getString("credential"),
			   credentail_type = "mail",
			   otp             = params.getString("otp");
			   
			JSONObject result=ViewHandler.verifyOTP(credentail_type,credential,otp);
		    PrintWriter out=response.getWriter();
			out.print(result);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while Verify the credentails: ",e);
		}
	}
	
	public void getUserInfo(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject userInfo=new JSONObject();
		try
		{
			JSONObject params= new JSONObject(convertToJsonParams(request));
			String  mail ="";
			if(params.has("mail"))
			{
				mail = params.getString("mail");
			}
			else {
				HttpSession session = request.getSession(false);
				if(session != null)
					mail =(String) session.getAttribute("mail");
			} 
			userInfo = ViewHandler.getUserInfo(mail);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while fectching the user details: ",e);
		}
		PrintWriter out=response.getWriter();
		out.print(userInfo);		
	}
	
	public void updateProfilePic(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result=new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error occurred while fetching Categories!.Please try again after sometime...");
		try
		{
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("UPDATE_PROFILE_PIC",(String)session.getAttribute("role_id")))
			{
				Part filePart = request.getPart("file");
				byte[] pic = convertPartToByteArray(filePart);
				int image_id = Integer.parseInt(request.getParameter("data"));
				result = UpdateHandler.updateSingleImage(pic,image_id);  
			}
			else { 
				result.put("message", "Unauthorized access!");
			} 
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while Update the profile pic: ",e);
		}
		PrintWriter out=response.getWriter();
		out.print(result);
	}
	
	public void getAllAmenities(HttpServletRequest request,HttpServletResponse response)throws Exception 
	{
		JSONObject result = new JSONObject();
		try
		{
			ArrayList amenities = ViewHandler.getAllAmenities();
			result.put("amenities",amenities);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while fecting amenity details: ",e);
		}
		
		PrintWriter out=response.getWriter();
		out.print(result);
	}
	
	public void getCategories(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		String status = "error",message = "An unexpected error occurred while fetching Categories!.Please try again after sometime...";
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			JSONArray categoryTypeIds = params.getJSONArray("categoryTypeIds");
			
			for(int i=0;i<categoryTypeIds.length();i++)
			{
				int id =(Integer) categoryTypeIds.get(i);
				result.put(String.valueOf(id),ViewHandler.getCategories(id));
			}
			status = "success";
			message = "Categories fetched successfully";
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the various categories used: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void updateUserDetails(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result=new JSONObject();
		String status="error",message="An unexpected error occurred while updating User Details!.Please try again after sometime...";
				
		try
		{
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("UPDATE_USER_DETAILS",(String)session.getAttribute("role_id")))
			{  
				JSONObject param= new JSONObject(convertToJsonParams(request));
				JSONObject user_details = param.getJSONObject("user_details");
				int role_id =(int)session.getAttribute("role_id");
				
				String fname = user_details.getString("fname"),
					   lname = user_details.getString("lname"),
					   mail = user_details.getString("mail"),
					   mobile = Long.toString(user_details.getLong("mobile")),
					   pincode = String.valueOf(user_details.getInt("pincode")),
					   address = user_details.getString("address"),
					   city = user_details.getString("city"),
					   state = user_details.getString("state"),
					   userId  =(String) session.getAttribute("userId"),
					   maplocation=user_details.getString("maplocation"),
					   isValidUser = ViewHandler.isValidUser(mail);
				boolean isNewUserMail = false;
				if(isValidUser == null)  
				{
					String user_id = UpdateHandler.addUser(fname,lname,mail,mobile,role_id,"",pincode,city,state,new byte[0],maplocation,address);
					JSONObject userInfo=ViewHandler.getUserInfo(user_id);
						
					String name = userInfo.getString("fname"),photoURL = userInfo.getString("profile_pic");
					int account_id = userInfo.getInt("account_id");
					String jwtToken = Util.generateToken(user_id,account_id,mail,role_id);
					String customToken = createFireBaseCustomToken(user_id,mail, name,photoURL);
					result.put("jwtToken",jwtToken);
					result.put("customToken",customToken);
					isNewUserMail = true;
				}
				else if(isValidUser.equals(userId))
				{
					boolean isUpdated = UpdateHandler.updateUserDetails(fname,lname,mail,mobile,pincode,city,state,userId,maplocation);
		
					if(isUpdated){
						status = "success";
						message = "Details Updated Successfully!..";
					}
				}
				else
				{
					message = "This email is already associated with another account. Please try a different email..";
				}
				result.put("isNewUserMail",isNewUserMail);
			}
			else { 
				 message = "Unauthorized access!";
			} 
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while Update the user details: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		
		PrintWriter out=response.getWriter();
		out.print(result);
	}
	
	
	public void addNewProject(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result=new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error occurred while adding projects!.Please try again after sometime...");
		try
		{
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("ADD_NEW_PROJECT",(String)session.getAttribute("role_id")))
			{  
				int account_id =(int) session.getAttribute("account_id");
				JSONObject params = new JSONObject(getPartAsString(request,"data"));
				Part filePart = request.getPart("elevation_poster");
				byte[] elevationPoster = convertPartToByteArray(filePart);
				
				List<Integer> amenitiesList = new Gson().fromJson(getPartAsString(request, "amenities"), new TypeToken<List<Integer>>(){}.getType());

				List<Map<String,String>> configurations = new Gson().fromJson(getPartAsString(request,"configurations"),new TypeToken<List<Map<String,String>>>(){}.getType());

				Map<String, List<byte[]>> blueprints = processImageCategories(request,"bluePrints"),
										  gallery    = processImageCategories(request,"gallery");
				
				result = UpdateHandler.addNewProject(blueprints,gallery,amenitiesList,configurations,elevationPoster,params,account_id);
			}
			else { 
				result.put("message", "Unauthorized access!");
			} 
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding new Project: ",e);
		}	
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void getProjects(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error occurred while fetching Projects!.Please try again after sometime...");
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			List<Map<String, Long>> priceRanges = convertPriceRanges(params.getJSONArray("priceRange"));
			result = ViewHandler.getProjOverview(params.getString("location"), priceRanges, params.getJSONArray("amenities"), params.getJSONArray("projectType"),params.getString("searchValue"),params.getString("project_status"));
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the projects: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void getProjectDetails(HttpServletRequest request, HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			int project_id = params.getInt("projectId");
			result = ViewHandler.getProjectDetails(project_id);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the project details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void addNewEnquiry(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			String name = params.getString("name"),
				 mobile = Long.toString(params.getLong("mobile")),
				 mail   = params.getString("mail");
			int project_id = params.getInt("project_id");
		    result = UpdateHandler.addNewEnquiry(name,mail,mobile,project_id);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the new enquiry request: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void addReview(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			JSONObject params = new JSONObject(getPartAsString(request,"data"));
			String author  = params.getString("author"),
					quote  = params.getString("quote");
					
			Part filePart = request.getPart("file");
			byte[] reviewerPic = convertPartToByteArray(filePart);
		    result = UpdateHandler.addNewReview(author,quote,reviewerPic);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding new review: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void getAllReviews(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			result = ViewHandler.getAllReviews(params.getString("searchValue"));
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the review details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void getUserRequests(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			boolean _isAuthorized = false;
			HttpSession session = request.getSession(false);
			if(session != null )
			{
				String role_id = (String)session.getAttribute("role_id");
				JSONObject params = new JSONObject(convertToJsonParams(request));
				String requestType = params.getString("requestType"),
					   request_status = params.getString("request_status"),
					   searchValue =  params.getString("searchValue");
				if("callbacks".equals(requestType))
				{
					_isAuthorized = AuthUtil.isAuthorized("GET_CALLBACK_REQUESTS",role_id);
					if(_isAuthorized)
						result = ViewHandler.getCallBackReq(searchValue,request_status);
				}
				else if("enquires".equals(requestType))
				{
					_isAuthorized = AuthUtil.isAuthorized("GET_ENQUIRES",role_id);
					if(_isAuthorized)
						result = ViewHandler.getEnquires(searchValue,request_status);
				}
				else if("services".equals(requestType))
				{
					_isAuthorized = AuthUtil.isAuthorized("GET_SERVICE_REQUESTS",role_id);
					if(_isAuthorized)
						result = ViewHandler.getServiceReq(searchValue,request_status);
				}
			}
			 
			if(!_isAuthorized){
				result.put("message", "Unauthorized access!");
			} 
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while fetching the user request details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result); 
	}
		

	public void addNewCallBackReq(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			String name = params.getString("name"),
				   mail = params.getString("mail"),
				 mobile = Long.toString(params.getLong("mobile")),
          preferred_time = params.getString("time");
		  
		  result = UpdateHandler.addNewCallBackReq(name,mail,mobile,preferred_time);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding the new call back request details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void addServiceReq(HttpServletRequest request,HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			JSONObject params = new JSONObject(convertToJsonParams(request));
			String name = params.getString("name"),
				   mail = params.getString("mail"),
				   mobile = Long.toString(params.getLong("mobile")),
				   landSize = params.getString("landSize"),
				   serviceType = params.getString("service_type"),
			       status = params.getString("status1")+" & "+params.getString("status2"),
				   location = params.getString("location");
				   
			result = UpdateHandler.addNewServiceReq(name,mail,mobile,serviceType,status,landSize,location);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while adding new service request details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void deleteProject(HttpServletRequest request, HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("DELETE_PROJECT",(String)session.getAttribute("role_id")))
			{
				JSONObject params = new JSONObject(convertToJsonParams(request));
				result = UpdateHandler.deleteProject(params.getInt("project_id"));	
			}
			else { 
				result.put("message", "Unauthorized access!");
			} 
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the project details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void deleteReview(HttpServletRequest request, HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("GET_ENQUIRES",(String)session.getAttribute("role_id")))
			{
				JSONObject params = new JSONObject(convertToJsonParams(request));
				result = UpdateHandler.deleteReview(params.getInt("review_id"));	
			}
			else { 
				result.put("message", "Unauthorized access!");
			} 				
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while delete the review details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void deleteRequests(HttpServletRequest request, HttpServletResponse response)throws Exception
	{
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{ 
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("DELETE_REQUESTS",(String)session.getAttribute("role_id")))
			{
				JSONObject params = new JSONObject(convertToJsonParams(request));
				String deleteFrom = params.getString("delete");
				int customer_id = params.getInt("customer_id") ;
				
				if(deleteFrom.equals("service"))
					result = UpdateHandler.deleteServiceReq(params.getInt("service_req_id"),customer_id);
				else if(deleteFrom.equals("callbacks"))
					result = UpdateHandler.deleteCallBackReq(params.getInt("call_back_req_id"),customer_id);
				else if(deleteFrom.equals("enquires"))
					result = UpdateHandler.deleteEnquiryReq(params.getInt("enquiry_req_id"),customer_id);	
			}
			else {
				result.put("message", "Unauthorized access!");
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while remove the request details: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
	public void toggleRequestStatus(HttpServletRequest request,HttpServletResponse response)throws Exception
	{		
		JSONObject result = new JSONObject();
		result.put("status","error");
		result.put("message","An unexpected error Occurred! Pls try again after sometime!..");
		try
		{
			HttpSession session = request.getSession(false);
			if(session != null && AuthUtil.isAuthorized("TOGGLE_REQUEST_STATUS",(String)session.getAttribute("role_id")))
			{
				JSONObject params = new JSONObject(convertToJsonParams(request));
				String deleteFrom = params.getString("toggle");
				boolean request_status = params.getBoolean("request_status");
				 
				if(deleteFrom.equals("callbacks"))
					result = UpdateHandler.toggleCallbackReqStatus(params.getInt("call_back_req_id"),request_status);
				else if(deleteFrom.equals("enquires"))
					result = UpdateHandler.toggleEnquiryReqStatus(params.getInt("enquiry_req_id"),request_status);	
			}
			else {
				result.put("message", "Unauthorized access!");
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Exception occurred while toggle request status: ",e);
		}
		PrintWriter out = response.getWriter();
		out.print(result);
	}
	
}

