from flask import Flask, jsonify, request, render_template, redirect, url_for
from dotenv import load_dotenv
import os
import secrets
from models import db, User, Role, Department, Node, Transaction, Dependency
import hashlib
from flask_admin import Admin
from flask_admin.base import Bootstrap4Theme
from admin import ProtectedIndexView
from utils import zero_access_level, restrict_access, login_required
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from flask_cors import CORS

load_dotenv()

# Load environment vars
db_uri = os.getenv("DB_URI", "sqlite:///project.db")
dev_mode = True
admin_username = os.getenv("ADMIN_USERNAME", "administrator")
admin_password = hashlib.sha256(
    os.getenv("ADMIN_PASSWORD", "pleasechangethispassword").encode()
).hexdigest()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.secret_key = secrets.token_hex(32)

jwt = JWTManager(app)
CORS(app)

db.init_app(app)

with app.app_context():
    db.create_all()

    obj_role = Role.query.filter_by(access_level=0).first()
    obj_dept = Department.query.filter_by(name="administration").first()
    if not obj_role:
        obj_role = Role(name="admin", access_level=0)
        db.session.add(obj_role)

    if not obj_dept:
        obj_dept = Department(name="administration")
        db.session.add(obj_dept)

    obj = User.query.filter_by(username=admin_username).first()
    if obj is None:
        admin_user = User(
            username=admin_username,
            password=admin_password,
            email="admin@example.com",
            role="admin",
            department="administration",  # 0 is always a null department
        )
        db.session.add(admin_user)

    db.session.commit()

# Login
admin = Admin(
    app, theme=Bootstrap4Theme(swatch="darkly"), index_view=ProtectedIndexView()
)


@app.route("/")
def index():
    return "<h1>Nothing here lol</h1>"


# User Creation
@app.route("/api/user/create", methods=["POST"])
@jwt_required()
@login_required
# @zero_access_level  # -> Still broken
def create_user():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 500
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    role = data.get("role")  # Role ID
    dept = data.get("dept")  # Dept ID
    if not username or not email or not password or not role:
        return jsonify({"Error": "All fields not filled"}), 400
    try:
        new_user = User(
            username=username,
            password=hashlib.sha256(password.encode()).hexdigest(),
            email=email,
            role=role,
            department=dept
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"success": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/update", methods=["PUT"])
@jwt_required()
@login_required
def update_user():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    if username:
        current_user.username = username
    if email:
        current_user.email = email
    if password:
        current_user.password = hashlib.sha256(password.encode()).hexdigest()
    try:
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/read")
@jwt_required()
@login_required
def read_user():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    """Profile page stuff"""
    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
    }), 200


@app.route("/api/user/list", methods=["GET"])
@jwt_required()
@login_required
def list_users():
    if request.method == "GET":
        users = User.query.all()
        res = []
        for i in users:
            res.append({"id":i.id, "name": i.username, "department": i.department})
        return jsonify({"success":True, "users":res}), 200


@app.route("/api/user/delete", methods=["DELETE"])
@jwt_required()
@login_required
def delete_user():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    try:
        user = db.session.get(User, current_user.id)
        logout_user()
        db.session.delete(user)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Department
@app.route("/api/department/create", methods=["POST"])
@jwt_required()
@login_required
@zero_access_level
def create_department():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    data = request.get_json()
    if data is None:
        return jsonify({"error": "empty json"}), 400
    new_dept = Department(name=data.get("dept_name"))
    db.session.add(new_dept)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/api/department/read")
@jwt_required()
@login_required
def read_department():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    departments = Department.query.all()
    result = [{"id": d.id, "name": d.name} for d in departments]
    return jsonify(result), 200


@app.route("/api/department/update", methods=["PUT"])
@jwt_required()
@login_required
@zero_access_level
def update_department():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    dept_id = data.get("dept_id")
    dept_name = data.get("dept_name")
    if dept_id is None:
        return jsonify({"error": "dept_id is required"}), 400
    dept = db.session.get(Department, int(dept_id))
    if dept is None:
        return jsonify({"error": "Department not found"}), 404
    if dept_name:
        dept.name = dept_name
    try:
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/department/delete", methods=["DELETE"])
@jwt_required()
@login_required
@zero_access_level
def delete_department():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    dept_id = data.get("dept_id")
    if dept_id is None:
        return jsonify({"error": "dept_id is required"}), 400
    dept = db.session.get(Department, int(dept_id))
    if dept is None:
        return jsonify({"error": "Department not found"}), 404
    try:
        db.session.delete(dept)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Roles
@app.route("/api/role/create", methods=["POST"])
@jwt_required()
@login_required
@zero_access_level
def create_role():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    new_role = Role(
        name=data.get("role_name"),
        access_level=int(data.get("access_level")),
    )
    db.session.add(new_role)
    db.session.commit()
    return jsonify({"success": True}), 201


@app.route("/api/role/read")
@jwt_required()
@login_required
def read_role():
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    roles = Role.query.all()
    result = [{"id": r.id, "name": r.name, "access_level": r.access_level} for r in roles]
    return jsonify(result), 200


@app.route("/api/role/update", methods=["PUT"])
@jwt_required()
@login_required
@zero_access_level
def update_role():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    role_id = data.get("role_id")
    if role_id is None:
        return jsonify({"error": "role_id is required"}), 400
    role = db.session.get(Role, int(role_id))
    if role is None:
        return jsonify({"error": "Role not found"}), 404
    role_name = data.get("role_name")
    access_level = data.get("access_level")
    if role_name:
        role.name = role_name
    if access_level is not None:
        role.access_level = int(access_level)
    try:
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/role/delete", methods=["DELETE"])
@jwt_required()
@login_required
@zero_access_level
def delete_role():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    role_id = data.get("role_id")
    if role_id is None:
        return jsonify({"error": "role_id is required"}), 400
    role = db.session.get(Role, int(role_id))
    if role is None:
        return jsonify({"error": "Role not found"}), 404
    try:
        db.session.delete(role)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Nodes
