
package utils;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.DatabaseMetaData;

import java.util.logging.Level;
import java.util.logging.Logger;

public class Database
{
	private static Connection connection;
	private static Logger logg = Logger.getLogger("DBLogger");
    
    private Database() {
    }
    
    public static Connection getConnection() 
	{
        if (connection == null) 
		{
            synchronized (Database.class) 
			{
                if (connection == null) 
				{
                    try {
                        connection = DriverManager.getConnection("jdbc:postgresql://localhost:5432/constructions","postgres","12345");
						logg.log(Level.INFO,"Connection Created successfully");
                    } catch (SQLException e) {
                        logg.log(Level.INFO,"Error occurred while create a  NEW Connection Object: ",e);
                    }
                }
            }
        }
        return connection;
    }
	
	public static Connection getNewConnection()
	{
		Connection con = null;
		try
		{
			con = DriverManager.getConnection("jdbc:postgresql://localhost:5432/constructions","postgres","12345");	
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while create a NEW Connection Object: ",e);
		}
		return con;
	}
	
	public static boolean checkTable(String tableName)
	{
		boolean isTableExists=false;
		try {
			Connection connection =getConnection();
            DatabaseMetaData metaData = connection.getMetaData();
            ResultSet resultSet = metaData.getTables(null, null, tableName, new String[] { "TABLE" });

            if (resultSet.next()) {
				isTableExists = true;
			}
        } catch (SQLException e) {
           logg.log(Level.INFO,"Error occurred while Check the table existence : ",e);
        }
		return isTableExists;
	}
	
	public static boolean isReferencedbyOthers(String tableName,String columnName,int columnValue) 
	{
		String fetchTablesQuery = "SELECT kcu.table_name as referencing_table, kcu.column_name as referencing_column FROM information_schema.key_column_usage kcu JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = ? AND ccu.column_name = ?; ";

		StringBuilder dynamicQuery = new StringBuilder();
		try
		{
			Connection connection = getConnection();
			PreparedStatement fetchTablesStmt = connection.prepareStatement(fetchTablesQuery);
			fetchTablesStmt.setString(1,tableName);
			fetchTablesStmt.setString(2,columnName);
			ResultSet rs = fetchTablesStmt.executeQuery();

			while (rs.next()) {
				String referenceTable = rs.getString("referencing_table"),
				       referenceColumn = rs.getString("referencing_column");
				dynamicQuery.append("EXISTS (SELECT 1 FROM ")
							.append(referenceTable)
							.append(" WHERE ")
							.append(referenceColumn)
							.append(" = ")
							.append(columnValue)
							.append(" ) OR ");
			}

			String finalQuery = dynamicQuery.substring(0, dynamicQuery.length() - 4);

			try (PreparedStatement checkStmt = connection.prepareStatement("SELECT " + finalQuery + " AS is_referenced")) {
				ResultSet resultSet = checkStmt.executeQuery();
				if (resultSet.next()) {
					return resultSet.getBoolean("is_referenced");
				}
			}
		} catch (SQLException e) {
			logg.log(Level.INFO,"Error occurred while Checking the Table values is referenced by others: ",e);
		}
		return false;
	}

	
	public static String getRecord(String query)
	{
		String record=null;
		try{
			Connection con=getConnection();
			PreparedStatement st=con.prepareStatement(query);
			ResultSet rs=st.executeQuery();
			if(rs.next())
			{
				record=rs.getString(1);
			}
			rs.close();
			st.close();
		}
		catch(Exception e)
		{
			logg.log(Level.INFO,"Error occurred while retrieve the record: ",e);
		}
		return record;
	}
}