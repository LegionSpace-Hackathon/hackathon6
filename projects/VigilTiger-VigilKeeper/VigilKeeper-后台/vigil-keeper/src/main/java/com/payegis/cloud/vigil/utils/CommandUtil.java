package com.payegis.cloud.vigil.utils;

import com.github.pagehelper.util.StringUtil;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;


@Slf4j
public class CommandUtil {
	

	public static List<String> execForOutput(String command){
		String[] commands = { "/bin/sh", "-c", command};
		List<String> result = new ArrayList<String>();
		BufferedReader reader = null;
		try{
			Process poc = Runtime.getRuntime().exec(commands);
//			Process poc = Runtime.getRuntime().exec(command);
		
			reader = new BufferedReader(new InputStreamReader(poc.getInputStream()));
			String line;
			while ((line = reader.readLine()) != null) {
				log.info(">>>>: " +line);
				if(StringUtil.isNotEmpty(line)){
					result.add(line);
				}
			}
			
			poc.waitFor();
			
		}catch(Exception e){
			log.error(">>>> execute command error : " + e.getMessage() , e);
		}finally{
			if(reader!=null){
				try {
					reader.close();
				} catch (IOException e) {
					log.error(">>>> close io error : " + e.getMessage() , e);
				}
			}
		}
		
		return result;
	}


	public static List<String> execJar(String command){
		log.info("execJar>>>> command: " +command);
		List<String> result = new ArrayList<>();
		BufferedReader reader = null;
		try{
			Process poc = Runtime.getRuntime().exec(command);

			reader = new BufferedReader(new InputStreamReader(poc.getInputStream()));
			String line;
			while ((line = reader.readLine()) != null) {
				if(StringUtil.isNotEmpty(line) && !line.contains("WARNING: META-INF")){
					log.info("execJar>>>> line: " +line);
					result.add(line);
				}
			}

			reader = new BufferedReader(new InputStreamReader(poc.getErrorStream()));
			while ((line = reader.readLine()) != null) {
				log.info("execJar errorStream>>>> line: " +line);
				if(StringUtil.isNotEmpty(line)){
					result.add(line);
				}
			}

			poc.waitFor();
		}catch(Exception e){
			log.error("execJar>>>> error" , e);
		}finally{
			if(reader!=null){
				try {
					reader.close();
				} catch (IOException e) {
				}
			}
		}

		return result;
	}

}
