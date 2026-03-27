from functools import wraps
from flask import jsonify, make_response
from models import Role, User
from flask_jwt_extended import get_jwt_identity


def login_required(func):
    """Check if logged in via jwt"""

    @wraps(func)
    def wrap_func(*args, **kwargs):
        username = get_jwt_identity()
        current_user = User.query.filter_by(username=username).first()
        if not current_user:
            return jsonify({"error": "user not found"}), 401
        else:
            return func(*args, **kwargs)

    return wrap_func


def zero_access_level(func):
    """Decorator to restrict actions to zero access level"""

    @wraps(func)
    def wrap_func(*args, **kwargs):
        username = get_jwt_identity()
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "user not found"}), 401

        role_obj = Role.query.filter_by(name=user.role).first()
        print((role_obj.access_level, role_obj) if role_obj else "Doesn't exist")
        if role_obj and role_obj.access_level == 0:
            return func(*args, **kwargs)
        else:
            return make_response(jsonify({"error": "access denied"}), 403)

    return wrap_func


def restrict_access(func):
    """Restricts access level to whatever is passed in the parameters and department based access also"""

    @wraps(func)
    def wrap_func(*args, **kwargs):
        dept = kwargs.get("dept", "any")
        access_level = kwargs.get("access_level", 0)
        username = get_jwt_identity()
        current_user = User.query.filter_by(username=username).first()
        if not current_user:
            return jsonify({"error": "user not found"}), 401
        user_role = current_user.role
        user_dept = current_user.department

        if (
            not user_role
            or not user_dept
            or not user_role == access_level
            or not user_dept == dept
        ):
            return make_response(jsonify({"error": "access denied"}), 403)
        else:
            return func(*args, **kwargs)

    return wrap_func
