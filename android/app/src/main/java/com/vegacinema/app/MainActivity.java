package com.vegacinema.app;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.content.pm.ActivityInfo;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.os.Message;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private ViewGroup fullscreenContainer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();

            // Storage & Cookie permissions
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            // User Agent adjustment
            String defaultUserAgent = settings.getUserAgentString();
            if (defaultUserAgent != null) {
                settings.setUserAgentString(defaultUserAgent.replace("; wv", ""));
            }

            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setSupportMultipleWindows(true);

            // WebChromeClient with FULLSCREEN SUPPORT
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onShowCustomView(View view, CustomViewCallback callback) {
                    if (customView != null) {
                        onHideCustomView();
                        return;
                    }

                    customView = view;
                    customViewCallback = callback;

                    fullscreenContainer = (ViewGroup) getWindow().getDecorView();
                    fullscreenContainer.addView(customView, new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT));

                    // Force landscape orientation on fullscreen
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                    
                    // Hide system UI status & nav bars
                    getWindow().getDecorView().setSystemUiVisibility(
                            View.SYSTEM_UI_FLAG_FULLSCREEN |
                            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
                }

                @Override
                public void onHideCustomView() {
                    if (customView == null) return;

                    if (fullscreenContainer != null) {
                        fullscreenContainer.removeView(customView);
                    }
                    customView = null;

                    if (customViewCallback != null) {
                        customViewCallback.onCustomViewHidden();
                        customViewCallback = null;
                    }

                    // Reset to portrait and restore system UI
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                }

                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    WebView targetWebView = new WebView(view.getContext());
                    targetWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                            return true;
                        }
                    });

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    if (transport != null) {
                        transport.setWebView(targetWebView);
                        resultMsg.sendToTarget();
                    }
                    return true;
                }
            });
        }
    }
}
