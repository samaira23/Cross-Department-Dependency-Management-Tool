from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from flask_login import UserMixin


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


class User(UserMixin, db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(nullable=False, unique=True)
    email: Mapped[str] = mapped_column(nullable=False, unique=True)
    password: Mapped[str] = mapped_column(db.String(512), nullable=False)
    role: Mapped[str] = mapped_column(
        db.String(30), nullable=False
    )  # Role name from the Role class
    department: Mapped[str] = mapped_column(db.String(30), nullable=False)


class Role(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(unique=True)
    access_level: Mapped[int] = mapped_column(nullable=False)


class Department(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(unique=True)


class Node(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(unique=False, nullable=False)
    type: Mapped[str] = mapped_column(nullable=False)  # Task or Dependency
    dept_id: Mapped[int] = mapped_column(nullable=False)  # Dept id
    creator: Mapped[int] = mapped_column(
        nullable=False
    )  # User id of the person who created this
    resolved: Mapped[bool] = mapped_column(nullable=False, default=False)


class Dependency(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    dep_from: Mapped[int] = mapped_column(nullable=False)  # From node id
    dep_to: Mapped[int] = mapped_column(nullable=False)  # To node id
    created_by: Mapped[int] = mapped_column(
        nullable=False
    )  # User id of the one who created this
    link_type: Mapped[str] = mapped_column(
        db.String(20), nullable=False
    )  # Blocks or depends


# A transaction (for now) is simply the node that was modified, (not saving the node states for now but I might serialize it later)
class Transaction(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    node_id: Mapped[int] = mapped_column(nullable=False)
