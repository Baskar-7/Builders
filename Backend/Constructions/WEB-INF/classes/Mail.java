
package utils;

import java.util.Properties;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class Mail
{
	public static String sendMail(String email,String content)
    {
	    String status="error";
		String subject="EasyTickets";
		String from = "easyTickets.in@gmail.com";
		String host = "localhost";
	  
		Properties props=(Properties)System.getProperties();
		props.put("mail.smtp.starttls.enable", "true");
		props.put("mail.smtp.starttls.required", "true");
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.host", "smtp.googlemail.com");
		props.put("mail.smtp.port", "587");
		props.put("mail.smtp.ssl.protocols","TLSv1.2");
		 props.put("mail.smtp.ssl.trust", "smtp.googlemail.com");
	  
        Session session = Session.getInstance(props,new javax.mail.Authenticator()  
	    {
            protected PasswordAuthentication getPasswordAuthentication() 
			{
                return new PasswordAuthentication(from,"fstx hazk bqbg mmfa");
            }
        });
		session.setDebug(true);
	
      try{
         MimeMessage message = new MimeMessage(session);
         message.setFrom(new InternetAddress(from));
         message.addRecipient(Message.RecipientType.TO,new InternetAddress(email));
         message.setSubject(subject);
         message.setContent(content,"text/html");
         
         Transport.send(message);
		 status="success";
		 
      }catch (MessagingException mex) {
		mex.printStackTrace();
	  }
	   return status;
   }
}