"""
Rate limiter tests.
"""
from rate_limiter import (
    RateLimiter,
    check_login_rate_limit,
    record_failed_login,
    reset_login_limiter
)

def test_rate_limiter_allows_requests_within_limit():
    """Requests within limit should be allowed."""
    limiter = RateLimiter()
    
    for i in range(5):
        is_allowed, info = limiter.check_rate_limit(
            key="test_key",
            max_requests=5,
            window_seconds=60
        )
        assert is_allowed is True
        assert "remaining" in info

def test_rate_limiter_blocks_over_limit():
    """Requests over limit should be blocked."""
    limiter = RateLimiter()
    
    # Use up all allowed requests
    for i in range(5):
        limiter.check_rate_limit("test_key", max_requests=5, window_seconds=60)
    
    # 6th request should be blocked
    is_allowed, info = limiter.check_rate_limit(
        key="test_key",
        max_requests=5,
        window_seconds=60
    )
    
    assert is_allowed is False
    assert info["error"] == "RATE_LIMITED"
    assert "retry_after" in info

def test_rate_limiter_blocking():
    """Test that blocking works correctly."""
    limiter = RateLimiter()
    
    # Exceed limit with blocking enabled
    for i in range(6):
        limiter.check_rate_limit(
            key="block_test",
            max_requests=5,
            window_seconds=60,
            block_duration_seconds=300
        )
    
    # Should be blocked
    is_blocked, remaining = limiter.is_blocked("block_test")
    assert is_blocked is True
    assert remaining is not None
    assert remaining > 0

def test_rate_limiter_reset():
    """Test that reset clears rate limit."""
    limiter = RateLimiter()
    
    # Use up requests
    for i in range(5):
        limiter.check_rate_limit("reset_test", max_requests=5, window_seconds=60)
    
    # Reset
    limiter.reset("reset_test")
    
    # Should be allowed again
    is_allowed, _ = limiter.check_rate_limit("reset_test", max_requests=5, window_seconds=60)
    assert is_allowed is True

def test_login_rate_limit():
    """Test login rate limit function."""
    # Reset first
    reset_login_limiter("192.168.1.1")
    
    # First few attempts should pass
    for i in range(3):
        is_allowed, info = check_login_rate_limit("192.168.1.1")
        assert is_allowed is True
    
    # Record failed attempts
    record_failed_login("192.168.1.1")
    record_failed_login("192.168.1.1")
    
    # After 5 total, should be blocked
    is_allowed, info = check_login_rate_limit("192.168.1.1")
    assert is_allowed is False

def test_different_ips_independent():
    """Different IPs should have independent limits."""
    limiter = RateLimiter()
    
    # Exhaust limit for IP1
    for i in range(5):
        limiter.check_rate_limit("ip1", max_requests=5, window_seconds=60)
    
    # IP2 should still be allowed
    is_allowed, _ = limiter.check_rate_limit("ip2", max_requests=5, window_seconds=60)
    assert is_allowed is True
