from locust import HttpUser, constant, task

from config import settings


class APIUser(HttpUser):
    weight: int = 1
    host: str = settings.TARGET_INSTANCE_BASE_URL
    token_auth_header: dict[str, str] | None = (
        {"Authorization": f"Bearer {settings.ACCESS_TOKEN}"}
        if settings.ACCESS_TOKEN
        else None
    )
    basic_auth_header: dict[str, str] | None = (
        {"Authorization": f"Basic {settings.BASE_AUTH_TOKEN}"}
        if settings.BASE_AUTH_TOKEN
        else None
    )
    wait_time: int = constant(2)
    timeout: int = 5

    @task
    def get_meta(self):
        headers = self.token_auth_header
        with self.client.get(
            "/api/grid/meta",
            name="GET /api/grid/meta",
            timeout=self.timeout,
            catch_response=True,
            headers=headers,
        ) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Unexpected status {res.status_code}")

    @task
    def get_report(self):
        headers = self.basic_auth_header
        with self.client.get(
            "/es/report/grid",
            name="GET /es/report/grid",
            timeout=self.timeout,
            catch_response=True,
            headers=headers,
        ) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Unexpected status {res.status_code}")

    @task
    def get_indicators(self):
        headers = self.basic_auth_header
        with self.client.get(
            "/es/report/indicators?bbox=-18088914.17579878%2C-4006854.261100858%2C696249.8955611419%2C2959310.748695113&_rsc=1uviz",
            name="GET /es/report/indicators",
            timeout=self.timeout,
            catch_response=True,
            headers=headers,
        ) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Unexpected status {res.status_code}")

    @task
    def get_results(self):
        headers = self.basic_auth_header
        with self.client.get(
            "/es/report/results?topics={%22id%22:1%252C%22indicators%22:[{%22id%22:9%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:0%252C%22y%22:2}%252C{%22id%22:13%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:2%252C%22y%22:2}%252C{%22id%22:11%252C%22type%22:%22chart%22%252C%22w%22:2%252C%22h%22:2%252C%22x%22:0%252C%22y%22:0}%252C{%22id%22:6%252C%22type%22:%22chart%22%252C%22w%22:2%252C%22h%22:2%252C%22x%22:2%252C%22y%22:0}]},{%22id%22:2%252C%22indicators%22:[{%22id%22:17%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:0%252C%22y%22:0}%252C{%22id%22:18%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:1%252C%22y%22:0}%252C{%22id%22:31%252C%22type%22:%22chart%22%252C%22w%22:2%252C%22h%22:2%252C%22x%22:2%252C%22y%22:1}%252C{%22id%22:26%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:2%252C%22y%22:0}%252C{%22id%22:34%252C%22type%22:%22chart%22%252C%22w%22:2%252C%22h%22:2%252C%22x%22:2%252C%22y%22:3}%252C{%22id%22:14%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:0%252C%22y%22:1}%252C{%22type%22:%22numeric%22%252C%22id%22:28%252C%22x%22:3%252C%22y%22:0%252C%22w%22:1%252C%22h%22:1}]},{%22id%22:3%252C%22indicators%22:[{%22id%22:35%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:0%252C%22y%22:0}%252C{%22id%22:37%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:2%252C%22y%22:1}]},{%22id%22:4%252C%22indicators%22:[{%22id%22:41%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:1%252C%22y%22:0}%252C{%22id%22:40%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:0%252C%22y%22:0}%252C{%22id%22:46%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:2%252C%22y%22:0}%252C{%22id%22:39%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:0%252C%22y%22:1}%252C{%22id%22:51%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:3%252C%22y%22:0}%252C{%22id%22:51%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:2%252C%22y%22:1}]},{%22id%22:5%252C%22indicators%22:[{%22id%22:52%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:0%252C%22y%22:0}%252C{%22id%22:53%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:1%252C%22y%22:0}%252C{%22id%22:56%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:2%252C%22y%22:0}%252C{%22id%22:55%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:3%252C%22y%22:0}%252C{%22id%22:54%252C%22type%22:%22map%22%252C%22w%22:4%252C%22h%22:4%252C%22x%22:0%252C%22y%22:1}]},{%22id%22:6%252C%22indicators%22:[{%22id%22:63%252C%22type%22:%22map%22%252C%22w%22:2%252C%22h%22:4%252C%22x%22:2%252C%22y%22:0}%252C{%22id%22:59%252C%22type%22:%22chart%22%252C%22w%22:2%252C%22h%22:3%252C%22x%22:0%252C%22y%22:1}%252C{%22id%22:62%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:0%252C%22y%22:0}%252C{%22id%22:60%252C%22type%22:%22numeric%22%252C%22w%22:1%252C%22h%22:1%252C%22x%22:1%252C%22y%22:0}]},{%22id%22:8%252C%22indicators%22:[{%22type%22:%22map%22%252C%22id%22:64%252C%22x%22:0%252C%22y%22:0%252C%22w%22:2%252C%22h%22:4}%252C{%22type%22:%22table%22%252C%22id%22:64%252C%22x%22:2%252C%22y%22:0%252C%22w%22:2%252C%22h%22:4}]},{%22id%22:7%252C%22indicators%22:[]}&location={%22type%22:%22point%22,%22geometry%22:{%22spatialReference%22:{%22wkid%22:102100},%22x%22:-7483123.627176825,%22y%22:-308525.0845518727},%22buffer%22:60}&aiSummary={%22type%22:%22Short%22,%22only_active%22:true,%22enabled%22:true}",
            name="GET /es/report/results",
            timeout=self.timeout,
            catch_response=True,
            headers=headers,
        ) as res:
            if res.status_code == 200:
                res.success()
            else:
                res.failure(f"Unexpected status {res.status_code}")
