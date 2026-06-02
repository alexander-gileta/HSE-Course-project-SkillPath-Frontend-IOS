import SwiftUI
import WebKit
import UIKit

struct WebView: UIViewRepresentable {
    private let startURL = URL(string: "skillpass://app/")!

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.setURLSchemeHandler(context.coordinator.schemeHandler, forURLScheme: "skillpass")
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: startURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) { }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let schemeHandler = LocalWebSchemeHandler()

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if url.scheme?.lowercased() == "skillpass" {
                decisionHandler(.allow)
                return
            }

            let scheme = url.scheme?.lowercased()
            let isMainFrameNavigation = navigationAction.targetFrame?.isMainFrame ?? false
            let shouldOpenExternally = isMainFrameNavigation && ["http", "https", "mailto", "tel"].contains(scheme ?? "")

            if shouldOpenExternally {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard navigationAction.targetFrame == nil,
                  let url = navigationAction.request.url else {
                return nil
            }

            if url.scheme?.lowercased() == "skillpass" {
                webView.load(URLRequest(url: url))
            } else {
                UIApplication.shared.open(url)
            }

            return nil
        }
    }
}
