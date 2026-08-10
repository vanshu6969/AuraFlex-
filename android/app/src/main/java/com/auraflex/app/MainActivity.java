package com.auraflex.app;

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
import android.webkit.WebResourceResponse;
import android.os.Message;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayInputStream;

public class MainActivity extends BridgeActivity {

    // Common ad and popunder network domains to block
    private static final String[] AD_HOSTS = {
        "doubleclick.net", "adservice.google.com", "popads.net", "popcash.net",
        "adsterra.com", "exoclick.com", "juicyads.com", "propellerads.com",
        "monetag.com", "onclickads.net", "alwingulla.com", "vignette.wikia.nocookie.net"
    };

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private ViewGroup fullscreenContainer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            android.view.Window window = getWindow();
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(android.graphics.Color.parseColor("#0f0f12"));
            window.setNavigationBarColor(android.graphics.Color.parseColor("#0f0f12"));

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                window.setNavigationBarContrastEnforced(false);
            }

            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                webView.setBackgroundColor(android.graphics.Color.parseColor("#0f0f12"));
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

                // Store reference to Capacitor's BridgeWebViewClient so local bundled assets (https://localhost) are served cleanly
                final WebViewClient defaultClient = webView.getWebViewClient();

                // WebViewClient with Ad-blocking delegating to Capacitor's BridgeWebViewClient
                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            String url = request.getUrl().toString().toLowerCase();

                            // Check if request matches an ad host domain
                            for (String adHost : AD_HOSTS) {
                                if (url.contains(adHost)) {
                                    // Return empty 200 response to neutralize the ad silently
                                    return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream("".getBytes()));
                                }
                            }
                        }

                        if (defaultClient != null) {
                            return defaultClient.shouldInterceptRequest(view, request);
                        }

                        return super.shouldInterceptRequest(view, request);
                    }
                });

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
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
