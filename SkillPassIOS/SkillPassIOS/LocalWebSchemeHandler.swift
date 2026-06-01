import Foundation
import WebKit

final class LocalWebSchemeHandler: NSObject, WKURLSchemeHandler {
    private let queue = DispatchQueue(label: "skillpass.local-web-scheme-handler")

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        queue.async { [weak self] in
            guard let self = self, let requestURL = urlSchemeTask.request.url else {
                urlSchemeTask.didFailWithError(URLError(.badURL))
                return
            }

            guard let fileURL = self.localFileURL(for: requestURL) else {
                urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
                return
            }

            do {
                let data = try Data(contentsOf: fileURL)
                let response = URLResponse(
                    url: requestURL,
                    mimeType: self.mimeType(for: fileURL),
                    expectedContentLength: data.count,
                    textEncodingName: self.textEncodingName(for: fileURL)
                )
                urlSchemeTask.didReceive(response)
                urlSchemeTask.didReceive(data)
                urlSchemeTask.didFinish()
            } catch {
                urlSchemeTask.didFailWithError(error)
            }
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // WKWebView calls this when a request is cancelled. The content is local and tiny,
        // so no explicit cancellation state is needed here.
    }

    private func localFileURL(for requestURL: URL) -> URL? {
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("WebContent", isDirectory: true) else {
            return nil
        }

        let normalizedRoot = webRoot.standardizedFileURL
        var relativePath = requestURL.path

        if relativePath.isEmpty || relativePath == "/" {
            relativePath = "index.html"
        } else {
            relativePath.removeFirst()
            if relativePath.hasSuffix("/") {
                relativePath += "index.html"
            }
        }

        let candidate = normalizedRoot.appendingPathComponent(relativePath).standardizedFileURL
        let candidatePath = candidate.path
        let rootPath = normalizedRoot.path.hasSuffix("/") ? normalizedRoot.path : normalizedRoot.path + "/"

        guard candidatePath.hasPrefix(rootPath) else {
            return nil
        }

        if FileManager.default.fileExists(atPath: candidatePath) {
            return candidate
        }

        // SPA fallback: /module/1/topic/2 should still load index.html,
        // letting React Router render the route on the client side.
        if (relativePath as NSString).pathExtension.isEmpty {
            return normalizedRoot.appendingPathComponent("index.html")
        }

        return nil
    }

    private func mimeType(for fileURL: URL) -> String {
        switch fileURL.pathExtension.lowercased() {
        case "html": return "text/html"
        case "js", "mjs": return "application/javascript"
        case "css": return "text/css"
        case "json", "map": return "application/json"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "gif": return "image/gif"
        case "webp": return "image/webp"
        case "ico": return "image/x-icon"
        case "pdf": return "application/pdf"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "ttf": return "font/ttf"
        case "otf": return "font/otf"
        default: return "application/octet-stream"
        }
    }

    private func textEncodingName(for fileURL: URL) -> String? {
        switch fileURL.pathExtension.lowercased() {
        case "html", "js", "mjs", "css", "json", "map", "svg": return "utf-8"
        default: return nil
        }
    }
}
