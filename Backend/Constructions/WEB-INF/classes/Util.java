package utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Properties;
import java.util.Arrays;
import java.util.Date;

import java.text.SimpleDateFormat;
import java.sql.Array;
import java.security.Key;
import java.util.logging.Level;
import java.util.logging.Logger;
    
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;

import org.json.JSONObject;
import org.json.JSONArray;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import javax.servlet.http.Part;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class Util
{
	private static Logger logg = Logger.getLogger("UtilLogger");
	private static Key signingKey;
    private static final long EXPIRATION_TIME = 86400000; 
	
	public static Key convertStringToKey(String keyString) { 
		byte[] keyBytes = Base64.getDecoder().decode(keyString);
 
		return Keys.hmacShaKeyFor(keyBytes);
	}
	
	public static String convertKeytoString(Key key)
	{
		return Base64.getEncoder().encodeToString(key.getEncoded());
	}
	
	public static void setSigningKey(String key)
	{
		signingKey = convertStringToKey(key);
	}
	
	public static Key getSigningKey()
	{
		return signingKey;
	}

    public static String generateToken(String userId, int account_id,String mail,int role_id) {
        return Jwts.builder()
                .setSubject(userId)
                .claim("account_id", account_id)
                .claim("mail", mail)
                .claim("role_id", String.valueOf(role_id))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(signingKey)
                .compact();
    }
	
	public static boolean validateJWTtoken(HttpServletRequest request,HttpServletResponse response) 
	{
		 
        try 
		{
			String authHeader = request.getHeader("Authorization");
			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				response.getWriter().write("Missing or invalid Authorization header");
				return false;
			}
			
			Key secretKey = signingKey;
			if(secretKey == null)
			{
				response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Configuration not initialized.");
				return false;
			}

			String token = authHeader.substring(7);
			
            Claims claims = Jwts.parser()
                    .setSigningKey(signingKey)
                    .parseClaimsJws(token)
                    .getBody();

			return true;
		} catch (Exception e) {
			logg.log(Level.INFO,"Error occurred while Validate the JWT Token: ",e);
			return false;
		}
	}

	public static String convertToJsonParams(HttpServletRequest request)throws Exception
	{
		StringBuilder jsonBuffer = new StringBuilder();
            String line;

			BufferedReader reader = request.getReader();
			while ((line = reader.readLine()) != null) {
				jsonBuffer.append(line);
			}

        return jsonBuffer.toString();
	}
	
	public String createFireBaseCustomToken(String uid,String mail, String displayName, String photoURL) throws FirebaseAuthException {
        // Create custom claims
        Map<String, Object> additionalClaims = new HashMap<>();
        additionalClaims.put("email", mail);
        additionalClaims.put("displayName", displayName);
        additionalClaims.put("photoURL", photoURL); 

        // Create and return the custom token
        return FirebaseAuth.getInstance().createCustomToken(uid, additionalClaims);
    }
	
	public Map<String, List<byte[]>> processImageCategories(HttpServletRequest request, String baseName)throws Exception
	{
		Map<String,List<byte[]>> categoryImages = new HashMap<String,List<byte[]>>();		
		int categoryIndex = 0;
		String categoryType;
		
		while((categoryType = getPartAsString(request,baseName + "[" + categoryIndex + "][categoryType]")) != null)
		{
			List<byte[]> images = new ArrayList<byte[]>();
			int fileIndex = 0;
			Part filePart;
			while((filePart = request.getPart(baseName+"[" + categoryIndex + "][images][" + fileIndex + "]")) != null)
			{
				byte[] fileData = convertPartToByteArray(filePart);
				images.add(fileData);
				fileIndex++;
			}
			categoryImages.put(categoryType,images);
			categoryIndex++;
		}
		
		return categoryImages;
	}
	
	public String getPartAsString(HttpServletRequest request, String name) throws Exception {
		Part part = request.getPart(name);
		 byte[] partData = convertPartToByteArray(part);
		if (partData != null) {
			return new String(partData,"UTF-8");
		}
		return null;
	}
	
	public Long getPartAsLong(HttpServletRequest request, String name) throws Exception {
		 String partString = getPartAsString(request, name);
		if (partString != null) {
			try {
				return Long.valueOf(partString.trim()); 
			} catch (NumberFormatException e) {
				throw new IllegalArgumentException("The provided part is not a valid Long: " + partString, e);
			}
		}
		return null;
	}
	
	public int getPartAsInt(HttpServletRequest request, String name) throws Exception {
		 String partString = getPartAsString(request, name);
		if (partString != null) {
			try {
				return Integer.parseInt(partString.trim()); 
			} catch (NumberFormatException e) {
				throw new IllegalArgumentException("The provided part is not a valid Long: " + partString, e);
			}
		}
		return 0;
	}
	
	public byte[] convertPartToByteArray(Part filePart) throws IOException {

		if (filePart != null) {
			try (InputStream inputStream = filePart.getInputStream();
				 ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
				byte[] data = new byte[1024];
				int nRead;
				while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
					buffer.write(data, 0, nRead);
				}
				buffer.flush();
				return buffer.toByteArray();  
			}
		}
		return null;
    }
	
	public List<Map<String, Long>> convertPriceRanges(JSONArray priceLabels) {
        List<Map<String, Long>> ranges = new ArrayList<>();

		try{
			for (int i = 0; i <priceLabels.length();i++) {
				String label = (String)priceLabels.get(i);
				Map<String, Long> range = new HashMap<>();
				String cleanedLabel = label.replaceAll("[^0-9\\-]", ""); 
				String[] bounds = cleanedLabel.split("-");

				long min = bounds.length > 0 ? Long.parseLong(bounds[0]) * 100000 : 0;
				long max = bounds.length > 1 ? Long.parseLong(bounds[1]) * 100000 : Long.MAX_VALUE;

				range.put("min", min);
				range.put("max", max);
				ranges.add(range);
			}
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while converting price detials: ",e);
		}

        return ranges;
    }
	
	
	public static String getStringProperty(Properties props, String key) {
		Object value = props.getProperty(key);
		return (value != null) ? value.toString() : null;
	}
	
	 public static String[] jsonArrayToStringArray(JSONArray jsonArray) throws Exception {
        int length = jsonArray.length();
        String[] stringArray = new String[length];

        for (int i = 0; i < length; i++) {
            stringArray[i] = jsonArray.getString(i);
        }

        return stringArray;
    }
	
	public static JSONArray arrayToJsonarray(Array array)throws Exception 
	{
		if (array == null) {
			return new JSONArray();
		}
		String[] arrayData = null;
		try {
			arrayData = (String[]) array.getArray();
		} catch (Exception e) {
			e.printStackTrace(); 
			return new JSONArray(); 
		}
		if (arrayData == null || arrayData.length == 0) {
			return new JSONArray();
		}
		return new JSONArray(arrayData);
	}
	
	public static Date parseToDate(String time,String datestr,String format)throws Exception
	{
		Date date=null;
		if(datestr!=null && !datestr.equals(""))
		{
			SimpleDateFormat sdf = new SimpleDateFormat(format);
			if(time!=null && !time.equals(""))
			{
				date = sdf.parse(datestr + " " + time);
			}
			else
			{
				date = sdf.parse(datestr);
			}
		}
		return date;
	}
	
	public static String formatDate(String date)
    {
        int d=Integer.parseInt(date)%10;
        switch(d)  
        {
            case 1:
                return date+"ST";
            case 2:
                return date+"ND";
            case 3:
                return date+"RD";
            default:
                return date+"TH";
        }
    }
	
	 public static BufferedImage generateQRCode(String content) {
        int width = 300;
        int height = 300;

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = (Graphics2D) image.getGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, width, height);
            graphics.setColor(Color.BLACK);

            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    if (bitMatrix.get(x, y)) {
                        graphics.fillRect(x, y, 1, 1);
                    }
                }
            }
            return image;

        } catch (WriterException e) {
            logg.log(Level.INFO,"Error occurred while generate QR code: ",e);
            return null;
        }
    }
	
	public static String formatCurrency(double currency)
	{		
		int rupee =(int) Math.floor(currency);
		int paise =(int)Math.ceil((currency * 100) % 100);
		System.out.println( String.valueOf(paise).length());
		if( String.valueOf(paise).length()==1)
		{
		    return "Rs."+rupee+".0"+paise;
		}
        return "Rs."+rupee+"."+paise;
	}
	
	public static String parseToString(Date date,String format)throws Exception
	{
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		return sdf.format(date);
	}
	
	public static String getAsciiSubstring(String input, int length) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length && i < input.length(); i++) {
            result.append((int) input.charAt(i));
        }
        return result.toString();
    }
	
	public static String convertBase64(Part imagePart)throws Exception
	{
		InputStream inputStream = imagePart.getInputStream();
		 ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int bytesRead;
        
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, bytesRead);
        }

        byte[] imageBytes = outputStream.toByteArray();
        return Base64.getEncoder().encodeToString(imageBytes);
	}
	
	public static JSONObject checkApacheDirectory()throws Exception
	{
		JSONObject result=new JSONObject();
		String status="error",message="Apache Software Foundation Tomcat 9.0 installation details not found in environment variables.";
		try
		{
			String softwareHome = System.getenv("APACHE_SOFTWARE_FOUNDATION_HOME");
			String tomcatVersion = "9.0";
			String possiblePath="";

			if (softwareHome != null) {
				possiblePath = softwareHome + File.separator + "Tomcat " + tomcatVersion + File.separator + "temp";
				File file = new File(possiblePath);
				if(createDirectoryIfNotExist(file))
					status="success";
					message="Directory found successfully!!..";
			} else {
				String programFiles = System.getenv("ProgramFiles");
				if (programFiles != null) {
					possiblePath="";
					possiblePath = programFiles + File.separator + "Apache Software Foundation" + File.separator + "Tomcat " + tomcatVersion + File.separator + "temp";
					File file = new File(possiblePath);
					if(createDirectoryIfNotExist(file))
						status="success";
						message="Directory found successfully!!..";
				} 
			}	
			result.put("path",possiblePath);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while check Apache Directory: ",e);
		}
		result.put("status",status);
		result.put("message",message);
		
		return result;
	}
	
	
	public static boolean createDirectoryIfNotExist(File file) {
        if (!file.exists() && !file.isDirectory()) {
            if (!file.mkdirs()) {
                return false;
            }
        } 
		
		return true;
    }
	
	public static ArrayList<Properties> getTableDataConfigurations()
	{
		ArrayList<Properties> configurations = new ArrayList<>();
		
		try
		{
			Properties tableData = new Properties();
			ArrayList<String> attributes = new ArrayList<>();
			
			attributes.add("URL_PATH");
			attributes.add("CLASS_NAME");
			attributes.add("METHOD_NAME");
			attributes.add("API_TYPE");
			tableData.put("tagName","ServletAPIMapping");
			tableData.put("fileLocation","C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\webapps\\Constructions\\WEB-INF\\classes\\parser\\servlet-api.xml");
			tableData.put("query","INSERT INTO servlet_apimapping (url_path, class_name, method_name,api_type) VALUES ( ?, ?, ?, ?)");
			tableData.put("attributes",attributes);
			configurations.add(tableData);
			
			String tableDataLocation = "C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\webapps\\Constructions\\WEB-INF\\classes\\parser\\tableData.xml";
			attributes = new ArrayList<>();
			tableData = new Properties();
			attributes.add("CATEGORY_TYPE_ID");
			attributes.add("CATEGORY");
			tableData.put("tagName","CATEGORIES");
			tableData.put("fileLocation",tableDataLocation);
			tableData.put("query","INSERT INTO categories (category_type_id,category) VALUES (?,?)");
			tableData.put("attributes",attributes);
			configurations.add(tableData);
			
			attributes = new ArrayList<>();
			tableData = new Properties();
			attributes.add("AMENITY");
			attributes.add("AMENITY_CATEGORY_ID");
			tableData.put("tagName","AMENITIES");
			tableData.put("fileLocation",tableDataLocation);
			tableData.put("query","INSERT INTO amenities (amenity, amenity_category_id) VALUES (?, ?)");
			tableData.put("attributes",attributes);
			configurations.add(tableData);
			 
			attributes = new ArrayList<>();
			tableData = new Properties();
			attributes.add("ROLE"); 
			tableData.put("tagName","ROLES");
			tableData.put("fileLocation",tableDataLocation);
			tableData.put("query","INSERT INTO roles (role) VALUES ( ?)");
			tableData.put("attributes",attributes);
			configurations.add(tableData);
			
			attributes = new ArrayList<>();
			tableData = new Properties();
			attributes.add("ACTION"); 
			tableData.put("tagName","ACTIONS");
			tableData.put("fileLocation",tableDataLocation);
			tableData.put("query","INSERT INTO actions (action) VALUES ( ?)");
			tableData.put("attributes",attributes);
			configurations.add(tableData);
			
			attributes = new ArrayList<>();
			tableData = new Properties();
			attributes.add("ROLEID"); 
			attributes.add("ACTIONID"); 
			tableData.put("tagName","ROLEACTONS");
			tableData.put("fileLocation",tableDataLocation);
			tableData.put("query","INSERT INTO role_actions (role_id,action_id) VALUES (?, ?)");
			tableData.put("attributes",attributes);
			configurations.add(tableData);
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while get Table configurations: ",e);
		}
		return configurations;
	}
	
	
	public static ArrayList getAllLanguages()
	{
		 ArrayList<String> languageList = new ArrayList<>(Arrays.asList(
                "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
                "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Bengali", "Urdu", "Tamil",
                "Telugu", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Persian", "Turkish",
                "Thai", "Vietnamese", "Dutch", "Swedish", "Danish", "Norwegian", "Finnish", "Greek",
                "Polish", "Hungarian", "Czech", "Slovak", "Romanian", "Ukrainian", "Hebrew",
                "Indonesian", "Malay", "Filipino", "Swahili", "Afrikaans", "Icelandic", "Estonian",
                "Latvian", "Lithuanian", "Croatian", "Serbian", "Slovenian", "Bulgarian",
                "Macedonian", "Albanian", "Armenian", "Georgian", "Uzbek", "Kazakh", "Kyrgyz",
                "Tajik", "Turkmen", "Mongolian", "Welsh", "Irish", "Scottish Gaelic", "Maori"
        ));
		return languageList;
	}
	
}