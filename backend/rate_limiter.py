"""
Rate limiting middleware for security.

This module provides rate limiting functionality to prevent brute-force attacks
on authentication endpoints and protect API resources.
"""
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Simple in-memory rate limiter.
    
    For production, consider using Redis-based rate limiting for distributed systems.
    """
    
    def __init__(self):
        # Store: {key: [(timestamp, count), ...]}
        self._requests: dict[str, list[datetime]] = defaultdict(list)
        self._blocked: dict[str, datetime] = {}
    
    def _cleanup_old_requests(self, key: str, window_seconds: int):
        """Remove requests outside the current window."""
        cutoff = datetime.now() - timedelta(seconds=window_seconds)
        self._requests[key] = [
            ts for ts in self._requests[key] if ts > cutoff
        ]
    
    def is_blocked(self, key: str) -> tuple[bool, Optional[int]]:
        """Check if a key is currently blocked."""
        if key in self._blocked:
            blocked_until = self._blocked[key]
            if datetime.now() < blocked_until:
                remaining = int((blocked_until - datetime.now()).total_seconds())
                return True, remaining
            else:
                # Block has expired
                del self._blocked[key]
        return False, None
    
    def check_rate_limit(
        self, 
        key: str, 
        max_requests: int, 
        window_seconds: int,
        block_duration_seconds: int = 0
    ) -> tuple[bool, dict]:
        """
        Check if a request is within rate limits.
        
        Args:
            key: Unique identifier (e.g., IP address, user ID)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            block_duration_seconds: How long to block if limit exceeded (0 = no blocking)
        
        Returns:
            Tuple of (is_allowed, info_dict)
        """
        # Check if already blocked
        is_blocked, remaining = self.is_blocked(key)
        if is_blocked:
            return False, {
                "error": "RATE_LIMITED",
                "message": f"Too many requests. Please wait {remaining} seconds.",
                "retry_after": remaining
            }
        
        # Cleanup old requests
        self._cleanup_old_requests(key, window_seconds)
        
        # Check current count
        current_count = len(self._requests[key])
        
        if current_count >= max_requests:
            # Rate limit exceeded
            if block_duration_seconds > 0:
                self._blocked[key] = datetime.now() + timedelta(seconds=block_duration_seconds)
            
            logger.warning(f"Rate limit exceeded for {key}: {current_count}/{max_requests}")
            
            return False, {
                "error": "RATE_LIMITED",
                "message": f"Too many requests. Maximum {max_requests} requests per {window_seconds} seconds.",
                "retry_after": block_duration_seconds if block_duration_seconds > 0 else window_seconds
            }
        
        # Request is allowed, record it
        self._requests[key].append(datetime.now())
        
        return True, {
            "remaining": max_requests - current_count - 1,
            "limit": max_requests,
            "window": window_seconds
        }
    
    def record_failed_attempt(self, key: str):
        """Record a failed attempt (e.g., wrong password)."""
        self._requests[key].append(datetime.now())
    
    def reset(self, key: str):
        """Reset rate limit for a key (e.g., after successful login)."""
        if key in self._requests:
            del self._requests[key]
        if key in self._blocked:
            del self._blocked[key]


# Global rate limiter instances
login_limiter = RateLimiter()
signup_limiter = RateLimiter()
api_limiter = RateLimiter()


# Rate limit configurations
RATE_LIMITS = {
    "login": {
        "max_requests": 5,
        "window_seconds": 60,  # 5 attempts per minute
        "block_duration_seconds": 300  # 5 minute block after exceeded
    },
    "signup": {
        "max_requests": 3,
        "window_seconds": 60,  # 3 signups per minute per IP
        "block_duration_seconds": 600  # 10 minute block
    },
    "password_reset": {
        "max_requests": 3,
        "window_seconds": 300,  # 3 per 5 minutes
        "block_duration_seconds": 900  # 15 minute block
    },
    "ai_chat": {
        "max_requests": 30,
        "window_seconds": 60,  # 30 messages per minute
        "block_duration_seconds": 60  # 1 minute cooldown
    }
}


def get_client_ip(request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded header (behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to client host
    return request.client.host if request.client else "unknown"


def check_login_rate_limit(client_ip: str) -> tuple[bool, dict]:
    """Check rate limit for login attempts."""
    config = RATE_LIMITS["login"]
    return login_limiter.check_rate_limit(
        key=f"login:{client_ip}",
        max_requests=config["max_requests"],
        window_seconds=config["window_seconds"],
        block_duration_seconds=config["block_duration_seconds"]
    )


def check_signup_rate_limit(client_ip: str) -> tuple[bool, dict]:
    """Check rate limit for signup attempts."""
    config = RATE_LIMITS["signup"]
    return signup_limiter.check_rate_limit(
        key=f"signup:{client_ip}",
        max_requests=config["max_requests"],
        window_seconds=config["window_seconds"],
        block_duration_seconds=config["block_duration_seconds"]
    )


def check_ai_chat_rate_limit(user_id: int) -> tuple[bool, dict]:
    """Check rate limit for AI chat messages."""
    config = RATE_LIMITS["ai_chat"]
    return api_limiter.check_rate_limit(
        key=f"chat:{user_id}",
        max_requests=config["max_requests"],
        window_seconds=config["window_seconds"],
        block_duration_seconds=config["block_duration_seconds"]
    )


def record_failed_login(client_ip: str):
    """Record a failed login attempt."""
    login_limiter.record_failed_attempt(f"login:{client_ip}")


def reset_login_limiter(client_ip: str):
    """Reset login rate limit after successful authentication."""
    login_limiter.reset(f"login:{client_ip}")
