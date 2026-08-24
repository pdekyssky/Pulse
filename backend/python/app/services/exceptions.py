class NotFoundError(Exception):
    """Raised when a requested database resource does not exist."""

    def __init__(self, resource: str, identifier: int | str) -> None:
        self.resource = resource
        self.identifier = identifier
        super().__init__(f"{resource} with id '{identifier}' was not found")


class ForbiddenError(Exception):
    """Raised when the authenticated user lacks permission for an action."""

    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__(message)
