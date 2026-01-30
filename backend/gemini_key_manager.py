"""
Gemini API Key Manager

Manages a pool of Gemini API keys with random selection and retry support.
Supports both GEMINI_API_KEYS (comma-separated) and single GEMINI_API_KEY for backward compatibility.
"""

import os
import random
import logging
from typing import Optional, Tuple, List
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiKeyManager:
    """Manages a pool of Gemini API keys with random selection."""
    
    def __init__(self):
        """Initialize the key manager by parsing environment variables."""
        # Check for Replit integration first
        self.replit_api_key = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY")
        self.replit_base_url = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL")
        self.use_replit = bool(self.replit_api_key and self.replit_base_url)
        
        if self.use_replit:
            # Replit integration uses a single key
            self.keys = [self.replit_api_key]
            logger.info("GeminiKeyManager: Using Replit AI integration")
        else:
            # Parse comma-separated keys from GEMINI_API_KEYS
            # Handle keys that might have newlines or extra whitespace (from Render env vars)
            keys_str = os.environ.get("GEMINI_API_KEYS", "")
            if keys_str:
                # Remove all whitespace including newlines, then split by comma
                cleaned_keys_str = "".join(keys_str.split())
                self.keys = [k.strip() for k in cleaned_keys_str.split(",") if k.strip()]
                logger.info(f"GeminiKeyManager: Loaded {len(self.keys)} API keys from GEMINI_API_KEYS")
                # Log first few chars of each key for debugging (not full key)
                for i, key in enumerate(self.keys):
                    logger.info(f"  Key #{i+1}: {key[:10]}...{key[-4:]} (len={len(key)})")
            else:
                # Fall back to single GEMINI_API_KEY for backward compatibility
                single_key = os.environ.get("GEMINI_API_KEY", "")
                self.keys = [single_key] if single_key else []
                if self.keys:
                    logger.info("GeminiKeyManager: Using single GEMINI_API_KEY (backward compatibility)")
                else:
                    logger.warning("GeminiKeyManager: No API keys configured! Set GEMINI_API_KEYS or GEMINI_API_KEY")
        
        self.model_name = "gemini-2.0-flash"
        
        # Log initialization summary
        print(f"[STARTUP] GeminiKeyManager initialized with {len(self.keys)} keys")
    
    def has_keys(self) -> bool:
        """Check if any API keys are available."""
        return len(self.keys) > 0
    
    def get_random_key(self, exclude_indices: Optional[List[int]] = None) -> Tuple[Optional[str], int]:
        """
        Get a randomly selected API key.
        
        Args:
            exclude_indices: List of key indices to exclude from selection (for retry logic)
        
        Returns:
            Tuple of (api_key, key_index). Returns (None, -1) if no keys available.
        """
        if not self.keys:
            return None, -1
        
        # Build list of available indices
        available_indices = list(range(len(self.keys)))
        if exclude_indices:
            available_indices = [i for i in available_indices if i not in exclude_indices]
        
        if not available_indices:
            # All keys exhausted, return None
            return None, -1
        
        # Randomly select from available keys
        key_index = random.choice(available_indices)
        return self.keys[key_index], key_index
    
    def create_client(self, exclude_indices: Optional[List[int]] = None) -> Tuple[Optional[genai.Client], int]:
        """
        Create a Gemini client with a randomly selected API key.
        
        Args:
            exclude_indices: List of key indices to exclude from selection
        
        Returns:
            Tuple of (client, key_index). Returns (None, -1) if no keys available.
        """
        api_key, key_index = self.get_random_key(exclude_indices)
        
        if api_key is None:
            return None, -1
        
        # Log key index (NOT the actual key for security)
        logger.info(f"Using Gemini API key #{key_index + 1} of {len(self.keys)}")
        
        if self.use_replit:
            client = genai.Client(
                api_key=api_key,
                http_options={
                    'api_version': '',
                    'base_url': self.replit_base_url
                }
            )
        else:
            client = genai.Client(api_key=api_key)
        
        return client, key_index
    
    def get_model_name(self) -> str:
        """Get the model name to use."""
        return self.model_name


# Global instance for convenience
key_manager = GeminiKeyManager()
