# Backward-compatibility alias pointing to db.mongodb
from db.mongodb import mongodb, MongoDB

__all__ = ["mongodb", "MongoDB"]
