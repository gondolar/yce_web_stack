from flask import Flask, request, send_from_directory, redirect, Response
import os, json

app = Flask(__name__, static_folder="front")
STATIC_DIR = app.root_path + "/front"

def request_info(full_path="", body=""):
    result = {"method":request.method
        , "path":full_path
        , "remote_ip":request.remote_addr
        , "remote_port":int(request.environ.get("REMOTE_PORT"))
        , "local_ip":request.host.split(":")[0]
        , "local_port":int(request.environ.get("SERVER_PORT"))
        , "protocol":"https" if request.is_secure else "http"
        , "url":request.url
        , "cwd": os.getcwd()
        , "root_path": app.root_path
        , "instance_path": app.instance_path
        };
    query_string = request.query_string.decode("utf-8");
    filename = os.path.basename(full_path) if full_path else "";
    extension = os.path.splitext(filename)[1] if filename else "";
    path_levels = full_path.split("/");
    if(len(query_string )): result["query_string"]  = query_string;
    if(len(extension    )): result["extension"]     = extension;
    if(len(filename     )): result["filename"]      = filename;
    if(len(path_levels  )): result["path_levels"]   = path_levels;
    if(len(body         )): result["body"]          = body;
    return json.dumps(result);

def try_serve_static(full_path, add_slash_redirect=False):
    file_path = os.path.join(STATIC_DIR, full_path);
    if os.path.isfile(file_path):
        return send_from_directory(STATIC_DIR, full_path);

    if add_slash_redirect and os.path.isdir(file_path):    # Redirect to slash if it's a directory without slash
        return redirect(f"/{full_path}/", code=301);

    if os.path.isdir(file_path):    # Serve index.html in directory
        index_path = os.path.join(file_path, "index.html");
        if os.path.isfile(index_path):
            return send_from_directory(file_path, "index.html");

    if os.path.isfile(file_path):    # Serve file directly
        return send_from_directory(STATIC_DIR, full_path);

    return None;

@app.route("/", methods=["GET"])
@app.route("/index.html", methods=["GET"])
def home():
    return send_from_directory(STATIC_DIR, "index.html");

@app.route("/<path:full_path>", methods=["GET", "POST"])
def catch_all(full_path):
    path_levels = full_path.split('/');
    first_folder = path_levels[0];
    if 1 == len(first_folder):
        static_resp = try_serve_static(full_path);
        if static_resp:
            return static_resp;
        return Response(request_info(full_path), status=404, mimetype="application/json");
    elif first_folder == "api":
        if request.method == "GET":
            return Response(request_info(full_path), status=200, mimetype="application/json");
        elif request.method == "POST":
            return Response(request_info(full_path), status=200, mimetype="application/json");
    elif request.method == "GET":
        if not request.path.endswith("/"):
            redirect_resp = try_serve_static(full_path, add_slash_redirect=True);
            if redirect_resp:
                return redirect_resp;

        static_resp = try_serve_static(full_path);
        if static_resp:
            return static_resp;

        return Response(request_info(full_path), status=404, mimetype="application/json");

    elif request.method == "POST":
        static_resp = try_serve_static(full_path);
        if static_resp:
            return static_resp;
        body_data = request.get_data(as_text=True);
        return Response(request_info(full_path, body_data), status=404, mimetype="application/json");

#if __name__ == "__main__":
#    app.run(host="0.0.0.0", port=8000)
