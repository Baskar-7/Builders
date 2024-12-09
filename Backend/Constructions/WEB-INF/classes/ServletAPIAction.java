
package servletApi;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


public class ServletAPIAction extends HttpServlet {

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		processRequest(request, response);
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		processRequest(request, response);
	}
	
	/*   api/json/[moduleName]/[methodName]  */
	private void processRequest(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try { 
		    response.setHeader("Access-Control-Allow-Credentials", "true");
			request.setCharacterEncoding("UTF-8");
			int errCode = ServletAPIController.getInstance().execute(request, response);
			if (errCode != 200) {
				response.sendError(errCode);
			}
		}catch (Exception ex) {
			ex.printStackTrace();
		}
	}

}

