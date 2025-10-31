"""
Locust load testing file.

This module dynamically generates load test tasks from request definitions.
"""

from locust import HttpUser, constant, task

from config import settings
from request_specs import AuthType, HttpMethod, RequestDefinition, get_all_requests


class APIUser(HttpUser):
    """API load test user.

    Tasks are dynamically generated from request definitions.
    """

    weight: int = 1
    host: str = settings.TARGET_INSTANCE_BASE_URL
    wait_time: int = constant(2)
    timeout: int = 5

    def _get_auth_headers(self, auth_type: AuthType) -> dict[str, str] | None:
        """Get authentication headers based on auth type.

        Args:
            auth_type: Type of authentication to use

        Returns:
            Dictionary of headers or None if no auth needed
        """
        if auth_type == AuthType.TOKEN and settings.ACCESS_TOKEN:
            return {"Authorization": f"Bearer {settings.ACCESS_TOKEN}"}
        elif auth_type == AuthType.BASIC and settings.BASE_AUTH_TOKEN:
            return {"Authorization": f"Basic {settings.BASE_AUTH_TOKEN}"}
        return None

    def _make_request(self, request_def: RequestDefinition) -> None:
        """Execute an HTTP request based on the request definition.

        Args:
            request_def: RequestDefinition object containing request details
        """
        # Prepare headers
        headers = self._get_auth_headers(request_def.auth_type)
        if request_def.headers:
            headers = {**(headers or {}), **request_def.headers}

        # Select the appropriate HTTP method
        method_map = {
            HttpMethod.GET: self.client.get,
            HttpMethod.POST: self.client.post,
            HttpMethod.PUT: self.client.put,
            HttpMethod.DELETE: self.client.delete,
            HttpMethod.PATCH: self.client.patch,
        }

        http_method = method_map.get(request_def.method)
        if not http_method:
            raise ValueError(f"Unsupported HTTP method: {request_def.method}")

        # Prepare request kwargs
        request_kwargs = {
            "name": request_def.name,
            "timeout": self.timeout,
            "catch_response": True,
            "headers": headers,
        }

        # Add payload for methods that support it
        if request_def.payload and request_def.method in [
            HttpMethod.POST,
            HttpMethod.PUT,
            HttpMethod.PATCH,
        ]:
            if isinstance(request_def.payload, dict):
                request_kwargs["json"] = request_def.payload
            else:
                request_kwargs["data"] = request_def.payload

        # Execute request
        with http_method(request_def.path, **request_kwargs) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Unexpected status {res.status_code}")


# Dynamically create task methods from request definitions
def _create_task_method(request_def: RequestDefinition):
    """Factory function to create a task method for a request definition.

    Args:
        request_def: RequestDefinition object

    Returns:
        A task method that executes the request
    """

    @task
    def task_method(self):
        self._make_request(request_def)

    # Set a readable name for the task method
    task_method.__name__ = (
        f"task_{request_def.name.replace('/', '_').replace(' ', '_').lower()}"
    )
    return task_method


# Attach all request definitions as tasks to the APIUser class
for req_def in get_all_requests():
    task_method = _create_task_method(req_def)
    setattr(APIUser, task_method.__name__, task_method)

# Explicitly populate the tasks list for Locust to recognize them
# This is necessary because we're adding tasks dynamically after class definition
if not hasattr(APIUser, "tasks") or not APIUser.tasks:
    APIUser.tasks = [
        getattr(APIUser, attr)
        for attr in dir(APIUser)
        if hasattr(getattr(APIUser, attr, None), "locust_task_weight")
    ]
