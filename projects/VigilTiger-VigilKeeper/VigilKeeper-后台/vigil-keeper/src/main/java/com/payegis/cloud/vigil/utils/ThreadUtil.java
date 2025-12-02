package com.payegis.cloud.vigil.utils;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;


/*
 * MAY COST
 * */
public class ThreadUtil {
	
	private static ExecutorService pool = Executors.newCachedThreadPool();
	
	public static void start(Runnable runnable){
		pool.execute(runnable);
	}
	
	public static void stop(){
		pool.shutdown();
	}
	

}
