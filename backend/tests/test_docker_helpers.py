from app.runtime.docker_runtime import cpu_percent, format_ports, memory_usage


def test_cpu_percent_matches_docker_stats_formula():
    stats = {
        "cpu_stats": {"cpu_usage": {"total_usage": 2_000_000}, "system_cpu_usage": 20_000_000, "online_cpus": 4},
        "precpu_stats": {"cpu_usage": {"total_usage": 1_000_000}, "system_cpu_usage": 10_000_000},
    }
    assert cpu_percent(stats) == 40.0  # 1e6 / 1e7 * 4 cores * 100
    assert cpu_percent({}) == 0.0
    assert cpu_percent({**stats, "precpu_stats": stats["cpu_stats"]}) == 0.0


def test_memory_excludes_page_cache():
    stats = {"memory_stats": {"usage": 100, "limit": 1000, "stats": {"inactive_file": 30}}}
    assert memory_usage(stats) == (70, 1000)
    assert memory_usage({"memory_stats": {"usage": 50, "limit": 9, "stats": {"total_inactive_file": 60}}}) == (0, 9)


def test_format_ports():
    ports = {"80/tcp": [{"HostIp": "127.0.0.1", "HostPort": "8080"}, {"HostIp": "::", "HostPort": "8080"}],
             "443/tcp": None, "53/udp": [{"HostIp": "0.0.0.0", "HostPort": "5353"}]}
    assert format_ports(ports) == "443/tcp, 5353->53/udp, 127.0.0.1:8080->80/tcp, 8080->80/tcp"
    assert format_ports(None) == ""
