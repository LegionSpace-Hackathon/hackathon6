package com.payegis.cloud.vigil.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.*;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpRequestRetryHandler;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.config.*;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContexts;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultConnectionKeepAliveStrategy;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.protocol.HttpContext;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLHandshakeException;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.ConnectException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.*;

/**
 * Created by liucheng on 2015/3/31.
 */
@Slf4j
public class HttpUtils {

    private static final Logger logger = LoggerFactory.getLogger(HttpUtils.class);

    public static final String USER_AGENT
            = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.151 Safari/535.19";

    public static final int TIMEOUT = 60000;

    private static PoolingHttpClientConnectionManager connManager = null;

    private static CloseableHttpClient httpClient = null;

    private static class SingleHolder {

        private static final HttpUtils INSTANCE = new HttpUtils();
    }
    //private static CloseableHttpClient httpclient = null;

    public static HttpUtils getInstance() {
        return SingleHolder.INSTANCE;
    }

    static {


        try {
            SSLContext sslContext = SSLContexts.custom().useTLS().build();
            sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() {
                    return null;
                }

                public void checkClientTrusted(X509Certificate[] certs, String authType) {
                }

                public void checkServerTrusted(X509Certificate[] certs, String authType) {
                }
            }}, null);

            Registry<ConnectionSocketFactory> socketFactoryRegistry = RegistryBuilder.<ConnectionSocketFactory>create()
                    .register("http", PlainConnectionSocketFactory.INSTANCE)
                    .register("https", new SSLConnectionSocketFactory(sslContext))
                    .build();

            connManager = new PoolingHttpClientConnectionManager(socketFactoryRegistry);

            // Create socket configuration
            SocketConfig socketConfig = SocketConfig.custom().setTcpNoDelay(true).build();
            connManager.setDefaultSocketConfig(socketConfig);
            // Create message constraints
            MessageConstraints messageConstraints = MessageConstraints.custom()
                    .setMaxHeaderCount(200)
                    .setMaxLineLength(2000)
                    .build();
            // Create connection configuration
            ConnectionConfig connectionConfig = ConnectionConfig.custom()
                    .setMalformedInputAction(CodingErrorAction.IGNORE)
                    .setUnmappableInputAction(CodingErrorAction.IGNORE)
                    .setMessageConstraints(messageConstraints)
                    .build();
            connManager.setDefaultConnectionConfig(connectionConfig);
            connManager.setMaxTotal(512);
            connManager.setDefaultMaxPerRoute(32);


            httpClient = HttpClients.custom().setUserAgent(USER_AGENT)
                    .setConnectionManager(connManager)
                    .setKeepAliveStrategy(new DefaultConnectionKeepAliveStrategy())
                    .setRetryHandler(new RetryHandler())
                    .build();
        } catch (KeyManagementException e) {
            logger.error("httpUtils exception:", e);
        } catch (NoSuchAlgorithmException e) {
            logger.error("httpUtils exception:", e);
        }


    }

    /**
     * 发送HttpPost请求，参数为json字符串 * * @param url * @param jsonStr * @return
     */
    public static String sendPost(String url, String jsonStr) {
        String result = null;
        // 字符串编码
        StringEntity entity = new StringEntity(jsonStr, Consts.UTF_8);
        // 设置content-type
        entity.setContentType("application/json");
        HttpPost httpPost = new HttpPost(url);
        // 防止被当成攻击添加的
        httpPost.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36");
        // 接收参数设置
        httpPost.setHeader("Accept", "application/json");
        httpPost.setEntity(entity);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpPost);
            HttpEntity httpEntity = response.getEntity();
            result = EntityUtils.toString(httpEntity);
        } catch (IOException e) {
            log.error(e.getMessage());
        } finally {
            // 关闭CloseableHttpResponse
            if (response != null) {
                try {
                    response.close();
                } catch (IOException e) {
                    log.error(e.getMessage());
                }
            }
        }
        return result;
    }
    public static String sendPostWithTimeout(String url, String jsonStr) {
        String result = null;
        // 字符串编码
        StringEntity entity = new StringEntity(jsonStr, Consts.UTF_8);
        // 设置content-type
        entity.setContentType("application/json");
        HttpPost httpPost = new HttpPost(url);
        // 接收参数设置
        httpPost.setHeader("Accept", "application/json");
        httpPost.setEntity(entity);
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(50000)
                .setSocketTimeout(50000)
                .setConnectTimeout(50000)
                .build();
        httpPost.setConfig(requestConfig);

        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpPost);
            HttpEntity httpEntity = response.getEntity();
            result = EntityUtils.toString(httpEntity);
        } catch (IOException e) {
            log.error(e.getMessage());
        } finally {
            // 关闭CloseableHttpResponse
            if (response != null) {
                try {
                    response.close();
                } catch (IOException e) {
                    log.error(e.getMessage());
                }
            }
        }
        return result;
    }

    public static String postObject(String json, String url) {
        String content = "";

        HttpPost httppost = new HttpPost(url);
        httppost.setHeader("Accept", "application/json");
        httppost.setHeader("User-agent","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36");
        httppost.setHeader("Content-type", "application/json; charset=utf-8");
        StringEntity stringEntity = new StringEntity(json,"utf-8");
        httppost.setEntity(stringEntity);
        CloseableHttpResponse response;

        try {
            response = httpClient.execute(httppost);
            HttpEntity httpentity = response.getEntity();
            if (httpentity != null) {
                content = EntityUtils.toString(httpentity, "UTF-8");
            }
        } catch (ClientProtocolException e) {
            log.info(e.toString());
        } catch (IOException e) {
            log.info(e.toString());
        }
        return content;
    }


    public static String get(String url, String encoding, int socketTimeout, int connectTimeout) {
        String result = null;

        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout)
                .setConnectionRequestTimeout(connectTimeout)
                .build();
        HttpGet httpGet = new HttpGet(url);
        httpGet.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpGet);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                try {
                    if (entity != null) {
                        result = EntityUtils.toString(entity, encoding);
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpGet.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return result;
    }


    public static String post(String url, Map<String, String> data, String encoding, int socketTimeout, int connectTimeout) {
        String result = null;

        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout)
                .setConnectionRequestTimeout(connectTimeout)
                .build();
        HttpPost httpPost = new HttpPost(url);
        httpPost.setConfig(requestConfig);
        CloseableHttpResponse response = null;

        List<NameValuePair> urlParameters = new ArrayList<NameValuePair>();
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                urlParameters.add(new BasicNameValuePair(entry.getKey(), entry.getValue()));
            }
        }
        try {
            httpPost.setEntity(new UrlEncodedFormEntity(urlParameters, encoding));
            response = httpClient.execute(httpPost);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                try {
                    if (entity != null) {
                        result = EntityUtils.toString(entity, encoding);
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpPost.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return result;
    }

    public static String post(String url, Map<String, String> data, Map<String, String> head,String encoding, int socketTimeout, int connectTimeout) {
        String result = null;

        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout)
                .setConnectionRequestTimeout(connectTimeout)
                .build();
        HttpPost httpPost = new HttpPost(url);
        httpPost.setConfig(requestConfig);
        if(head!=null&&!head.isEmpty()) {
            for (Map.Entry<String, String> entry : head.entrySet()) {
                httpPost.addHeader(entry.getKey(),entry.getValue());
            }
        }

        CloseableHttpResponse response = null;

        List<NameValuePair> urlParameters = new ArrayList<NameValuePair>();
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                urlParameters.add(new BasicNameValuePair(entry.getKey(), entry.getValue()));
            }
        }
        try {
            httpPost.setEntity(new UrlEncodedFormEntity(urlParameters, encoding));
            response = httpClient.execute(httpPost);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                try {
                    if (entity != null) {
                        result = EntityUtils.toString(entity, encoding);
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpPost.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return result;
    }


    public static String post(String url) {
        return post(url, null, "UTF-8", TIMEOUT, TIMEOUT);
    }

    public static String post(String url, Map<String, String> data) {
        return post(url, data, "UTF-8", TIMEOUT, TIMEOUT);
    }

    public static String post(String url, Map<String, String> data,Map<String, String> head) {
        return post(url, data, head,"UTF-8", TIMEOUT, TIMEOUT);
    }

    public static String getDefaultEncoding(String url) {
        String result = null;

        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(TIMEOUT)
                .setConnectTimeout(TIMEOUT)
                .setConnectionRequestTimeout(TIMEOUT)
                .build();
        HttpGet httpGet = new HttpGet(url);
        httpGet.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpGet);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                Charset charset = ContentType.getOrDefault(entity).getCharset();
                try {
                    if (entity != null) {
                        result = EntityUtils.toString(entity, charset);
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpGet.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return result;
    }

    public static long writeToFile(String url, File file, int socketTimeout, int connectTimeout) {

        long contentLength = -1l;
        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout)
                .setConnectionRequestTimeout(connectTimeout)
                .build();
        HttpGet httpGet = new HttpGet(url);
        httpGet.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpGet);
            Header[] headers = response.getHeaders("Content-Length");
            if (headers.length > 0) {
                contentLength = Long.parseLong(headers[0].getValue());
            }
            int status = response.getStatusLine().getStatusCode();

            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
//                response.
                if (entity != null) {
                    InputStream stream = entity.getContent();
                    FileUtils.copyInputStreamToFile(stream, file);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpGet.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return contentLength;
    }

    public static long writeToFileByProxyIp(String url, File file, String ip, int port, int socketTimeout, int connectTimeout) {

        long contentLength = -1l;
        RequestConfig requestConfig = null;
        if (ip != null) {
            HttpHost proxy = new HttpHost(ip, port);
            requestConfig = RequestConfig.custom()
                    .setSocketTimeout(TIMEOUT)
                    .setConnectTimeout(TIMEOUT)
                    .setConnectionRequestTimeout(TIMEOUT)
                    .setProxy(proxy)
                    .build();
        } else {
            requestConfig = RequestConfig.custom()
                    .setSocketTimeout(TIMEOUT)
                    .setConnectTimeout(TIMEOUT)
                    .setConnectionRequestTimeout(TIMEOUT)
                    .build();
        }
        HttpGet httpGet = new HttpGet(url);
        httpGet.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpGet);
            Header[] headers = response.getHeaders("Content-Length");
            if (headers.length > 0) {
                contentLength = Long.parseLong(headers[0].getValue());
            }
            int status = response.getStatusLine().getStatusCode();

            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
//                response.
                if (entity != null) {
                    InputStream stream = entity.getContent();
                    FileUtils.copyInputStreamToFile(stream, file);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpGet.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        if (contentLength != file.length()) return -1;
        return contentLength;
    }

    public static String get(String url, String encoding) {
        return get(url, encoding, TIMEOUT, TIMEOUT);
    }

    public static String get(String url) {
        return get(url, "UTF-8", TIMEOUT, TIMEOUT);
    }
    
    //proxy ip
    public static String get(String url, String encoding, String ip, int port, int socketTimeout, int connectTimeout) throws ClientProtocolException, IOException {
        String result = null;

        HttpHost proxy = new HttpHost(ip, port);

        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout)
                .setConnectionRequestTimeout(connectTimeout)
                .setProxy(proxy)
                .build();
        HttpGet httpGet = new HttpGet(url);
        httpGet.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpGet);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                try {
                    if (entity != null) {
                        result = EntityUtils.toString(entity, encoding);
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpGet.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return result;
    }

    public static String get(String url, String ip, int port) throws ClientProtocolException, IOException {
        return get(url, "UTF-8", ip, port, TIMEOUT, TIMEOUT);
    }

    public static int randInt(int min, int max) {

        // NOTE: Usually this should be a field rather than a method
        // variable so that it is not re-seeded every call.
        Random rand = new Random();

        // nextInt is normally exclusive of the top value,
        // so add 1 to make it inclusive
        return rand.nextInt((max - min) + 1) + min;
    }
    
    public static String postByStr(String url, String data, String contentType) {
        return postByType(url, data, null, contentType, "UTF-8", TIMEOUT, TIMEOUT);
    }

    public static String postFormData(String url,Map<String,Object> params) {
        String result = null;
        RequestConfig requestConfig = RequestConfig.custom().setSocketTimeout(TIMEOUT)
                .setConnectTimeout(TIMEOUT).setConnectionRequestTimeout(TIMEOUT).build();
        HttpPost httpPost = new HttpPost(url);

        httpPost.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            List<NameValuePair> form = new ArrayList<>();
            for(Map.Entry<String,Object> _entry : params.entrySet()) {
                form.add(new BasicNameValuePair(_entry.getKey(), _entry.getValue().toString()));
            }

            UrlEncodedFormEntity urlEncodedFormEntity = new UrlEncodedFormEntity(form, Consts.UTF_8);
            httpPost.setEntity(urlEncodedFormEntity);
            response = httpClient.execute(httpPost);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                try {
                    if (entity != null) {
                        result = IOUtils.toString(entity.getContent(),"UTF-8");
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpPost.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }

        return result;
    }

    public static String postByType(String url, String data, String referer, String contentType, String encoding,
            int socketTimeout, int connectTimeout) {
        String result = null;

        RequestConfig requestConfig = RequestConfig.custom().setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout).setConnectionRequestTimeout(connectTimeout).build();
        HttpPost httpPost = new HttpPost(url);
        if (!StringUtils.isBlank(referer))
            httpPost.setHeader("referer", referer);
        httpPost.setHeader("Content-Type", contentType);
        httpPost.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            StringEntity params = new StringEntity(data, Charset.forName(encoding));
            httpPost.setEntity(params);
            response = httpClient.execute(httpPost);
            int status = response.getStatusLine().getStatusCode();
            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                try {
                    if (entity != null) {
                        result = EntityUtils.toString(entity, encoding);
                    }
                } finally {
                    EntityUtils.consumeQuietly(entity);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpPost.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        return result;
    }


    public static Map writeToFileGetName(String url, File file, int socketTimeout, int connectTimeout) {
        Map map = new HashMap();
        long contentLength = -1l;
        String fileName = "";
        RequestConfig requestConfig = RequestConfig.custom().setSocketTimeout(socketTimeout)
                .setConnectTimeout(connectTimeout).setConnectionRequestTimeout(connectTimeout).build();
        HttpGet httpGet = new HttpGet(url);
        httpGet.setConfig(requestConfig);
        CloseableHttpResponse response = null;
        try {
            response = httpClient.execute(httpGet);
            Header[] headers = response.getHeaders("Content-Length");
            if (headers.length > 0) {
                contentLength = Long.parseLong(headers[0].getValue());
            }

            Header[] filenameHeaders = response.getHeaders("Content-Disposition");
            if (filenameHeaders.length > 0) {
                fileName = filenameHeaders[0].getValue().split("filename=").length == 1 ? "" : filenameHeaders[0]
                        .getValue().split("filename=")[1].replace("\"", "");
            }

            int status = response.getStatusLine().getStatusCode();

            if (status >= 200 && status < 300) {
                HttpEntity entity = response.getEntity();
                // response.
                if (entity != null) {
                    InputStream stream = entity.getContent();
                    FileUtils.copyInputStreamToFile(stream, file);
                }
            }

        } catch (ClientProtocolException e) {
            logger.error(String.format("exception for url %s", url), e);
        } catch (IOException e) {
            logger.error(String.format("exception for url %s", url), e);
        } finally {
            httpGet.releaseConnection();
            try {
                if (response != null) {
                    response.close();
                }
            } catch (IOException e) {
                ;
            }
        }
        map.put("contentLength", contentLength);
        map.put("fileName", fileName);
        return map;
    }
}

class RetryHandler implements HttpRequestRetryHandler {

    public static final Logger logger = LoggerFactory.getLogger(RetryHandler.class);

    public static final int RETRY_TIME_OUT = 3000;
    public static final int MAX_RETRY_TIME = 5;

    @Override
    public boolean retryRequest(IOException e, int executionCount, HttpContext httpContext) {
        String url = null;
        try {
            logger.warn("连接超时，重试等待中，url=" + url);
            Thread.sleep(RETRY_TIME_OUT);
        } catch (InterruptedException ex) {
            logger.error("连接超时等待中出错", ex);
        }
        logger.warn("重试次数=" + executionCount + "，url=" + url);
        if (executionCount >= MAX_RETRY_TIME) {
            // Do not retry if over max retry count
            return false;
        }
        if (e instanceof NoHttpResponseException || e instanceof ConnectException) {
            // Retry if the server dropped connection on us
            try {
                Thread.sleep(randInt(2000, 5000));
            } catch (InterruptedException e1) {
                logger.error("连接超时等待中出错", e1);
            }
            return true;
        }
        if (e instanceof SSLHandshakeException) {
            // Do not retry on SSL handshake exception
            return false;
        }
        final HttpClientContext clientContext = HttpClientContext.adapt(httpContext);
        final HttpRequest request = clientContext.getRequest();

        boolean idempotent = !(request instanceof HttpEntityEnclosingRequest);
        if (idempotent) {
            // Retry if the request is considered idempotent
            return true;
        }
        return false;
    }

    public static int randInt(int min, int max) {

        // NOTE: Usually this should be a field rather than a method
        // variable so that it is not re-seeded every call.
        Random rand = new Random();

        // nextInt is normally exclusive of the top value,
        // so add 1 to make it inclusive
        return rand.nextInt((max - min) + 1) + min;
    }


}