@app.route("/api/node/create", methods=["POST"])
@jwt_required()
@login_required
def create_node():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    name = data.get("name")
    node_type = data.get("type")
    dept_id = data.get("dept_id")
    if not name or not node_type or dept_id is None:
        return jsonify({"error": "name, type, and dept_id are required"}), 400
    try:
        new_node = Node(
            name=name,
            type=node_type,
            dept_id=int(dept_id),
            creator=current_user.id,
        )
        db.session.add(new_node)
        db.session.flush()
        transaction = Transaction(node_id=new_node.id)
        db.session.add(transaction)
        db.session.commit()
        return jsonify({"success": True, "node_id": new_node.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/node/read")
@jwt_required()
@login_required
def read_node():
    dept_id = request.args.get("dept_id")
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if dept_id is not None:
        nodes = Node.query.filter_by(dept_id=int(dept_id)).all()
    else:
        nodes = Node.query.all()
    result = [
        {
            "id": n.id,
            "name": n.name,
            "type": n.type,
            "dept_id": n.dept_id,
            "creator": n.creator,
        }
        for n in nodes
    ]
    return jsonify(result), 200


@app.route("/api/node/update", methods=["PUT"])
@jwt_required()
@login_required
def update_node():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    node_id = data.get("node_id")
    if node_id is None:
        return jsonify({"error": "node_id is required"}), 400
    node = db.session.get(Node, int(node_id))
    if node is None:
        return jsonify({"error": "Node not found"}), 404
    # Only creator or admin can update
    role_obj = Role.query.filter_by(name=current_user.role).first()
    is_admin = role_obj and role_obj.access_level == 0
    if node.creator != current_user.id and not is_admin:
        return jsonify({"error": "Access denied"}), 403
    if data.get("name"):
        node.name = data["name"]
    if data.get("type"):
        node.type = data["type"]
    if data.get("dept_id") is not None:
        node.dept_id = int(data["dept_id"])
    if data.get("links") is not None:
        node.links = data["links"]
    try:
        transaction = Transaction(node_id=node.id)
        db.session.add(transaction)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/node/delete", methods=["DELETE"])
@jwt_required()
@login_required
def delete_node():
    data = request.get_json()
    username = get_jwt_identity()
    current_user = User.query.filter_by(username=username).first()
    if data is None:
        return jsonify({"error": "Empty JSON"}), 400
    node_id = data.get("node_id")
    if node_id is None:
        return jsonify({"error": "node_id is required"}), 400
    node = db.session.get(Node, int(node_id))
    if node is None:
        return jsonify({"error": "Node not found"}), 404
    # Only creator or admin can delete
    role_obj = Role.query.filter_by(name=current_user.role).first()
    is_admin = role_obj and role_obj.access_level == 0
    if node.creator != current_user.id and not is_admin:
        return jsonify({"error": "Access denied"}), 403
    try:
        db.session.delete(node)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/dependency/create", methods=["POST"])
@jwt_required()
@login_required
def create_dependency():
    if request.method == 'POST':
        username = get_jwt_identity()
        current_user = User.query.filter_by(username=username).first()
        data = request.get_json()
        print(data)
        from_dep = int(data.get("from"))
        to_dep = int(data.get("to"))
        link_type = data.get("link_type").lower()
        try:
            dep = Dependency(dep_from=from_dep, dep_to=to_dep, created_by=current_user.id, link_type=link_type)
            db.session.add(dep)
            db.session.commit()
            return jsonify({"success":True}), 200
        except Exception as e:
            return jsonify({"error":str(e)}), 500
    else:
        return jsonify({"error":"method not allowed"}), 405

@app.route("/api/dependency/delete", methods=["POST"])
@jwt_required()
@login_required
def delete_dependency():
    if request.method == "POST":
        data = request.get_json()
        dep_id = data.get("id")

        try:
            dep = Dependency.query.get(dep_id)

            if not dep:
                return jsonify({"error": "Dependency not found"}), 404

            db.session.delete(dep)
            db.session.commit()

            return jsonify({"success": True}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "method not allowed"}), 405


@app.route("/api/dependency/read", methods=["GET"])
@jwt_required()
@login_required
def read_dependencies():
    if request.method == "GET":
        deps = Dependency.query.all()
        res = []
        try:
            for i in deps:
                res.append({"id":i.id, "from": i.dep_from, "to": i.dep_to, "link":i.link_type})

            return jsonify({"success":True, "dependencies":res}), 200
        except Exception as e:
            return jsonify({"error":str(e)}), 500

@app.route("/api/user/login", methods=["POST"])
def login_admin():
    if request.method == "POST":
        data = request.get_json()
        username = data.get("username")
        password = hashlib.sha256(data.get("password").encode()).hexdigest()
        user = User.query.filter_by(username=username).first()
        if user is None:
            return jsonify({"error": "invalid credentials"}), 401
        else:
            if password != user.password or username != user.username:
                return jsonify({"error": "invalid credentials"}), 401

        if user.username == username and user.password == password:
            access_token = create_access_token(identity=username)
            return jsonify({"success": "true", "access_token":access_token}), 200


if __name__ == "__main__":
    app.run(debug=dev_mode, port=8000,  host="0.0.0.0")
