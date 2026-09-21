import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.*;
import java.util.HashMap;
import java.util.Map;

public class ServeWebApp {

    private static final Map<String, String> MIME_MAP = new HashMap<>();

    static {
        MIME_MAP.put(".html", "text/html; charset=UTF-8");
        MIME_MAP.put(".css", "text/css; charset=UTF-8");
        MIME_MAP.put(".js", "application/javascript; charset=UTF-8");
        MIME_MAP.put(".json", "application/json; charset=UTF-8");
        MIME_MAP.put(".png", "image/png");
        MIME_MAP.put(".jpg", "image/jpeg");
        MIME_MAP.put(".svg", "image/svg+xml");
        MIME_MAP.put(".mp4", "video/mp4");
        MIME_MAP.put(".mp3", "audio/mpeg");
    }

    public static void main(String[] args) throws Exception {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        File rootDir = new File("c:/Users/Design IT/Downloads/1ai/webapp").getCanonicalFile();

        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            File requestedFile = new File(rootDir, path.substring(1)).getCanonicalFile();

            // Security check: ensure path is within rootDir
            if (!requestedFile.getPath().startsWith(rootDir.getPath()) || !requestedFile.exists() || requestedFile.isDirectory()) {
                byte[] notFound = "404 Not Found".getBytes();
                exchange.sendResponseHeaders(404, notFound.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound);
                }
                return;
            }

            String ext = "";
            int dot = requestedFile.getName().lastIndexOf('.');
            if (dot >= 0) {
                ext = requestedFile.getName().substring(dot).toLowerCase();
            }
            String mime = MIME_MAP.getOrDefault(ext, "application/octet-stream");

            byte[] content = Files.readAllBytes(requestedFile.toPath());
            exchange.getResponseHeaders().set("Content-Type", mime);
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Cache-Control", "no-cache");
            exchange.sendResponseHeaders(200, content.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(content);
            }
        });

        server.setExecutor(null);
        server.start();
        System.out.println("HTTP Server running at http://localhost:" + port);
        System.out.println("On iPhone (Wi-Fi), open: http://192.168.100.8:" + port);
    }
}
