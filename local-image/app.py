from flask import Flask
import os
import socket

app = Flask(__name__)

# Health check endpoint for ECS
@app.route("/health")
def health_check():
    return 'OK', 200

# Main route
@app.route("/")
def hello():
    favorite_dessert = os.getenv("FAVORITE_DESSERT", "CHEESECAKE")
    
    html = "<h3>Hello {name}!</h3>" \
           "<b>Hostname:</b> {hostname}<br/>" \
           "<b>Favorite dessert:</b> {favorite_dessert}<br/>"
    return html.format(name=os.getenv("NAME", "world"), hostname=socket.gethostname(), favorite_dessert=favorite_dessert)

# Ensure Flask runs on port 8080 as required by ECS
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True)
