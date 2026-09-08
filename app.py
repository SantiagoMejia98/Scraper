from flask import Flask, render_template

from routes.equipos import (
    equipos_bp
)

from routes.estadisticas import (
    estadisticas_bp
)

from routes.mercados import mercados_bp
# =============================================================================
# FLASK
# =============================================================================

app = Flask(
    __name__
)


# =============================================================================
# BLUEPRINTS
# =============================================================================

app.register_blueprint(
    equipos_bp
)

app.register_blueprint(
    estadisticas_bp
)

app.register_blueprint(mercados_bp)


# =============================================================================
# PÁGINA PRINCIPAL
# =============================================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# =============================================================================
# EJECUTAR
# =============================================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )