from flask import Flask, request, send_from_directory, redirect, Response
import os

app = Flask(__name__, static_folder="front")
STATIC_DIR = "front"

def request_info(full_path="", body=""):
    query_string = request.query_string.decode("utf-8")
    remote_ip = request.remote_addr
    remote_port = request.environ.get("REMOTE_PORT")
    local_ip = request.host.split(":")[0]
    local_port = request.environ.get("SERVER_PORT")
    protocol = "https" if request.is_secure else "http"
    full_url = request.url
    filename = os.path.basename(full_path) if full_path else ""
    extension = os.path.splitext(filename)[1] if filename else ""
    path_levels = full_path.split("/")

    return f"""
<table><tr><td>Method:</td><td>{request.method}</td></tr>
<h1>Request Info</h1>
<p>Requested path: {full_path}</p>
<p>Query string: {query_string}</p>
<p>Remote IP: {remote_ip}</p>
<p>Remote port: {remote_port}</p>
<p>Local IP: {local_ip}</p>
<p>Local port: {local_port}</p>
<p>Protocol: {protocol}</p>
<p>Full request URL: {full_url}</p>
<p>Full filename: {filename}</p>
<p>File extension: {extension}</p>
<p>Split path: {path_levels}</p>
<p>POST body: {body}</p>
    """

def try_serve_static(full_path, add_slash_redirect=False):
    file_path = os.path.join(STATIC_DIR, full_path)

    # Redirect to slash if it's a directory without slash
    if add_slash_redirect and os.path.isdir(file_path):
        return redirect(f"/{full_path}/", code=301)

    # Serve index.html in directory
    if os.path.isdir(file_path):
        index_path = os.path.join(file_path, "index.html")
        if os.path.isfile(index_path):
            return send_from_directory(file_path, "index.html")

    # Serve file directly
    if os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, full_path)

    return None

@app.route("/", methods=["GET"])
@app.route("/index.html", methods=["GET"])
def home():
    return send_from_directory(STATIC_DIR, "index.html")

@app.route("/<path:full_path>", methods=["GET", "POST"])
def catch_all(full_path):
    first_folder = full_path.split("/")[0]
    if first_folder == "api":
        if request.method == "GET":
            return Response( '{ "message": "GET" }', status=200, mimetype="application/json");
        elif request.method == "POST":
            return Response( '{ "message": "POST" }', status=200, mimetype="application/json");
    elif request.method == "GET":
        if not request.path.endswith("/"):
            redirect_resp = try_serve_static(full_path, add_slash_redirect=True)
            if redirect_resp:
                return redirect_resp

        static_resp = try_serve_static(full_path)
        if static_resp:
            return static_resp

        return Response(request_info(full_path), status=404, mimetype="text/html")

    elif request.method == "POST":
        static_resp = try_serve_static(full_path)
        if static_resp:
            return static_resp
        body_data = request.get_data(as_text=True)
        return Response(request_info(full_path, body_data), status=404, mimetype="text/html")

#if __name__ == "__main__":
#    app.run(host="0.0.0.0", port=8000)
