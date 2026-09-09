package com.neilmoonvale.carenotes;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONObject;

/** Bundled UI only. Remote pages never share the native bridge. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final int OPEN_FILE = 1, SAVE_FILE = 2;
    private WebView web;
    private volatile boolean trusted;
    private ValueCallback<Uri[]> chooser;
    private byte[] pendingFile;
    private final Map<String,HttpsURLConnection> connections = new ConcurrentHashMap<>();
    private final Map<String,Boolean> cancelled = new ConcurrentHashMap<>();
    private final ThreadPoolExecutor requests = new ThreadPoolExecutor(2,2,0L,TimeUnit.SECONDS,new ArrayBlockingQueue<>(2));

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout frame = new FrameLayout(this);
        boolean dark=(getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK)==android.content.res.Configuration.UI_MODE_NIGHT_YES;
        int background=dark?Color.rgb(14,23,40):Color.rgb(245,247,252);
        frame.setBackgroundColor(background);
        getWindow().setStatusBarColor(background);
        getWindow().setNavigationBarColor(background);
        getWindow().getDecorView().setSystemUiVisibility(dark?0:android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        frame.addView(web,new FrameLayout.LayoutParams(-1,-1));
        setContentView(frame);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            frame.setOnApplyWindowInsetsListener((view,insets) -> {
                android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.ime());
                view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Only URIs chosen through the system picker.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true); // HTTPS model calls use the narrow native method below.
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        web.addJavascriptInterface(new DeviceBridge(),"CareNotesNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request) {
                return asset(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
                Uri uri=request.getUrl();
                if (isLocal(uri)) return false;
                if (request.isForMainFrame() && "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch (RuntimeException ignored) { }
                }
                return true;
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon) {
                trusted=isLocal(Uri.parse(url));
                if (!trusted) { view.stopLoading(); view.removeJavascriptInterface("CareNotesNative"); }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result) {
                if (!trusted) { result.cancel(); return true; }
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton(android.R.string.ok,(d,w)->result.confirm())
                    .setNegativeButton(android.R.string.cancel,(d,w)->result.cancel())
                    .setOnCancelListener(d->result.cancel()).show();
                return true;
            }
            @Override public boolean onJsBeforeUnload(WebView view,String url,String message,JsResult result) {
                return onJsConfirm(view,url,message,result);
            }
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params) {
                if (!trusted) return false;
                if (chooser!=null) chooser.onReceiveValue(null);
                chooser=callback;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                try { startActivityForResult(intent,OPEN_FILE); }
                catch (RuntimeException error) { chooser.onReceiveValue(null); chooser=null; }
                return true;
            }
        });
        web.loadUrl(START);
    }

    private boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost()) && uri.getUserInfo()==null && (uri.getPort()==-1 || uri.getPort()==443);
    }
    private WebResourceResponse asset(Uri uri) {
        String name=uri.getPath();
        if (!isLocal(uri) || name==null || !name.matches("/[A-Za-z0-9_.-]+")) return denied();
        String mime=name.endsWith(".html")?"text/html":name.endsWith(".js")?"text/javascript":name.endsWith(".css")?"text/css":name.endsWith(".svg")?"image/svg+xml":"application/json";
        try {
            InputStream input=getAssets().open(name.substring(1));
            Map<String,String> headers=new HashMap<>();
            headers.put("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
            headers.put("X-Content-Type-Options","nosniff");
            headers.put("Cache-Control","no-store");
            return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,input);
        } catch (Exception error) { return denied(); }
    }
    private WebResourceResponse denied() {
        return new WebResourceResponse("text/plain","UTF-8",404,"Not found",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    }
    private void reply(String id,JSONObject data) {
        runOnUiThread(()->{if (trusted && web!=null) web.evaluateJavascript("window.__careNotesReply("+JSONObject.quote(id)+","+data.toString()+")",null);});
    }
    private void fail(String id,String code) {
        try { reply(id,new JSONObject().put("error",code)); } catch (Exception ignored) { }
    }
    private String label(String zh,String en) { return Locale.getDefault().getLanguage().equals("zh")?zh:en; }

    final class DeviceBridge {
        @JavascriptInterface public void request(String id,String address,String authorization,String body) {
            if (!trusted || id==null || !id.matches("[a-f0-9-]{36}") || body==null || body.length()>128000 || authorization==null || !authorization.matches("Bearer [\\x21-\\x7e]{8,512}")) { fail(id==null?"":id,"invalid_connection"); return; }
            try { requests.execute(()->perform(id,address,authorization,body)); }
            catch (RuntimeException error) { fail(id,"rate_limited"); }
        }
        @JavascriptInterface public void cancel(String id) {
            if (id==null || !id.matches("[a-f0-9-]{36}")) return;
            cancelled.put(id,true);
            HttpsURLConnection connection=connections.get(id);
            if (connection!=null) connection.disconnect();
        }
        @JavascriptInterface public void saveFile(String text,String name,String mime) {
            if (!trusted || text==null || text.length()>4000000 || name==null || !name.matches("[A-Za-z0-9._-]{1,100}") || !("application/json".equals(mime)||"text/plain".equals(mime))) return;
            runOnUiThread(()->{
                if (pendingFile!=null) return;
                pendingFile=text.getBytes(StandardCharsets.UTF_8);
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE,name);
                try { startActivityForResult(intent,SAVE_FILE); } catch (RuntimeException error) { pendingFile=null; }
            });
        }
        @JavascriptInterface public void copyText(String text) {
            if (!trusted || text==null || text.length()>4000000) return;
            runOnUiThread(()->((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("Care Notes",text)));
        }
        @JavascriptInterface public void printPage() {
            if (!trusted) return;
            runOnUiThread(()->{
                PrintManager manager=(PrintManager)getSystemService(PRINT_SERVICE);
                if (manager!=null && web!=null) manager.print("Care Notes",web.createPrintDocumentAdapter("Care Notes"),new PrintAttributes.Builder().build());
            });
        }
        @JavascriptInterface public void closeApp() { if(trusted)runOnUiThread(()->finish()); }
    }

    private void perform(String id,String address,String authorization,String body) {
        HttpsURLConnection connection=null;
        try {
            URL url=new URL(address);
            String host=url.getHost().toLowerCase(Locale.ROOT),path=url.getPath();
            if (!"https".equals(url.getProtocol()) || url.getUserInfo()!=null || url.getQuery()!=null || url.getRef()!=null || url.getPort()!=-1 && url.getPort()!=443 || !host.matches("[a-z0-9.-]+") || !host.contains(".") || host.matches("[0-9.]+") || host.endsWith(".") || host.matches(".*\\.(local|internal|localhost|test|invalid)$") || !(path.endsWith("/chat/completions")||path.endsWith("/responses"))) throw new IllegalArgumentException();
            // An additional device-side check. This is not a public proxy service.
            for (InetAddress ip:InetAddress.getAllByName(host)) {
                byte[] bytes=ip.getAddress();
                if (ip.isAnyLocalAddress()||ip.isLoopbackAddress()||ip.isLinkLocalAddress()||ip.isSiteLocalAddress()||ip.isMulticastAddress()||bytes.length==16 && (bytes[0]&254)==252||bytes.length==4 && (bytes[0]&255)==100 && (bytes[1]&255)>=64 && (bytes[1]&255)<=127) throw new IllegalArgumentException();
            }
            if (cancelled.containsKey(id)) return;
            connection=(HttpsURLConnection)url.openConnection();
            connections.put(id,connection);
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(20000);connection.setReadTimeout(120000);
            connection.setRequestMethod("POST");connection.setDoOutput(true);
            connection.setRequestProperty("Authorization",authorization);
            connection.setRequestProperty("Content-Type","application/json");
            byte[] data=body.getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(data.length);
            try(OutputStream out=connection.getOutputStream()){out.write(data);}
            int code=connection.getResponseCode();
            if(code<200||code>=300){reply(id,new JSONObject().put("status",code).put("body","{}"));return;}
            ByteArrayOutputStream buffer=new ByteArrayOutputStream();
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(120);
            try(InputStream input=connection.getInputStream()){
                byte[] block=new byte[8192];int size;
                while((size=input.read(block))!=-1){
                    if(cancelled.containsKey(id))return;
                    if(System.nanoTime()>deadline)throw new java.net.SocketTimeoutException();
                    if(buffer.size()+size>500000){fail(id,"too_large");return;}
                    buffer.write(block,0,size);
                }
            }
            reply(id,new JSONObject().put("status",code).put("body",buffer.toString(StandardCharsets.UTF_8.name())));
        } catch(IllegalArgumentException error){fail(id,"invalid_connection");}
        catch(java.net.SocketTimeoutException error){fail(id,"provider_timeout");}
        catch(Exception error){if(!cancelled.containsKey(id))fail(id,"provider_network");}
        finally {if(connection!=null)connection.disconnect();connections.remove(id);cancelled.remove(id);}
    }

    @Override protected void onActivityResult(int code,int result,Intent data) {
        super.onActivityResult(code,result,data);
        Uri uri=result==RESULT_OK && data!=null?data.getData():null;
        if(uri!=null && !"content".equals(uri.getScheme()))uri=null;
        if(code==OPEN_FILE && chooser!=null){chooser.onReceiveValue(uri==null?null:new Uri[]{uri});chooser=null;}
        if(code==SAVE_FILE){
            byte[] bytes=pendingFile;pendingFile=null;
            if(uri!=null && bytes!=null){
                try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){
                    if(out==null)throw new IllegalStateException();out.write(bytes);
                    Toast.makeText(this,label("已保存","Saved"),Toast.LENGTH_SHORT).show();
                }catch(Exception error){Toast.makeText(this,label("保存失败，请重新导出","Could not save. Export again."),Toast.LENGTH_LONG).show();}
            }
        }
    }
    @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else web.evaluateJavascript("window.dispatchEvent(new Event('care-notes-back'))",null);}
    @Override protected void onDestroy(){
        trusted=false;for(HttpsURLConnection c:connections.values())c.disconnect();requests.shutdownNow();
        if(chooser!=null)chooser.onReceiveValue(null);pendingFile=null;
        if(web!=null){web.removeJavascriptInterface("CareNotesNative");web.destroy();web=null;}
        super.onDestroy();
    }
}
