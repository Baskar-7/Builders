
package filter;

import javax.servlet.ServletException;
import javax.servlet.FilterConfig;
import javax.servlet.Filter;
import javax.servlet.ServletResponse;
import javax.servlet.ServletRequest;
import javax.servlet.FilterChain;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims; 
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.io.IOException; 

import utils.ConfigFileManager; 
import utils.Util;

public class JwtSessionManagementFilter implements Filter {
	
	 private Key signingKey; 
	 
	 public void init(FilterConfig filterConfig) throws ServletException { //get the configManager class object from the servletContext and access the server details
        ConfigFileManager configManager = (ConfigFileManager) filterConfig.getServletContext().getAttribute("configManager");
        if (configManager != null && configManager.hasProperty("SIGNING_KEY_PROPERTY")) {
            signingKey = Util.convertStringToKey(configManager.getProperty("SIGNING_KEY_PROPERTY"));
        } else {
            signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);  
            if (configManager != null) {
                configManager.setProperty("SIGNING_KEY_PROPERTY",Util.convertKeytoString(signingKey)); 
            }
        }
    }
    
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) //filters every request to create or retrieve the session objects 
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
		
		
        try {
			
			 if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
				res.setHeader("Access-Control-Allow-Credentials", "true");
				res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
				res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
				res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
				res.setHeader("Access-Control-Expose-Headers", "Authorization"); 
				 
				res.setStatus(HttpServletResponse.SC_OK); // Respond with 200 OK
				chain.doFilter(req, res);
				return;
			}
			
			HttpSession session = req.getSession(false);			
			String urlPath = (req.getRequestURI()).replaceFirst("/Constructions/api/json/action/", "");
			if(urlPath.equalsIgnoreCase("logout"))
			{
				if(session != null)
					session.invalidate();
					
				res.setStatus(HttpServletResponse.SC_OK);
				return;
			}
			
			String token = req.getHeader("Authorization");
			
            if (session == null && token!=null && !token.isEmpty()) {
			 token = token.substring(7);
             Claims claims = Jwts.parser()
                    .setSigningKey(signingKey)
                    .parseClaimsJws(token)
                    .getBody();
                session = req.getSession(true);
                session.setAttribute("userId", claims.getSubject());
                session.setAttribute("account_id", claims.get("account_id"));
                session.setAttribute("role_id", claims.get("role_id"));
                session.setAttribute("mail", claims.get("mail"));
            } 
			
            chain.doFilter(req, res);
        } catch (Exception e) {
            chain.doFilter(req, res);
        }
    }
}
